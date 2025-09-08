# utils/cv_utils.py
import json
import re
from socket import socket
from typing import Any, Dict, List
import time
import fitz
from config.log_config import AppLogger

logger = AppLogger(__name__)

ALLOWED_CEFR = {"A1", "A2", "B1", "B2", "C1", "C2", "Unknown"}


def ensure_text(x) -> str:
    if isinstance(x, (bytes, bytearray)):
        return x.decode("utf-8", errors="ignore")
    return x if isinstance(x, str) else str(x)


def unwrap_maybe_wrapper(raw: str) -> str:
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict) and "data" in obj:
            return ensure_text(obj["data"])
    except Exception:
        pass
    return raw


def clean_json_from_text(text: str) -> str:
    text = ensure_text(text)
    if not text:
        return ""
    s = text.strip()
    for pat in (r"^```json\s*(.*?)\s*```$", r"^```\s*(.*?)\s*```$"):
        m = re.match(pat, s, re.DOTALL)
        if m:
            s = m.group(1).strip()
            break
    try:
        json.loads(s)
        return s
    except Exception:
        pass
    m = re.search(r"\{.*\}", s, re.DOTALL)
    if m:
        cand = m.group(0)
        try:
            json.loads(cand)
            return cand
        except Exception:
            pass
    return s


def coerce_types(parsed: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if parsed.get("experience_years") is not None:
            parsed["experience_years"] = int(float(parsed["experience_years"]))
    except Exception:
        parsed["experience_years"] = 0

    skills = parsed.get("skills", [])
    if isinstance(skills, (bytes, bytearray)):
        skills = ensure_text(skills)
    if isinstance(skills, str):
        skills = [s.strip() for s in re.split(r"[,\n;]", skills) if s.strip()]
    elif not isinstance(skills, list):
        skills = []
    parsed["skills"] = [str(x).strip() for x in skills if str(x).strip()]

    edu = parsed.get("education", [])
    if not isinstance(edu, list):
        edu = []
    norm_edu = []
    for e in edu:
        if isinstance(e, dict):
            ex = dict(e)
            for k in ("gpa", "gpa_scale"):
                if ex.get(k) not in (None, ""):
                    try:
                        ex[k] = float(str(ex[k]).replace(",", "."))
                    except Exception:
                        ex[k] = None
            norm_edu.append(ex)
    parsed["education"] = norm_edu

    hdl = parsed.get("highest_degree_level")
    if not isinstance(hdl, str) or not hdl.strip():
        parsed["highest_degree_level"] = "UNKNOWN"

    return parsed


def validate_languages(arr: Any) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    if isinstance(arr, list):
        for item in arr:
            if isinstance(item, dict):
                lang = ensure_text(item.get("language", "")).strip()
                cefr = ensure_text(item.get("proficiency_cefr", "")).strip()
                cefr = cefr if cefr in ALLOWED_CEFR else "Unknown"
                if lang:
                    out.append({"language": lang, "proficiency_cefr": cefr})
    return out


def validate_parsed_cv(obj: Any) -> Dict[str, Any]:
    if not isinstance(obj, dict):
        raise ValueError("Parsed CV is not an object.")
    obj.setdefault("name", "")
    obj.setdefault("email", "")
    obj.setdefault("skills", [])
    obj.setdefault("experience_years", 0)
    obj.setdefault("education", [])
    obj.setdefault("highest_degree_level", "UNKNOWN")
    obj.setdefault("certifications", [])
    obj.setdefault("languages", [])
    obj.setdefault("university_evaluation", {})
    return obj


def extract_text_from_pdf(file_path: str) -> str:
    logger.debug(f"[pdf] reading: {file_path}")
    doc = fitz.open(file_path)
    text = "".join(page.get_text() for page in doc)
    text = ensure_text(text)
    if not text:
        logger.info(f"[pdf] empty content: {file_path}")
    logger.debug(f"[pdf] chars: {len(text)}")
    return text
