from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

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

def text_gen_img(system_prompt: str, user_prompt: str, img: str, temperature: float = 0.5, max_output_tokens: int = 256) -> str:
    """Generates content based on the provided prompts, image, and settings.

    Args:
        system_prompt (str): The instruction for the system.
        user_prompt (str): The user's input prompt.
        img (str): The image to be included in the generation in base64 format.
        temperature (float): Controls the randomness of the output.
        max_output_tokens (int): Maximum number of tokens in the output.

    Returns:
        str: The generated text response.
    """
    response = client.models.generate_content(
        model='gemini-2.0-flash-001',
        contents=[
            types.Part.from_text(text=system_prompt),
            types.Part.from_text(text=user_prompt),
            types.Part.from_image(image=img)
        ],
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens
        )
    )
    return response.text