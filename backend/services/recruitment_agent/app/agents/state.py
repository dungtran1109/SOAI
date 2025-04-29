from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class RecruitmentState(BaseModel):
    cv_file_path: Optional[str] = None
    override_email: Optional[str] = None
    position_applied_for: Optional[str] = None
    parsed_cv: Optional[Dict[str, Any]] = None
    jd_list: Optional[List[Dict[str, Any]]] = None
    matched_jd: Optional[Dict[str, Any]] = None
    candidate_confirmation: Optional[Dict[str, Any]] = None
    approved_candidate: Optional[Dict[str, Any]] = None
    final_decision: Optional[str] = None
    stop_pipeline: bool = False