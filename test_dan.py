# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
from dotenv import load_dotenv, set_key
from google import genai
from google.genai import types

def generate():
    # Load environment variables
    load_dotenv()
    
    # Get API key and validate it exists
    api_key = os.getenv("GOOGLE_API")
    
    if not api_key:
        print("Error: GOOGLE_API key not found in environment variables")
        return
    
    print(f"API key loaded: {api_key[:10]}..." if len(api_key) > 10 else "API key loaded")
    
    try:
        # Create client with explicit API key
        client = genai.Client(api_key=api_key)
        
        model = "gemini-2.5-flash"
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text="Tell me a joke in Spanish"),
                ],
            ),
        ]
        
        # Simplified config - remove thinking_config if not needed
        generate_content_config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=1000,
        )
        
        print("Generating response...\n")
        
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                print(chunk.text, end="")
        
        print("\n\nGeneration complete!")
        
    except Exception as e:
        print(f"Error during generation: {e}")
        print("\nTroubleshooting steps:")
        print("1. Verify your API key is correct")
        print("2. Check if the model name is valid")
        print("3. Ensure you have the latest google-genai package")
        print("4. Try without the thinking_config")

if __name__ == "__main__":
    generate()