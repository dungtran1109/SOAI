"""
CV Link Service for detecting CV link requests in chat and retrieving presigned URLs.
"""
import re
from typing import Optional, Tuple, List, Dict, Any

from services.genai import get_http_client
from config.constants import RECRUITMENT_HOST, SCHEMA, TLS_ENABLED, CA_PATH
from config.log_config import AppLogger

logger = AppLogger(__name__)


class CVLinkIntentDetector:
    """Detects user intent to request CV download links."""

    # Patterns to detect CV link requests
    CV_LINK_PATTERNS = [
        # English patterns
        r"(?:give|send|get|provide|show)\s+(?:me\s+)?(?:the\s+)?(?:link|url|download)\s+(?:to|for|of)\s+(.+?)(?:'s|')\s*(?:cv|resume|curriculum vitae)",
        r"(?:download|get)\s+(.+?)(?:'s|')\s*(?:cv|resume)",
        r"(?:cv|resume)\s+(?:link|url|download)\s+(?:for|of)\s+(.+)",
        r"(?:link|url)\s+(?:to|for)\s+(.+?)(?:'s|')\s*(?:cv|resume)",
        r"(?:can\s+(?:you|i)\s+)?(?:get|have|download)\s+(.+?)(?:'s|')\s*(?:cv|resume)",
        r"(?:i\s+)?(?:need|want)\s+(?:the\s+)?(?:link|url)\s+(?:to|for)\s+(.+?)(?:'s|')\s*(?:cv|resume)",
        # "CV of [name]" pattern
        r"(?:cv|resume)\s+(?:of|for)\s+(.+?)(?:\s+please|\s+link|\s+download)?$",
        # Direct name + CV pattern
        r"(.+?)(?:'s|')\s*(?:cv|resume)\s*(?:link|url|download)?",
    ]

    @classmethod
    def detect_cv_link_intent(cls, user_input: str) -> Tuple[bool, Optional[str]]:
        """
        Detect if the user is requesting a CV download link.

        Args:
            user_input: The user's message

        Returns:
            Tuple of (is_cv_link_request, candidate_name)
        """
        # Normalize input
        text = user_input.lower().strip()

        # Quick check - must contain cv/resume related words
        cv_keywords = ["cv", "resume", "curriculum vitae"]
        if not any(kw in text for kw in cv_keywords):
            return False, None

        # Link-related keywords to confirm intent
        link_keywords = ["link", "url", "download", "get", "give", "send", "provide", "show", "need", "want"]
        has_link_intent = any(kw in text for kw in link_keywords)

        if not has_link_intent:
            return False, None

        # Try to extract candidate name
        for pattern in cls.CV_LINK_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                candidate_name = match.group(1).strip()
                # Clean up the name
                candidate_name = cls._clean_candidate_name(candidate_name)
                if candidate_name and len(candidate_name) > 1:
                    logger.info(f"Detected CV link intent for candidate: {candidate_name}")
                    return True, candidate_name

        return False, None

    @classmethod
    def _clean_candidate_name(cls, name: str) -> str:
        """Clean and normalize the extracted candidate name."""
        # Remove common words that might be captured
        stop_words = ["the", "a", "an", "mr", "ms", "mrs", "dr", "please", "candidate"]
        words = name.split()
        cleaned = [w for w in words if w.lower() not in stop_words]
        return " ".join(cleaned).strip()


class CVLinkService:
    """Service to fetch CV download links from the recruitment service."""

    def __init__(self, auth_token: Optional[str] = None):
        self.auth_token = auth_token
        self.base_url = f"{SCHEMA}://{RECRUITMENT_HOST}/api/v1/recruitment"

    async def get_cv_link(self, candidate_name: str) -> Dict[str, Any]:
        """
        Get CV download link(s) for a candidate by name.

        Args:
            candidate_name: The candidate's name to search for

        Returns:
            Dict containing CV links and metadata
        """
        try:
            url = f"{self.base_url}/cvs/link-by-name"
            headers = {"Content-Type": "application/json"}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"

            logger.info(f"Fetching CV link for candidate: {candidate_name}")

            # Use async httpx client
            client = await get_http_client()
            resp = await client.get(
                url,
                headers=headers,
                params={"candidate_name": candidate_name},
            )

            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "candidate_name": candidate_name,
                    "results": data,
                }
            elif resp.status_code == 404:
                return {
                    "success": False,
                    "candidate_name": candidate_name,
                    "error": f"No CVs found for candidate: {candidate_name}",
                }
            else:
                logger.error(f"Failed to fetch CV link: {resp.status_code} - {resp.text}")
                return {
                    "success": False,
                    "candidate_name": candidate_name,
                    "error": f"Failed to retrieve CV: {resp.text}",
                }

        except Exception as e:
            logger.error(f"Error fetching CV link for {candidate_name}: {e}")
            return {
                "success": False,
                "candidate_name": candidate_name,
                "error": str(e),
            }

    @staticmethod
    def format_response(cv_data: Dict[str, Any]) -> str:
        """Format the CV link response for the chat."""
        if not cv_data.get("success"):
            return cv_data.get("error", "Failed to retrieve CV information.")

        results = cv_data.get("results", [])
        if not results:
            return f"I couldn't find any CVs for '{cv_data.get('candidate_name')}'."

        if len(results) == 1:
            cv = results[0]
            name = cv.get("candidate_name", "Unknown")
            presigned_url = cv.get("presigned_url")
            preview_endpoint = cv.get("preview_endpoint")
            filename = cv.get("original_filename", "CV.pdf")
            position = cv.get("position", "N/A")
            storage_backend = cv.get("storage_backend", "local")

            # MinIO storage - use presigned URL with expiry
            if presigned_url:
                expiry = cv.get("expires_in_seconds", 86400)
                expiry_hours = expiry // 3600
                return (
                    f"Here's the CV link for **{name}**:\n\n"
                    f"- **Position**: {position}\n"
                    f"- **File**: {filename}\n"
                    f"- **Download Link**: [Click here to download]({presigned_url})\n\n"
                    f"_This link expires in {expiry_hours} hours._"
                )
            # Local storage - use preview endpoint
            elif preview_endpoint:
                return (
                    f"Here's the CV for **{name}**:\n\n"
                    f"- **Position**: {position}\n"
                    f"- **File**: {filename}\n"
                    f"- **Preview**: You can view this CV through the preview endpoint: `{preview_endpoint}`\n\n"
                    f"_Note: The CV is stored locally on the server._"
                )
            else:
                return f"Found CV for {name}, but the download link could not be generated."

        # Multiple results
        response_parts = [f"I found {len(results)} CVs matching '{cv_data.get('candidate_name')}':"]
        has_presigned = False
        for i, cv in enumerate(results, 1):
            name = cv.get("candidate_name", "Unknown")
            presigned_url = cv.get("presigned_url")
            preview_endpoint = cv.get("preview_endpoint")
            position = cv.get("position", "N/A")

            if presigned_url:
                response_parts.append(f"\n{i}. **{name}** ({position}): [Download]({presigned_url})")
                has_presigned = True
            elif preview_endpoint:
                response_parts.append(f"\n{i}. **{name}** ({position}): Preview at `{preview_endpoint}`")
            else:
                response_parts.append(f"\n{i}. **{name}** ({position}): _Link not available_")

        if has_presigned:
            expiry = results[0].get("expires_in_seconds", 86400) if results else 86400
            expiry_hours = expiry // 3600
            response_parts.append(f"\n\n_Download links expire in {expiry_hours} hours._")

        return "".join(response_parts)
