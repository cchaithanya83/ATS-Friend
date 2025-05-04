import asyncio
from app.core.llm import text_gen
import subprocess
from pathlib import Path
from fastapi.responses import StreamingResponse
import io
import tempfile
from app.core.logs import logger


async def create_resume(resume_data: dict, job_title: str, job_description: str) -> str:
    """
    Generates a one-page ATS-friendly LaTeX resume, tailored to a specific job using a blue and black color scheme.
    """
    system_prompt = (
        "You are a professional LaTeX resume generator. Your task is to generate a polished, one-page resume in LaTeX format using only standard packages. "
        "Strictly follow these formatting and tailoring rules:\n"
        "1. Use only these LaTeX packages: article, geometry, amsmath, amssymb, enumitem, ragged2e, multicol, xcolor, helvet.\n"
        "2. The resume must fit a single A4 page with compact margins using \\geometry{margin=0.7in} and have a balanced layout with no excessive white space.\n"
        "3. Set font to Helvetica using \\usepackage{helvet} and \\renewcommand{\\familydefault}{\\sfdefault}.\n"
        "4. Use \\definecolor{cvblue}{RGB}{0,102,204} for section headings and bullet accents. All body text must be black.\n"
        "5. Sections: Personal Info, Objective, Education, Work Experience, Skills, Certifications, Projects, Hobbies, Languages.\n"
        "6. For each section, apply:\n"
        "   - Section titles in cvblue, bold, with spacing optimized for compactness.\n"
        "   - Personal Info: Centered name in bold, large font; email, phone, links below.\n"
        "   - Objective: One concise sentence summarizing experience, goals, and match with the job.\n"
        "   - Education & Work Experience: Use bold for title/degree, italics for company/institution, right-aligned dates, bullets for details.\n"
        "   - Skills: Bullet-pointed technical and soft skills, grouped and matched to the job.\n"
        "   - Projects: Bold titles, right-aligned date, bullets for impact and relevance.\n"
        "   - Only include non-empty sections; do not generate empty environments (e.g., \\begin{itemize} \\end{itemize}).\n"
        "7. Tailoring:\n"
        "   - Prioritize and emphasize content most relevant to the job description.\n"
        "   - You may reorder sections to highlight alignment with the job.\n"
        "   - Compress, merge, or drop less relevant experiences if space is tight.\n"
        "   - Match technical terms, skills, and achievements to the job description using clear, concise language.\n"
        "   - Do NOT include the job title or description text in the output.\n"
        "8. Final output must be complete, compilable with pdflatex, and free of errors, comments, or explanations.\n"
        "9. Donot include page numbers or any empty lines. Donnot include any N/A or Null if not present dont include. \n"
        "10. Ensure the output is concise, professional, and visually balanced.\n"
        "11. Ensure the page has proper white space and is not too crowded. make sure everything is left aligned \n"
    )

    user_prompt = (
        f"Generate a LaTeX resume tailored to this job:\n"
        f"Job Title: {job_title}\n"
        f"Job Description: {job_description}\n"
        "Resume Data:\n"
        f"{resume_data}\n\n"
        "Format the resume as follows:\n"
        "- Personal Information (centered name in large bold, followed by email, phone, links).\n"
        "- Objective: One-line statement aligned with the job title and description.\n"
        "- Education: Degree (bold), Institution (italic), Dates (right-aligned), bullet points for details.\n"
        "- Work Experience: Title (bold), Company (italic), Dates (right-aligned), bullets for responsibilities.\n"
        "- Skills: Separate technical and soft skills as bullet points.\n"
        "- Projects: Title (bold), Dates (right-aligned), bullets for impact and relevance.\n"
        "- Certifications, Projects, Hobbies, Languages: Include only if available; use bullets and concise formatting.\n\n"
        "Tailor the resume content to emphasize relevance to the job. Reorder or condense sections to maintain a clean, compact A4 single-page layout. "
        "Match keywords, technologies, and impact statements to the job description wherever appropriate. Maintain ATS-friendliness by avoiding tables, images, hyperlinks, or non-standard constructs. "
        "Ensure output is concise, professional, and visually balanced."
    )

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