from fastapi import  UploadFile, File, HTTPException
from pydantic import BaseModel
import json
import logging
from typing import Optional
from app.core.llm import text_gen_pdf
from app.core.logs import logger



class ApiResponse(BaseModel):
    status: str
    data: dict
    error: Optional[str] = None

class ProfileModel(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    links: Optional[list[str]] = None
    certifications: Optional[list[dict]] = None
    projects: Optional[list[dict]] = None
    languages: Optional[list[str]] = None
    education: Optional[list[dict]] = None
    experience: Optional[list[dict]] = None
    skills: Optional[list[str]] = None

async def convert_pdf_to_json(pdf: UploadFile) -> ProfileModel:
    """Converts a PDF resume to a ProfileModel.

    Args:
        pdf (UploadFile): The uploaded PDF file.

    Returns:
        ProfileModel: A structured model containing resume data.

    Raises:
        RuntimeError: If PDF processing or LLM conversion fails.
    """
    try:
        # Validate PDF content type
        if pdf.content_type != "application/pdf":
            raise RuntimeError("Invalid file type. Only PDF files are accepted.")

        # Read PDF bytes
        pdf_bytes = await pdf.read()
        if not pdf_bytes:
            raise RuntimeError("Empty PDF file")

        # Define a specific prompt for structured extraction
        system_prompt = (
            "You are a resume parser. Extract the following information from the PDF resume "
            "and return it in JSON format matching this structure: "
            "{"
            "  'name': 'string',"
            "  'email': 'string',"
            "  'phone': 'string | null',"
            "  'address': 'string | null',"
            "  'links': ['string'] | null,"
            "  'certifications': [{ 'name': 'string', 'issuer': 'string', 'year': 'number | string | null' }] | null,"
            "  'projects': [{ 'name': 'string', 'description': 'string', 'year': 'number | string | null' }] | null,"
            "  'languages': ['string'] | null,"
            "  'education': [{ 'degree': 'string', 'university': 'string', 'year': 'number | string | null' }] | null,"
            "  'experience': [{ 'role': 'string', 'company': 'string', 'description':'string',  'years': 'string | null' }] | null,"
            "  'skills': ['string'] | null"
            "}. Return only the JSON string, without any additional text, markdown, or code blocks. "
            "If a field is missing, use null or an empty list as appropriate. "
            "If the PDF is unclear or no information can be extracted, return an empty JSON object {}."
        )
        user_prompt = "Extract the resume content from the provided PDF and convert it to JSON."

        # Call LLM with PDF bytes
        response_text = text_gen_pdf(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            pdf_byte=pdf_bytes,
            temperature=0.5,
            max_output_tokens=20000
        )

        # Parse LLM response as JSON
        try:
            resume_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {response_text}")
            raise RuntimeError(f"Invalid JSON response from LLM: {str(e)}")

        # Initialize data with defaults for all fields
        combined_data = {
            "name": resume_data.get("name") or None,
            "email": resume_data.get("email") or None,
            "phone": resume_data.get("phone"),
            "address": resume_data.get("address"),
            "links": list(set(resume_data.get("links", []))) if resume_data.get("links") else None,
            "certifications": resume_data.get("certifications") if resume_data.get("certifications") else None,
            "projects": resume_data.get("projects") if resume_data.get("projects") else None,
            "languages": list(set(resume_data.get("languages", []))) if resume_data.get("languages") else None,
            "education": resume_data.get("education") if resume_data.get("education") else None,
            "experience": resume_data.get("experience") if resume_data.get("experience") else None,
            "skills": list(set(resume_data.get("skills", []))) if resume_data.get("skills") else None
        }

        # Validate and convert to ProfileModel
        try:
            profile = ProfileModel(**combined_data)
        except ValueError as e:
            logger.error(f"Failed to map JSON to ProfileModel: {str(e)}")
            raise RuntimeError(f"Invalid resume data format: {str(e)}")

        return profile

    except Exception as e:
        logger.error(f"PDF conversion failed: {str(e)}")
        raise RuntimeError(str(e))
