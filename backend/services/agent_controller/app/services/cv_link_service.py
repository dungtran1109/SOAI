"""
CV Link Service - Utility for generating CV preview URLs.
"""
from config.constants import RECRUITMENT_EXTERNAL_URL


def build_cv_preview_url(cv_id: int) -> str:
    """
    Build the full preview URL for a CV.

    Args:
        cv_id: The CV application ID

    Returns:
        Full URL to preview the CV
    """
    return f"{RECRUITMENT_EXTERNAL_URL}/api/v1/recruitment/cvs/{cv_id}/preview"
