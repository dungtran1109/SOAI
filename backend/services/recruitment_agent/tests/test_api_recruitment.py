#!/usr/bin/env python3

import os
import unittest
import httpx
import logging
import inspect
from datetime import datetime

AUTH_URL = "http://localhost:9090/api/v1/authentications"
BASE_URL = "http://localhost:8003/api/v1/recruitment"
TIMEOUT = 30.0

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JD_FILE_PATH = os.path.join(BASE_DIR, "test_data", "jd_sample.json")
CV_FILE_PATH = os.path.join(BASE_DIR, "test_data", "sampleCV.pdf")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestRecruitmentAPI")


class TestRecruitmentAPI(unittest.TestCase):
    admin_token = None
    user_token = None

    @classmethod
    def setUpClass(cls):
        cls.admin_token = cls.extract_token("admin", "Admin@123", role="ADMIN")
        cls.user_token = cls.extract_token("user1", "User@123", role="USER")

    @staticmethod
    def extract_token(username, password, role=None):
        payload = {"userName": username, "password": password}
        if role:
            payload["role"] = role
            url = f"{AUTH_URL}/signup"
        else:
            url = f"{AUTH_URL}/signin"

        response = httpx.post(url, json=payload, timeout=TIMEOUT)
        if response.status_code == 403 and role:
            url = f"{AUTH_URL}/signin"
            payload.pop("role", None)
            response = httpx.post(url, json=payload, timeout=TIMEOUT)

        response.raise_for_status()
        token = response.json().get("token")
        logger.info(f"Token acquired for {username}: {token}")
        return token

    def get_headers(self, token):
        return {"Authorization": f"Bearer {token}"}

    def preclean_candidate_and_jd(self, candidate_name="Bui Thanh Tra", position="Frontend Developer"):
        logger.info("Pre-cleaning old test data...")

        # Delete old CVs
        response = httpx.get(
            f"{BASE_URL}/cv/list",
            params={"position": position},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        if response.status_code == 200:
            logger.info(f"get cv_list: {response.json()}")
            try:
                for cv in response.json():
                    if isinstance(cv, dict) and cv.get("candidate_name", "").lower() == candidate_name.lower():
                        logger.info(f"Deleting old CV ID={cv['id']}")
                        del_response = httpx.delete(
                            f"{BASE_URL}/cv/delete/{cv['id']}",
                            headers=self.get_headers(self.admin_token),
                            timeout=TIMEOUT
                        )
                        self.assertEqual(del_response.status_code, 200)
            except Exception as e:
                logger.error(f"Failed to parse CV list: {e}")
        else:
            logger.warning(f"[preclean] Failed to list CVs. Status={response.status_code}")

        # Delete old JDs
        response = httpx.get(
            f"{BASE_URL}/jd-list",
            params={"position": position},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        if response.status_code == 200:
            try:
                for jd in response.json():
                    if isinstance(jd, dict) and jd.get("position") == position:
                        logger.info(f"Deleting old JD ID={jd['id']}")
                        del_resonse = httpx.delete(
                            f"{BASE_URL}/jd/delete/{jd['id']}",
                            headers=self.get_headers(self.admin_token),
                            timeout=TIMEOUT
                        )
                        self.assertEqual(del_resonse.status_code, 200)
            except Exception as e:
                logger.error(f"Failed to parse JD list: {e}")
        else:
            logger.warning(f"[preclean] Failed to list JDs. Status={response.status_code}")

    def test_full_flow_and_all_routes(self):
        logger.info("TEST: " + inspect.currentframe().f_code.co_name)

        name = "Bui Thanh Tra"
        email = "kudung053@gmail.com"
        position = "Frontend Developer"

        self.preclean_candidate_and_jd(name, position)

        logger.info("[Step 1] Upload JD")
        with open(JD_FILE_PATH, "rb") as f:
            response = httpx.post(
                f"{BASE_URL}/upload-jd",
                files={"file": ("jd_sample.json", f, "application/json")},
                headers=self.get_headers(self.admin_token),
                timeout=TIMEOUT
            )
        logger.info(f"[Upload JD] Status={response.status_code}")
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 2] Upload CV")
        with open(CV_FILE_PATH, "rb") as f:
            files = {
                "file": ("sampleCV.pdf", f, "application/pdf"),
                "override_email": (None, email),
                "position_applied_for": (None, position)
            }
            response = httpx.post(
                f"{BASE_URL}/upload-cv",
                files=files,
                headers=self.get_headers(self.admin_token),
                timeout=TIMEOUT
            )
        logger.info(f"[Upload CV] Status={response.status_code}")
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 3] Get pending CV")
        response = httpx.get(
            f"{BASE_URL}/pending-cv-list",
            params={"candidate_name": name},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        pending_cv = response.json()
        logger.info(f"Pending CVs: {pending_cv}")
        self.assertGreater(len(pending_cv), 0)
        cv_id = pending_cv[0]["id"]

        logger.info("[Step 4] Approve CV")
        response = httpx.post(
            f"{BASE_URL}/approve-cv",
            data={"candidate_id": str(cv_id)},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        logger.info(f"[Approve CV] Status={response.status_code}")
        self.assertIn(response.status_code, [200, 400])

        logger.info("[Step 5] Update CV")
        response = httpx.put(
            f"{BASE_URL}/cv/update/{cv_id}",
            json={"status": "Updated"},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 6] Get CV by ID")
        response = httpx.get(
            f"{BASE_URL}/cv/{cv_id}",
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 7] Schedule Interview")
        response = httpx.post(
            f"{BASE_URL}/schedule-interview",
            json={
                "candidate_name": name,
                "interviewer_name": "Le Van B",
                "interview_datetime": datetime.now().replace(microsecond=0).isoformat()
            },
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 8] Get Interviews")
        response = httpx.get(
            f"{BASE_URL}/interview-list",
            params={"candidate_name": name},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        interview_id = response.json()[0]["id"]

        logger.info("[Step 9] Accept Interview")
        response = httpx.put(
            f"{BASE_URL}/accept-interview",
            json={"candidate_id": interview_id},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 10] Update Interview")
        response = httpx.put(
            f"{BASE_URL}/interview/update/{interview_id}",
            json={"interviewer_name": "Nguyen Van C"},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 11] Cancel Interview")
        response = httpx.put(
            f"{BASE_URL}/interview/cancel/{interview_id}",
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 12] List All CVs")
        response = httpx.get(
            f"{BASE_URL}/cv/list",
            params={"position": position},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        logger.info("[Step 13] Get JD List")
        response = httpx.get(
            f"{BASE_URL}/jd-list",
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        jd_id = response.json()[0]["id"]

        logger.info("[Step 14] Update JD")
        response = httpx.put(
            f"{BASE_URL}/jd/update/{jd_id}",
            json={"level": "Senior"},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 200)

        # logger.info("[Step 15] Delete CV")
        # response = httpx.delete(
        #     f"{BASE_URL}/cv/delete/{cv_id}",
        #     headers=self.get_headers(self.admin_token),
        #     timeout=TIMEOUT
        # )
        # self.assertEqual(response.status_code, 200)

        # logger.info("[Step 16] Delete JD")
        # response = httpx.delete(
        #     f"{BASE_URL}/jd/delete/{jd_id}",
        #     headers=self.get_headers(self.admin_token),
        #     timeout=TIMEOUT
        # )
        # self.assertEqual(response.status_code, 200)

        logger.info("TEST: " + inspect.currentframe().f_code.co_name + ": OK")

    def test_permission_denied_for_user_approving_cv(self):
        logger.info("TEST: " + inspect.currentframe().f_code.co_name)

        response = httpx.get(
            f"{BASE_URL}/pending-cv-list",
            params={"candidate_name": "Bui Thanh Tra"},
            headers=self.get_headers(self.admin_token),
            timeout=TIMEOUT
        )
        pending_cv = response.json()
        if not pending_cv:
            logger.warning("No pending CV found, skipping test.")
            self.skipTest("No pending CV found for permission test.")
        candidate_id = pending_cv[0]["id"]

        response = httpx.post(
            f"{BASE_URL}/approve-cv",
            data={"candidate_id": str(candidate_id)},
            headers=self.get_headers(self.user_token),
            timeout=TIMEOUT
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json().get("detail"), "Insufficient permission")
        logger.info("TEST: " + inspect.currentframe().f_code.co_name + ": OK")


if __name__ == "__main__":
    unittest.main()