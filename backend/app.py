"""CivicAI backend: Flask API + static hosting for the frontend.

Run:  pip install -r requirements.txt && python app.py
Open: http://localhost:5000
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from schemes import SCHEMES

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
ALLOWED_MIME = {"image/jpeg", "image/png"}
MAX_FILES = 8

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
CORS(app)


def build_prompt(question, lang, profile):
    return (
        "You are Civic Guide, a friendly voice assistant for education welfare schemes in Tamil Nadu, India. "
        f"Reply in {lang} in at most 3 short plain sentences (no markdown, no lists) so it reads well aloud. "
        f"Citizen profile (may be empty): {profile}. "
        "If unsure, say so and suggest confirming on the official portal or at an e-Sevai centre. "
        f"Question: {question}"
    )


def get_client():
    if not API_KEY or not HAS_GENAI:
        return None
    return genai.Client(api_key=API_KEY)


# ---------- Frontend ----------
@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.get("/<path:path>")
def assets(path):
    return send_from_directory(FRONTEND, path)


# ---------- API ----------
@app.get("/api/schemes")
def list_schemes():
    return jsonify(SCHEMES)


@app.post("/api/helpdesk")
def helpdesk():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    lang = data.get("language", "English")
    if not question:
        return jsonify(error="Please enter your question."), 400
    client = get_client()
    if not client:
        return jsonify(error="AI service is not configured on the server."), 503
    try:
        res = client.models.generate_content(
            model=MODEL,
            contents=build_prompt(question, lang, data.get("profile")),
        )
        return jsonify(answer=res.text)
    except Exception as exc:
        return jsonify(error=f"Helpdesk error: {exc}"), 502


@app.post("/api/verify-documents")
def verify_documents():
    lang = request.form.get("language", "English")
    files = request.files.getlist("files")
    labels = request.form.getlist("labels")
    if len(files) < 2:
        return jsonify(error="Upload at least 2 document images to cross-verify."), 400
    if len(files) > MAX_FILES:
        return jsonify(error=f"Upload at most {MAX_FILES} images."), 400
    if any(f.mimetype not in ALLOWED_MIME for f in files):
        return jsonify(error="Only JPG and PNG images are supported."), 400
    client = get_client()
    if not client:
        return jsonify(error="AI service is not configured on the server."), 503

    parts, manifest = [], []
    for i, f in enumerate(files):
        label = labels[i] if i < len(labels) else f.filename
        parts.append(types.Part.from_bytes(data=f.read(), mime_type=f.mimetype))
        manifest.append(f"- Image {i + 1} is: '{label}'")

    prompt = f"""
You are a Document Verification Specialist for a government welfare portal.
You received {len(parts)} document images:
{chr(10).join(manifest)}

PRIVACY: Extract ONLY the citizen's printed personal name from each document.
Never extract or output ID numbers, card numbers, account digits, birth dates or phone numbers.

Tasks:
1. Read the printed personal name in each image.
2. Compare names across all documents: exact match, initials vs expanded names, spelling differences.
3. Decide if the set is consistent enough for submission or if an affidavit/gazette correction is needed.

Respond with raw JSON only (no markdown), exactly this schema:
{{
  "detected_names": [{{"doc_key": "document label", "detected_name": "name or 'Unreadable'"}}],
  "overall_match_status": "EXACT_MATCH" | "INITIAL_EXPANSION" | "SPELLING_MISMATCH" | "UNREADABLE",
  "summary_explanation": "Explanation for the applicant in {lang}",
  "compliance_advice": "Next steps in {lang} to avoid rejection"
}}
"""
    try:
        res = client.models.generate_content(model=MODEL, contents=parts + [prompt])
        text = res.text.replace("```json", "").replace("```", "").strip()
        return jsonify(json.loads(text))
    except Exception as exc:
        return jsonify(error=f"Vision processing error: {exc}"), 502


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
