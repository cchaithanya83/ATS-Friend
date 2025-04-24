import asyncio
from app.core.llm import text_gen
import subprocess
from pathlib import Path
from fastapi.responses import StreamingResponse
import io
import tempfile
from app.core.logs import logger
async def create_resume(resume_data: dict, job_title: str, job_description: str) -> str:
    """Generates a resume in LaTeX format tailored to a specific job.

    Args:
        resume_data (dict): A dictionary containing resume details such as 
                           name, contact info, education, experience, skills.
        job_title (str): The title of the job being applied for.
        job_description (str): The description of the job to tailor the resume.

    Returns:
        str: The generated LaTeX resume code.
    """
    system_prompt = (
        "You are a professional resume generator. Generate a resume in LaTeX format only, "
        "returning exclusively the LaTeX code without any explanations, comments, or additional text. "
        "Use the 'moderncv' document class with the 'classic' style and 'blue' color scheme. "
        "Include sections for personal information, education, work experience, and skills. "
        "Ensure the code is complete, compilable, and produces a professional-looking PDF when processed with pdflatex. "
        "Use standard LaTeX packages and avoid any custom or non-standard commands."
        "Rules:\n"
        "1. Do not include any explanations or comments in the LaTeX code.\n"
        "2. Use the 'moderncv' document class with the 'classic' style and 'blue' color scheme.\n"
        "3. Include sections for personal information, education, work experience, and skills.\n"
        "Each \cventry has exactly 6 arguments, even if some are empty (e.g., {})."
        "4. Ensure the code is complete and compilable.\n"
        "No blank lines appear within \cventry commands.\n"
        "5. Use standard LaTeX packages and avoid any custom or non-standard commands.\n"
        "All braces are properly matched."
        "simple ats friendly resume with no photo and no links.\n"

        
    )
    user_prompt = (
        "Create a resume in LaTeX format tailored for the following job:\n"
        f"Job Title: {job_title}\n"
        f"Job Description: {job_description}\n"
        "Resume Details:\n"
        f"{resume_data}\n"
        "Structure the resume with clear sections for personal information (name, email, phone, address), "
        "education (degrees, institutions, years), work experience (job titles, companies, dates, responsibilities), "
        "and skills (technical and soft skills). "
        "Optimize the resume to align with the job description by prioritizing relevant skills, experiences, and keywords. "
        "Highlight achievements and responsibilities that match the job requirements. "
        "Use appropriate LaTeX formatting for a clean, professional layout. "
        "Ensure the LaTeX code is concise, optimized for quick compilation, and ATS-friendly."
        "simple ats friendly resume with no photo and no links.\n"
        "The resume should be in LaTeX format only, without any explanations or comments."
        'Make the resume match with the JD and donnot include the JD or J anme in the resume.\n'
        'resume should be only one page. with proper spacing and try not to have empty space\n'
        "The LaTeX code should be complete and compilable, producing a professional-looking PDF when processed with pdflatex.\n"
        "Use standard LaTeX packages and avoid any custom or non-standard commands.\n"
    )

    # Generate the resume using the text generation function
    generated_resume = await text_gen(system_prompt, user_prompt)
    
    return generated_resume



async def convert_latex_to_pdf(latex_code: str, output_filename: str = "resume") -> StreamingResponse:
    """Converts LaTeX code to a PDF and returns it as a streaming response without saving to disk.

    Args:
        latex_code (str): The LaTeX code to convert.
        output_filename (str): The name of the output PDF file (for the response header).

    Returns:
        StreamingResponse: A FastAPI StreamingResponse containing the generated PDF.

    Raises:
        RuntimeError: If pdflatex fails to generate the PDF.
    """
    # Clean LaTeX code
    clean_latex_code = latex_code.replace("```latex", "").replace("```", "").strip()
    logger.debug(f"Cleaned LaTeX code: {clean_latex_code}")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        tex_file = temp_path / f"{output_filename}.tex"
        
        logger.debug(f"Temporary directory: {temp_dir}")
        logger.debug(f"TeX file path: {tex_file}")
        
        # Write LaTeX code to a temporary .tex file
        with open(tex_file, "w", encoding="utf-8") as f:
            f.write(clean_latex_code)
        
        try:
            # Run pdflatex with nonstopmode and timeout
            process = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", f"-output-directory={temp_dir}", str(tex_file)],
                capture_output=True,
                text=True,
                check=False,
                timeout=30
            )
            
            # Log pdflatex output
            logger.debug(f"pdflatex stdout: {process.stdout}")
            logger.debug(f"pdflatex stderr: {process.stderr}")
            logger.debug(f"pdflatex exit code: {process.returncode}")
            
            # Check for pdflatex errors
            if process.returncode != 0:
                # Check log file for more details
                log_file = temp_path / f"{output_filename}.log"
                log_content = ""
                if log_file.exists():
                    with open(log_file, "r", encoding="utf-8") as f:
                        log_content = f.read()
                    logger.debug(f"pdflatex log: {log_content}")
                raise RuntimeError(
                    f"PDF generation failed: {process.stderr or 'No error message provided'}\nLog: {log_content}"
                )
            
            # Check if PDF was generated
            pdf_file = temp_path / f"{output_filename}.pdf"
            if not pdf_file.exists():
                logger.error(f"PDF file not found at: {pdf_file}")
                raise RuntimeError("PDF generation failed: Output file not found.")
            
            # Read the PDF content into memory
            with open(pdf_file, "rb") as f:
                pdf_content = f.read()
            
            # Create a BytesIO stream for the PDF
            pdf_stream = io.BytesIO(pdf_content)
            
            # Return the PDF as a StreamingResponse
            headers = {
                "Content-Disposition": f"attachment; filename={output_filename}.pdf",
                "Content-Type": "application/pdf",
                "Content-Length": str(len(pdf_content)),
            }

            logger.info(f"PDF generated successfully for {output_filename}")

            return StreamingResponse(
                content=pdf_stream,
                headers=headers,
                media_type="application/pdf"
            )
        
        except subprocess.CalledProcessError as e:
            logger.error(f"pdflatex error: {e.stderr}")
            raise RuntimeError(f"PDF generation failed: {e.stderr}")
        except subprocess.TimeoutExpired:
            logger.error("PDF generation timed out")
            raise RuntimeError("PDF generation timed out.")