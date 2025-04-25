import asyncio
from app.core.llm import text_gen
import subprocess
from pathlib import Path
from fastapi.responses import StreamingResponse
import io
import tempfile
from app.core.logs import logger


async def create_resume(resume_data: dict, job_title: str, job_description: str) -> str:
    """Generates a resume in LaTeX format tailored to a specific job with a blue and black color scheme.

    Args:
        resume_data (dict): A dictionary with resume details in the following structure:
            {
                'personal': {'name': str, 'email': str, 'phone': str, 'address': str},
                'education': [{'degree': str, 'institution': str, 'years': str, 'details': str}],
                'experience': [{'title': str, 'company': str, 'dates': str, 'responsibilities': list[str]}],
                'skills': {'technical': list[str], 'soft': list[str]}
            }
        job_title (str): The title of the job being applied for.
        job_description (str): The job description to tailor the resume.

    Returns:
        str: The generated LaTeX resume code, compilable with pdflatex.
    """
    system_prompt = (
    "You are a professional resume generator specializing in LaTeX. Generate a resume in LaTeX format using a custom blue and black color scheme. "
    "The resume must be ATS-friendly, one page, visually appealing, and include sections for personal information, education, work experience, skills, certifications, hobbies, languages, and projects. "
    "Rules:\n"
    "1. Return only the LaTeX code without explanations, comments, or additional text.\n"
    "2. Use only the following standard LaTeX packages: article, geometry, amsmath, amssymb, enumitem, ragged2e, multicol, xcolor, helvet.\n"
    "3. Avoid non-standard packages (e.g., moderncv) and custom commands (e.g., \\cventry).\n"
    "4. Structure experience and education entries using standard LaTeX commands (e.g., \\textbf, \\textit, minipage, or parbox) with a consistent format: job title/degree in bold, company/institution in italics, dates on the right, and bullet points for details.\n"
    "5. Ensure all braces are properly matched and no blank lines appear within entry descriptions.\n"
    "6. Exclude photos, hyperlinks, and any reference to the job title or description in the resume.\n"
    "7. Define a blue color (\\definecolor{cvblue}{RGB}{0,102,204}) for headings and accents, and use black for body text.\n"
    "8. Optimize spacing and typography for a balanced, attractive one-page layout without excessive empty space.\n"
    "9. Use the Helvetica font by loading \\usepackage{helvet} and setting \\renewcommand{\\familydefault}{\\sfdefault} in the preamble.\n"
    "10. Ensure the code is complete, compilable with pdflatex, and produces a professional, visually appealing PDF.\n"
    "11. Use bullet points for responsibilities, achievements, skills, and other lists, formatted with the enumitem package.\n"
    "12. Prioritize skills, experiences, and keywords that align with the job description, using concise, professional language.\n"
    "13. For sections with no data (e.g., certifications, languages), omit the section entirely rather than generating an empty \\itemize environment.\n"
    "14. Ensure no empty \\itemize environments are generated (e.g., \\begin{itemize} \\end{itemize} without \\item commands)."
    )

    user_prompt = (
        "Generate a LaTeX resume based on the following details:\n"
        f"Job Title: {job_title}\n"
        f"Job Description: {job_description}\n"
        "Resume Details:\n"
        f"{resume_data}\n"
        "Structure the resume with:\n"
        "- Personal Information: Name (centered, large, bold), email, phone, address (from resume_data['personal']) in a multi line below the name.\n"
        "- objective: A brief summary of the candidate's career goals and skills (from resume_data['objective']). And match the objective with the job title and description.\n"
        "- Education: Degrees (bold), institutions (italics), years (right-aligned), and relevant details as bullet points (from resume_data['education']). Include only if resume_data['education'] is non-empty.\n"
        "- Work Experience: Job titles (bold), companies (italics), dates (right-aligned), and responsibilities/achievements as bullet points (from resume_data['experience']). Include only if resume_data['experience'] is non-empty.\n"
        "- Skills: Technical and soft skills as a bullet-point list (from resume_data['skills']). Include only if resume_data['skills'] is non-empty.\n"
        "- Certifications: List of certifications as bullet points (from resume_data['certifications']). Include only if resume_data['certifications'] is non-empty.\n"
        "- Projects: List of projects with title (bold), date (right-aligned), and description as bullet points (from resume_data['projects']). Include only if resume_data['projects'] is non-empty.\n"
        "- Hobbies: List of hobbies as bullet points (from resume_data['hobbies']). Include only if resume_data['hobbies'] is non-empty.\n"
        "- Languages: List of languages spoken as bullet points (from resume_data['languages']). Include only if resume_data['languages'] is non-empty.\n"

        "Tailoring Instructions:\n"
        "- Highlight skills and experiences relevant to the job title and description.\n"
        "- Prioritize the most relevant education and work experience.\n"
        "- Use a consistent format: bold section titles, bold job titles/degrees/project titles, italicized company names/institutions, right-aligned dates.\n"
        "- Use the defined blue color (cvblue) for section titles and accents (e.g., bullet points or separators).\n"
        "- Ensure ATS-friendly formatting: avoid tables, special characters, or complex LaTeX constructs.\n"
        "- Optimize for one page with balanced spacing and elegant typography.\n"
        "- Exclude the job title and description from the resume content.\n"
        "- Ensure the code is concise, compilable with pdflatex, and produces a clean, visually appealing PDF.\n"
        "- Stricly the resume should be single page. Alter the context if it is too long or too short. \n"

        "- Omit any section if its corresponding resume_data field is empty or contains no items, and do not generate empty \\itemize environments."
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