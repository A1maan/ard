---

# ✅ **Project Setup (Gemini + Vertex AI, No Docker)**

> This guide assumes a **Windows machine** and a **temporary Google hackathon account**.

---

## 0️⃣ Prerequisites (install once)

### A) Install Python (if not installed)

* Python **3.10+**
* Verify:

```txt
python --version
```

---

### B) Install Google Cloud CLI (**REQUIRED**)

1. Download from:

   ```
   https://cloud.google.com/sdk/docs/install
   ```
2. Run the Windows installer
3. During install:

   * ✅ Check **“Add gcloud to PATH”**
   * ✅ Allow bundled Python if prompted
4. Restart **CMD / PowerShell**

Verify:

```txt
gcloud --version
```

---

### C) Install Node + pnpm (only if using the UI)

(Optional – skip if backend only)

```txt
node --version
pnpm --version
```

---

## 1️⃣ Backend setup

```txt
# Go to backend directory
cd backend

# Create virtual environment
uv venv

# Activate virtual environment (Windows)
.venv/Scripts/activate

# Install dependencies
uv pip install -r requirements.txt
```

---

## 2️⃣ Authenticate with Google Cloud (NO API KEYS)

> Use the **temporary hackathon Google account**
> (Recommended: log in via an incognito browser window)

### A) Login to gcloud

```txt
gcloud auth login
```

A browser opens → log in with the **hackathon account**

---

### B) Set the GCP project

```txt
gcloud config set project <PROJECT_ID>
```

Verify:

```txt
gcloud config get-value project
```

---

### C) Create Application Default Credentials (for Python)

```txt
gcloud auth application-default login
```

This enables **Vertex AI access from LangChain**.

Verify:

```txt
gcloud auth application-default print-access-token
```

If a token prints → auth is working.

---

### D) (Recommended) Align quota project

```txt
gcloud auth application-default set-quota-project <PROJECT_ID>
```

---

## 3️⃣ Configure environment variables

Create a `.env` file in `backend/`:

```env
# LLM provider
LLM_PROVIDER=google

# Gemini / Vertex AI
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=<PROJECT_ID>
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash

# LangGraph encryption (required)
LANGGRAPH_AES_KEY=<64-char-hex-key>
```

⚠️ No quotes around values.

---

## 4️⃣ Start the backend

```txt
langgraph dev --allow-blocking
```

You should see:

* agent startup logs
* streaming output when you interact

---

## 5️⃣ (Optional) Start the UI

```txt
cd agent-chat-ui
pnpm dev
```

Open:

```
http://localhost:8000
```

---

## 🧪 Quick Gemini sanity test (optional)

```txt
python gemini_test.py
```

Expected output:

```
Vertex works
```

---

## 📝 Important Notes for Teammates

* ✅ **No API keys are needed**
* ✅ Authentication uses Google Cloud IAM
* ❌ Do **NOT** edit `langgraph.json`
* 🔁 Model switching is done via `.env` (`GEMINI_MODEL`)
* 🪟 Gemini may stream in large chunks — this is normal

---

## 🚨 Troubleshooting (most common issues)

### ❌ “Could not resolve project”

* `.env` not loaded
* `GOOGLE_CLOUD_PROJECT` missing
* Running Python from the wrong directory

### ❌ “Default credentials not found”

Run:

```txt
gcloud auth application-default login
```

### ❌ Browser login confusion

Use:

```txt
gcloud auth login --no-launch-browser
gcloud auth application-default login --no-launch-browser
```

Then open the printed URL in **incognito**.


----


