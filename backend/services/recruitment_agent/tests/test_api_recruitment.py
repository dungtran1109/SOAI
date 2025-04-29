import httpx
import json
import os

# API authentication
AUTH_URL = "http://localhost:9090/api/v1/authentications"
BASE_URL = "http://localhost:8003/api/v1/recruitment"

# Absolute file paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JD_FILE_PATH = os.path.join(BASE_DIR, "test_data", "jd_sample.json")
CV_FILE_PATH = os.path.join(BASE_DIR, "test_data", "sampleCV.pdf")

# Global token
TOKEN = None

def extract_token():
    global TOKEN
    url = f"{AUTH_URL}/signin"
    payload = {
        "userName": "admin",
        "password": "Admin@123"
    }
    with httpx.Client(timeout=300.0) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        TOKEN = response.json().get("token")
    if not TOKEN:
        raise Exception("Failed to extract token.")
    print("[Auth] Token extracted successfully.")

def get_headers():
    if not TOKEN:
        raise Exception("Token is not initialized. Call extract_token() first.")
    return {
        "Authorization": f"Bearer {TOKEN}"
    }

def upload_jd():
    url = f"{BASE_URL}/upload-jd"
    headers = get_headers()
    with open(JD_FILE_PATH, "rb") as f:
        files = {
            "file": ("jd_sample.json", f, "application/json")
        }
        with httpx.Client(timeout=300.0) as client:
            response = client.post(url, files=files, headers=headers)
    print("[JD Upload] Status Code:", response.status_code)
    print("[JD Upload] Response:", response.json())

def upload_cv(override_email=None, position_applied_for=None):
    url = f"{BASE_URL}/upload-cv"
    headers = get_headers()
    with open(CV_FILE_PATH, "rb") as f:
        files = {
            "file": ("sampleCV.pdf", f, "application/pdf")
        }
        if override_email:
            files["override_email"] = (None, override_email)
        if position_applied_for:
            files["position_applied_for"] = (None, position_applied_for)
        with httpx.Client(timeout=300.0) as client:
            response = client.post(url, files=files, headers=headers, timeout=30.0)
    print("[CV Upload] Status Code:", response.status_code)
    print("[CV Upload] Response:", response.json())
    return response.json()

def dev_approve_cv(candidate_id):
    url = f"{BASE_URL}/approve-cv"
    headers = get_headers()
    data = {
        "candidate_id": str(candidate_id)
    }
    with httpx.Client(timeout=300.0) as client:
        response = client.post(url, data=data, headers=headers)
    print("[Dev Approve CV] Status Code:", response.status_code)
    print("[Dev Approve CV] Response:", response.json())
    return response.json()

def get_pending_cv(candidate_name):
    url = f"{BASE_URL}/pending-cv-list"
    headers = get_headers()
    params = {
        "candidate_name": candidate_name
    }
    with httpx.Client(timeout=300.0) as client:
        response = client.get(url, params=params, headers=headers)
    print("[Pending CV List] Status Code:", response.status_code)
    print("[Pending CV List] Response:", response.json())
    return response.json()

def schedule_interview(candidate_name, interviewer_name, interview_datetime):
    url = f"{BASE_URL}/schedule-interview"
    headers = get_headers()
    payload = {
        "candidate_name": candidate_name,
        "interviewer_name": interviewer_name,
        "interview_datetime": interview_datetime
    }
    with httpx.Client(timeout=300.0) as client:
        response = client.post(url, json=payload, headers=headers)
    print("[Schedule Interview] Status Code:", response.status_code)
    print("[Schedule Interview] Response:", response.json())
    return response.json()

def get_interview_list(interview_date=None, candidate_name=None):
    url = f"{BASE_URL}/interview-list"
    headers = get_headers()
    params = {}
    if interview_date:
        params["interview_date"] = interview_date
    if candidate_name:
        params["candidate_name"] = candidate_name
    with httpx.Client(timeout=300.0) as client:
        response = client.get(url, params=params, headers=headers)
    print("[Interview List] Status Code:", response.status_code)
    print(json.dumps(response.json(), indent=2))
    return response.json()

def accept_interview(candidate_id):
    url = f"{BASE_URL}/accept-interview"
    headers = get_headers()
    payload = {
        "candidate_id": candidate_id
    }
    with httpx.Client(timeout=300.0) as client:
        response = client.put(url, json=payload, headers=headers)
    print("[Accept Interview] Status Code:", response.status_code)
    print("[Accept Interview] Response:", response.json())
    return response.json()

if __name__ == "__main__":
    # Step 0: Authenticate
    extract_token()

    candidate_name = "Bui Thanh Tra"
    interviewer_name = "Le Van B"
    interview_datetime = "2024-04-29T10:00:00"

    # Step 1: Upload JD
    print("\n=== Step 1: Upload JD ===")
    upload_jd()

    # Step 2: Upload CV
    print("\n=== Step 2: Upload CV ===")
    upload_cv(
        override_email="kudung053@gmail.com",
        position_applied_for="Frontend Developer"
    )

    # Step 3: Get Pending CV
    print("\n=== Step 3: Get Pending CV ===")
    pending_cvs = get_pending_cv(candidate_name=candidate_name)
    if pending_cvs:
        candidate_id = pending_cvs[0]["id"]
        print(f"Found candidate_id: {candidate_id}")

        # Step 4: Dev Approve
        print("\n=== Step 4: Dev Approve CV ===")
        approval_response = dev_approve_cv(candidate_id=candidate_id)

        print(approval_response)
        if "Accepted" in approval_response.get("message", ""):
            print("[OK] CV approved. Proceed to schedule interview.")

            # Step 5: Schedule Interview
            schedule_interview(
                candidate_name=candidate_name,
                interviewer_name=interviewer_name,
                interview_datetime=interview_datetime
            )

            # Step 6: Fetch Interview List
            print("\n=== Step 6: Fetch Interview List ===")
            interviews = get_interview_list(
                interview_date="2024-04-29",
                candidate_name=candidate_name
            )

            # Step 7: Accept Interview
            if interviews:
                interview = interviews[0]
                candidate_id = interview["id"]
                accept_interview(candidate_id=candidate_id)
            else:
                print("[WARN] No interview found to accept.")

        else:
            print("[WARN] CV was not approved. Skipping interview scheduling.")
    else:
        print("[WARN] No pending CV found for candidate.")
