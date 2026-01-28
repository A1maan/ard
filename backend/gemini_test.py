import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load .env from the current working directory (and parents if needed)
load_dotenv()

PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

print("ENV CHECK:", PROJECT, LOCATION, MODEL)  # temporary debug

llm = ChatGoogleGenerativeAI(
    model=MODEL,
    temperature=0,
    vertexai=True,
    project=PROJECT,
    location=LOCATION,
)

print(llm.invoke("Say 'Vertex works'"))
