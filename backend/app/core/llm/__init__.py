import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from app.core.logs import logger
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

async def text_gen(system_prompt: str, user_prompt: str, temperature: float = 0.5, max_output_tokens: int = 20000) -> str:
    """Generates content based on the provided prompts and settings.

    Args:
        system_prompt (str): The instruction for the system.
        user_prompt (str): The user's input prompt.
        temperature (float): Controls the randomness of the output.
        max_output_tokens (int): Maximum number of tokens in the output.

    Returns:
        str: The generated text response.
    """
    response =  client.models.generate_content(
        model='gemini-2.0-flash-001',
        contents=[
            types.Part.from_text(text=system_prompt),
            types.Part.from_text(text=user_prompt)
        ],
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens
        )
    )
    return response.text


async def text_gen_with_context(system_prompt: str, user_prompt: str, context: str, temperature: float = 0.5, max_output_tokens: int = 1500) -> str:
    """Generates content based on the provided prompts, context, and settings.

    Args:
        system_prompt (str): The instruction for the system.
        user_prompt (str): The user's input prompt.
        context (str): The context to be included in the generation.
        temperature (float): Controls the randomness of the output.
        max_output_tokens (int): Maximum number of tokens in the output.

    Returns:
        str: The generated text response.
    """
    response =  client.models.generate_content(
        model='gemini-2.0-flash-001',
        contents=[
            types.Part.from_text(text=system_prompt),
            types.Part.from_text(text=user_prompt),
            types.Part.from_text(text=context)
        ],
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens
        )
    )
    return response.text


def text_gen_pdf(system_prompt: str, user_prompt: str, pdf_byte: str, temperature: float = 0.5, max_output_tokens: int = 10000) -> str:
    """Generates content based on the provided prompts, image, and settings.

    Args:
        system_prompt (str): The instruction for the system.
        user_prompt (str): The user's input prompt.
        pdf_byte (str): The byte encoded PDF image.
        temperature (float): Controls the randomness of the output.
        max_output_tokens (int): Maximum number of tokens in the output.

    Returns:
        str: The generated text response.
    """
    
    response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=[
                types.Part.from_text(text=system_prompt),
                types.Part.from_text(text=user_prompt),
                types.Part.from_bytes(
        data=pdf_byte,
        mime_type='application/pdf',
      ),
            ],
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_output_tokens
            )
        )
    response_text = response.text
    response_text = response_text.replace("```", "").replace("json", "").strip()
    print(f"Response Text: {response_text[:30]}...")  # Print first 30 chars for debugging
    return response_text

