import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load .env from the current working directory (and parents if needed)
load_dotenv()

PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

print("ENV CHECK:", PROJECT, LOCATION, MODEL)  # temporary debug

import os
from langchain_google_genai import ChatGoogleGenerativeAI

# Set your env vars or ensure they are loaded
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/key.json"

def test_gemini_direct():
    llm = ChatGoogleGenerativeAI(
    model=MODEL,
    temperature=0,
    vertexai=True,
    project=PROJECT,
    location=LOCATION,
    )

    prompt = "Who is the most famous biologist? Please give a long, 3-paragraph answer."
    
    print("--- Starting Stream ---")
    full_response = ""
    for chunk in llm.stream(prompt):
        content = chunk.content
        full_response += content
        print(content, end="|", flush=True) # Pipes show exactly where chunks break
    
    print("\n\n--- Stream Finished ---")
    print(f"Final Message Length: {len(full_response)} characters")

if __name__ == "__main__":
    test_gemini_direct()
