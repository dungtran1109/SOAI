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
            response = httpx.get(url, timeout=3, verify=False)
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
        tester.postclean_candidate("Nguyễn Bảo Ngọc", "Tuyển sinh vào lớp 10 chuyên Văn")

    def preclean_candidate(self, candidate_name, position):
        """Clean up test data before each test."""
        log_info("Pre-cleaning old test data...")
        self.clean_cv(candidate_name, position)
        self.clean_interviews(candidate_name)

    def postclean_candidate(self, candidate_name, position):
        """Clean up test data after each test if needed."""
        log_info("Post-cleaning test data...")
        self.clean_cv(candidate_name, position)
        self.clean_interviews(candidate_name)

    def clean_cv(self, candidate_name, position):
        """Delete CVs that match test candidate name and position."""
        log_debug(
            f"Cleaning CVs for candidate '{candidate_name}' and position '{position}'"
        )
        try:
            cvs = self.get_items("cvs/position", {"position": position}, self.admin_token)
            log_info(f"Get list CVs before clean_cv: {cvs}")
            for cv in cvs:
                if (
                    isinstance(cv, dict)
                    and cv.get("candidate_name", "").lower() == candidate_name.lower()
                ):
                    log_info(f"Deleting CV ID={cv['id']}")
                    self.delete_item("cvs", cv["id"], self.admin_token)
        except Exception as e:
            log_error(f"Error while cleaning CVs: {e}")

    def clean_jd(self, position):
        """Delete JDs that match test position."""
        log_debug(f"Cleaning JDs for position '{position}'")
        try:
            jds = self.get_items("jds", {"position": position}, self.admin_token)
            for jd in jds:
                if isinstance(jd, dict) and jd.get("position") == position:
                    log_info(f"Deleting JD ID={jd['id']}")
                    self.delete_item("jds", jd["id"], self.admin_token)
        except Exception as e:
            log_error(f"Error while cleaning JDs: {e}")
    
    def clean_interviews(self, candidate_name):
        """Delete interviews matching the candidate name."""
        log_debug(f"Cleaning interviews for candidate '{candidate_name}'")
        try:
            response = api_request(
                "DELETE",
                f"{BASE_URL}/interviews",
                params={"candidate_name": candidate_name},
                headers=get_headers(self.admin_token),
            )
            if response.status_code != 200:
                log_error(f"Could not delete interviews for candidate '{candidate_name}'")
            else:
                log_info(f"Deleted interviews for candidate '{candidate_name}'")
        except Exception as e:
            log_error(f"Error while cleaning interviews: {e}")

    def get_items(self, resource, params, token):
        """Generic GET for resource list."""
        response = api_request(
            "GET",
            f"{BASE_URL}/{resource}",
            params=params,
            headers=get_headers(token),
        )
        if response.status_code == 200:
            return response.json()
        return []

    def delete_item(self, resource, item_id, token):
        """Generic DELETE for resource item."""
        api_request(
            "DELETE",
            f"{BASE_URL}/{resource}/{item_id}",
            headers=get_headers(token),
        )

    def upload_jd(self, token):
        with open(JD_FILE_PATH, "rb") as f:
            return api_request(
                "POST",
                f"{BASE_URL}/jds/upload",
                files={"file": ("jd_sample.json", f, "application/json")},
                headers=get_headers(token),
            )

    def upload_cv(self, token, email, position):
        with open(CV_FILE_PATH, "rb") as f:
            files = {
                "file": ("sampleCV.pdf", f, "application/pdf"),
                "override_email": (None, email),
                "position_applied_for": (None, position),
            }
            return api_request(
                "POST",
                f"{BASE_URL}/cvs/upload",
                files=files,
                headers=get_headers(token),
            )

    def get_pending_cv(self, candidate_name, token):
        response = api_request(
            "GET",
            f"{BASE_URL}/cvs/pending",
            params={"candidate_name": candidate_name},
            headers=get_headers(token),
        )
        return response.json() if response.status_code == 200 else []

    def test_full_flow_and_all_routes(self):
        """Main working-path test: upload JD, upload CV, approve, schedule and complete interview."""
        log_info("TEST: " + inspect.currentframe().f_code.co_name)

        name = "Nguyễn Bảo Ngọc"
        email = "kudung053@gmail.com"
        position = "Tuyển sinh vào lớp 10 chuyên Văn"

        try:
            self.preclean_candidate(name, position)
            log_debug("Test data preclean complete")
        except Exception as e:
            log_error(f"Error during preclean: {e}")
            self.fail("Pre-clean step failed")

        try:
            # Test upload JD with ADMIN
            log_info("[Step 1] Upload JD")
            response = self.upload_jd(self.admin_token)
            self.assertEqual(response.status_code, 200)

            # Test upload CV with ADMIN
            log_info("[Step 2] Upload CV")
            response = self.upload_cv(self.user_token, email, position)
            self.assertEqual(response.status_code, 200)
            time.sleep(10)

            # Test GET Pending CV with admin
            log_info("[Step 3] Get pending CV")
            pending_cv = self.get_pending_cv(name, self.admin_token)
            self.assertGreater(len(pending_cv), 0)
            cv_id = pending_cv[0]["id"]

            # Test Approve CV with admin
            log_info("[Step 4] Approve CV")
            response = api_request(
                "POST",
                f"{BASE_URL}/cvs/{str(cv_id)}/approve",
                data={"candidate_id": str(cv_id)},
                headers=get_headers(self.admin_token),
            )
            self.assertIn(response.status_code, [200, 400])
            time.sleep(10)

            # Test Update CV with ADMIN
            log_info("[Step 5] Update CV")
            response = api_request(
                "PUT",
                f"{BASE_URL}/cvs/{cv_id}",
                json={"status": "Updated"},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            # Test get CV with ADMIN
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

            # Test get Interviews candidate with admin
            log_info("[Step 8] Get Interviews")
            response = api_request(
                "GET",
                f"{BASE_URL}/interviews",
                params={"candidate_name": name},
                headers=get_headers(self.admin_token),
            )
            interview_id = response.json()[0]["id"]

            # Test Accept the interview with admin
            log_info("[Step 9] Accept Interview")
            response = api_request(
                "POST",
                f"{BASE_URL}/interviews/accept",
                json={"candidate_id": interview_id},
                headers=get_headers(self.admin_token),
            )
            log_info(f"Accept Interview Response: {response.json()}")
            self.assertEqual(response.status_code, 200)
            time.sleep(30)
            
            # Test the interview questions were generated after candidate accepted the interview
            log_info("Checking if interview questions were generated")
            questions_response = api_request(
                "GET", f"{BASE_URL}/interview-questions/{cv_id}/questions",
                headers=get_headers(self.admin_token)
            )
            self.assertEqual(questions_response.status_code, 200)

            questions_before = questions_response.json()
            log_info(f"Get the interview_questions: {questions_before}")
            self.assertGreater(len(questions_before), 0)

            # Edit the first question
            question_id = questions_before[0]["id"]
            original_question = questions_before[0]["original_question"]
            new_question_edit = "This is a modified version of the original question."

            edit_response = api_request(
                "PUT", f"{BASE_URL}/interview-questions/{question_id}/edit",
                json={"new_question": new_question_edit},
                headers=get_headers(self.admin_token)
            )
            self.assertEqual(edit_response.status_code, 200)

            # Re-fetch and validate edit
            log_info("Check if the question was successfully edited")
            questions_response_post = api_request(
                "GET", f"{BASE_URL}/interview-questions/{cv_id}/questions",
                headers=get_headers(self.admin_token)
            )
            self.assertEqual(questions_response_post.status_code, 200)
            questions_after = questions_response_post.json()
            log_info(f"Get the interview_questions after edit: {questions_after}")

            # Assert the edit actually changed the content
            self.assertNotEqual(
                questions_after[0]["edited_question"], original_question,
                "Edited question must differ from the original"
            )

            log_info(f"Checking if interview questios were regenerated")
            response = api_request(
                "POST", f"{BASE_URL}/interview-questions/{cv_id}/questions/regenerate",
                headers=get_headers(self.admin_token)
            )
            self.assertEqual(response.status_code, 200)
            log_info(f"Get the interview_questions regenerated: {response.json()}")
            self.assertGreater(len(response.json()), 0)

            # Test update the interview change the interviewer_name with admin
            log_info("[Step 10] Update Interview")
            response = api_request(
                "PUT",
                f"{BASE_URL}/interviews/{interview_id}",
                json={"interviewer_name": "Nguyen Van C"},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            # Test candidate cancel the interview schedule
            log_info("[Step 11] Cancel Interview")
            response = api_request(
                "POST",
                f"{BASE_URL}/interviews/{interview_id}/cancel",
                headers=get_headers(self.user_token),
            )
            self.assertEqual(response.status_code, 200)

            # Get list all CVs with admin
            log_info("[Step 12] List All CVs")
            response = api_request(
                "GET",
                f"{BASE_URL}/cvs/position",
                params={"position": position},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)

            # Get JD list with admin
            log_info("[Step 13] Get JD List")
            response = api_request(
                "GET", f"{BASE_URL}/jds", headers=get_headers(self.admin_token)
            )
            jd_id = response.json()[0]["id"]

            # Update JD with admin
            log_info("[Step 14] Update JD")
            response = api_request(
                "PUT",
                f"{BASE_URL}/jds/{jd_id}",
                json={"level": "Senior"},
                headers=get_headers(self.admin_token),
            )
            self.assertEqual(response.status_code, 200)
            
            # Delete JD with admin
            log_info("[Step 15] Delete JD")
            self.clean_jd("Senior DevOps Engineer")

        except Exception as e:
            log_error(f"Test failed with error: {e}")
            self.fail("Exception occurred during test flow")

        log_info("TEST: " + inspect.currentframe().f_code.co_name + ": OK")

    def test_permission_denied_for_user_approving_cv(self):
        """Ensure USER role is not allowed to upload JD or approve CV."""
        log_info("TEST: " + inspect.currentframe().f_code.co_name)

        name = "Nguyễn Bảo Ngọc"
        email = "kudung053@gmail.com"
        position = "Tuyển sinh vào lớp 10 chuyên Văn"
        unmatch_position = "Senior Fullstack Developer (Java+React)"

        self.preclean_candidate(name, position)

        # Upload JD with candidate user => Blocked
        log_info("Trying to Upload JD with USER role")
        response = self.upload_jd(self.user_token)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json().get("detail"), "Insufficient permission")

        log_info("Uploading JD as ADMIN for CV testing")
        self.upload_jd(self.admin_token)

        # Upload the CV with unmatch JD
        log_info("Trying to upload CV with unmatch position")
        response = self.upload_cv(self.user_token, email, unmatch_position)
        self.assertEqual(response.status_code, 200)
        log_info("Unmatch position CV response: " + str(response.json().get("message")))

        # Upload CV with User => Pass
        log_info("Uploading CV with USER role")
        response = self.upload_cv(self.user_token, email, position)
        self.assertEqual(response.status_code, 200)
        time.sleep(10)

        # Get Pending CVs with candidate user => Blocked
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
        pending_cv = self.get_pending_cv(name, self.admin_token)
        if not pending_cv:
            log_info("No pending CV found, skipping test.")
            self.skipTest("No pending CV found for permission test.")
        candidate_id = pending_cv[0]["id"]

        # Approve CV with candidate user => Blocked
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