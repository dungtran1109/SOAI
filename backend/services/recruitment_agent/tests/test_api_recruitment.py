#!/usr/bin/env python3
import unittest
import inspect
import time
from datetime import datetime
from constants import *
from basiclib import *


def wait_until_available(url, timeout=60):
    """Wait until the given URL is reachable before proceeding."""
    start = time.time()
    log_info(f"Waiting for service at {url} to be available...")
    while True:
        try:
            response = httpx.get(url, timeout=3)
            if response.status_code < 500:
                log_info(f"Service at {url} is available.")
                break
        except Exception:
            pass
        if time.time() - start > timeout:
            raise RuntimeError(f"Timeout waiting for service at {url}")
        time.sleep(1)


class TestRecruitmentAPI(unittest.TestCase):
    admin_token = None
    user_token = None

    @classmethod
    def setUpClass(cls):
        """Setup tokens for ADMIN and USER before tests run."""
        log_debug("Waiting for backend services to become available")
        wait_until_available(AUTH_URL)
        wait_until_available(BASE_URL)

        log_debug("Setting up tokens for ADMIN and USER")
        cls.admin_token = extract_token("admin", "Admin@123", role="ADMIN")
        cls.user_token = extract_token("user1", "User@123", role="USER")

    @classmethod
    def tearDownClass(cls):
        """Cleanup data created during tests."""
        log_info("Running post-test cleanup...")
        tester = cls()
        tester.admin_token = cls.admin_token
        tester.postclean_candidate_and_jd("Bui Thanh Tra", "Frontend Developer")

    def preclean_candidate_and_jd(self, candidate_name, position):
        """Clean up test data before each test."""
        log_info("Pre-cleaning old test data...")
        self.clean_cv(candidate_name, position)
        self.clean_jd(position)

    def postclean_candidate_and_jd(self, candidate_name, position):
        """Clean up test data after each test if needed."""
        log_info("Post-cleaning test data...")
        self.clean_cv(candidate_name, position)
        self.clean_jd(position)

    def clean_cv(self, candidate_name, position):
        """Delete CVs that match test candidate name and position."""
        log_debug(
            f"Cleaning CVs for candidate '{candidate_name}' and position '{position}'"
        )
        try:
            response = api_request(
                "GET",
                f"{BASE_URL}/cvs",
                params={"position": position},
                headers=get_headers(self.admin_token),
            )
            if response.status_code == 200:
                for cv in response.json():
                    if (
                        isinstance(cv, dict)
                        and cv.get("candidate_name", "").lower()
                        == candidate_name.lower()
                    ):
                        log_info(f"Deleting CV ID={cv['id']}")
                        api_request(
                            "DELETE",
                            f"{BASE_URL}/cvs/{cv['id']}",
                            headers=get_headers(self.admin_token),
                        )
        except Exception as e:
            log_error(f"Error while cleaning CVs: {e}")

    def clean_jd(self, position):
        """Delete JDs that match test position."""
        log_debug(f"Cleaning JDs for position '{position}'")
        try:
            response = api_request(
                "GET",
                f"{BASE_URL}/jds",
                params={"position": position},
                headers=get_headers(self.admin_token),
            )
            if response.status_code == 200:
                for jd in response.json():
                    if isinstance(jd, dict) and jd.get("position") == position:
                        log_info(f"Deleting JD ID={jd['id']}")
                        api_request(
                            "DELETE",
                            f"{BASE_URL}/jds/{jd['id']}",
                            headers=get_headers(self.admin_token),
                        )
        except Exception as e:
            log_error(f"Error while cleaning JDs: {e}")

    def test_full_flow_and_all_routes(self):
        """Main working-path test: upload JD, upload CV, approve, schedule and complete interview."""
        log_info("TEST: " + inspect.currentframe().f_code.co_name)

        name = "Bui Thanh Tra"
        email = "kudung053@gmail.com"
        position = "Frontend Developer"

        try:
            self.preclean_candidate_and_jd(name, position)
            log_debug("Test data preclean complete")
        except Exception as e:
            log_error(f"Error during preclean: {e}")
            self.fail("Pre-clean step failed")

        try:
            log_info("[Step 1] Upload JD")
            with open(JD_FILE_PATH, "rb") as f:
                response = api_request(
                    "POST",
                    f"{BASE_URL}/jds/upload",
                    files={"file": ("jd_sample.json", f, "application/json")},
                    headers=get_headers(self.admin_token),
                )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 2] Upload CV")
            with open(CV_FILE_PATH, "rb") as f:
                files = {
                    "file": ("sampleCV.pdf", f, "application/pdf"),
                    "override_email": (None, email),
                    "position_applied_for": (None, position),
                }
                response = api_request(
                    "POST",
                    f"{BASE_URL}/cvs/upload",
                    files=files,
                    headers=get_headers(self.admin_token),
                )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 3] Get pending CV")
            response = api_request(
                "GET",
                f"{BASE_URL}/cvs/pending",
                params={"candidate_name": name},
                headers=get_headers(self.admin_token),
            )
            pending_cv = response.json()
            self.assertGreater(len(pending_cv), 0)
            cv_id = pending_cv[0]["id"]

            log_info("[Step 4] Approve CV")
            response = api_request(
                "POST",
                f"{BASE_URL}/cvs/{str(cv_id)}/approve",
                data={"candidate_id": str(cv_id)},
                headers=get_headers(self.admin_token),
            )
            self.assertIn(response.status_code, [200, 400])

            log_info("[Step 5] Update CV")
            response = api_request(
                "PUT",
                f"{BASE_URL}/cvs/{cv_id}",
                json={"status": "Updated"},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 6] Get CV by ID")
            response = api_request(
                "GET", f"{BASE_URL}/cvs/{cv_id}", headers=get_headers(self.admin_token)
            )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 7] Schedule Interview")
            response = api_request(
                "POST",
                f"{BASE_URL}/interviews/schedule",
                json={
                    "candidate_name": name,
                    "interviewer_name": "Le Van B",
                    "interview_datetime": datetime.now()
                    .replace(microsecond=0)
                    .isoformat(),
                },
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 8] Get Interviews")
            response = api_request(
                "GET",
                f"{BASE_URL}/interviews",
                params={"candidate_name": name},
                headers=get_headers(self.admin_token),
            )
            interview_id = response.json()[0]["id"]

            log_info("[Step 9] Accept Interview")
            response = api_request(
                "POST",
                f"{BASE_URL}/interviews/accept",
                json={"candidate_id": interview_id},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 10] Update Interview")
            response = api_request(
                "PUT",
                f"{BASE_URL}/interviews/{interview_id}",
                json={"interviewer_name": "Nguyen Van C"},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 11] Cancel Interview")
            response = api_request(
                "POST",
                f"{BASE_URL}/interviews/{interview_id}/cancel",
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 12] List All CVs")
            response = api_request(
                "GET",
                f"{BASE_URL}/cvs/position",
                params={"position": position},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            log_info("[Step 13] Get JD List")
            response = api_request(
                "GET", f"{BASE_URL}/jds", headers=get_headers(self.admin_token)
            )
            jd_id = response.json()[0]["id"]

            log_info("[Step 14] Update JD")
            response = api_request(
                "PUT",
                f"{BASE_URL}/jds/{jd_id}",
                json={"level": "Senior"},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

        except Exception as e:
            log_error(f"Test failed with error: {e}")
            self.fail("Exception occurred during test flow")

        log_info("TEST: " + inspect.currentframe().f_code.co_name + ": OK")

    def test_permission_denied_for_user_approving_cv(self):
        """Ensure USER role is not allowed to upload JD or approve CV."""
        log_info("TEST: " + inspect.currentframe().f_code.co_name)

        name = "Bui Thanh Tra"
        email = "kudung053@gmail.com"
        position = "Frontend Developer"

        self.preclean_candidate_and_jd(name, position)

        log_info("Trying to Upload JD with USER role")
        with open(JD_FILE_PATH, "rb") as f:
            response = api_request(
                "POST",
                f"{BASE_URL}/jds/upload",
                files={"file": ("jd_sample.json", f, "application/json")},
                headers=get_headers(self.user_token),
            )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json().get("detail"), "Insufficient permission")

        log_info("Uploading JD as ADMIN for CV testing")
        with open(JD_FILE_PATH, "rb") as f:
            api_request(
                "POST",
                f"{BASE_URL}/jds/upload",
                files={"file": ("jd_sample.json", f, "application/json")},
                headers=get_headers(self.admin_token),
            )

        log_info("Uploading CV with USER role")
        with open(CV_FILE_PATH, "rb") as f:
            files = {
                "file": ("sampleCV.pdf", f, "application/pdf"),
                "override_email": (None, email),
                "position_applied_for": (None, position),
            }
            response = api_request(
                "POST",
                f"{BASE_URL}/cvs/upload",
                files=files,
                headers=get_headers(self.user_token),
            )
        self.assertEqual(response.status_code, 200)

        log_info("Trying to get pending CV with USER role")
        response = api_request(
            "GET",
            f"{BASE_URL}/cvs/pending",
            params={"candidate_name": name},
            headers=get_headers(self.user_token),
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json().get("detail"), "Insufficient permission")

        log_info("Getting pending CVs as ADMIN")
        response = api_request(
            "GET",
            f"{BASE_URL}/cvs/pending",
            params={"candidate_name": name},
            headers=get_headers(self.admin_token),
        )
        pending_cv = response.json()
        if not pending_cv:
            log_info("No pending CV found, skipping test.")
            self.skipTest("No pending CV found for permission test.")
        candidate_id = pending_cv[0]["id"]

        log_info("Trying to approve CV with USER role")
        response = api_request(
            "POST",
            f"{BASE_URL}/cvs/{str(candidate_id)}/approve",
            data={"candidate_id": str(candidate_id)},
            headers=get_headers(self.user_token),
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json().get("detail"), "Insufficient permission")

        log_info("TEST: " + inspect.currentframe().f_code.co_name + ": OK")


if __name__ == "__main__":
    unittest.main()
