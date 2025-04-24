import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)


def text_gen(system_prompt:str, user_prompt:str, temperature:float=0.5, max_output_tokens:int=256) -> str:
    """
    Generate text using Gemini API.

    Args:
        system_prompt (str): The system prompt to guide the model's behavior.
        user_prompt (str): The user's input prompt.
        temperature (float): Controls the randomness of the output. Default is 0.5.
        max_output_tokens (int): Maximum number of tokens to generate. Default is 256.

    Returns:
        str: The generated text response from the model.
    """
    response = genai.chat(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=temperature,
        max_output_tokens=max_output_tokens
    )
    return response.text