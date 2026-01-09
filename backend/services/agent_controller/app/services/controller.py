import yaml
import os
import httpx
from pathlib import Path
from string import Template
from jsonschema import validate, ValidationError
from config.log_config import AppLogger
from schemas.response import make_standard_response
from services.genai import get_http_client

logger = AppLogger(__name__)


class AgentController:
    def __init__(self, yaml_path=None):
        if yaml_path is None:
            base_dir = Path(__file__).parent.parent  # adjust as needed
            yaml_path = base_dir / "config" / "pipeline.yaml"
        else:
            yaml_path = Path(yaml_path)

        with open(yaml_path) as f:
            raw = f.read()
            substituted = Template(raw).safe_substitute(os.environ)
            self.pipeline_config = yaml.safe_load(substituted)["pipeline"]
        self.pipeline_map = {step["task"]: step for step in self.pipeline_config}

    async def call_agent(
        self, endpoint: str, method: str, payload: dict = None, token: str = None
    ):
        method = method.upper()
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        try:
            client = await get_http_client()
            if method == "GET":
                r = await client.get(endpoint, params=payload, headers=headers)
            elif method == "POST":
                r = await client.post(endpoint, json=payload, headers=headers)
            elif method == "PUT":
                r = await client.put(endpoint, json=payload, headers=headers)
            elif method == "DELETE":
                r = await client.delete(endpoint, json=payload, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            r.raise_for_status()
            return r.json()
        except httpx.TimeoutException as e:
            logger.error(f"Timeout calling {endpoint}: {e}")
            raise
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error calling {endpoint}: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error calling {endpoint}: {e}")
            raise

    async def run(self, start_task: str, data: dict = None, token: str = None):
        task_name = start_task
        history = []
        payload = data or {}

        # Add initial input data to history
        history.append({"input": payload})

        while task_name:
            step = self.pipeline_map[task_name]

            # Validate input if in schema
            if "input_schema" in step:
                try:
                    validate(instance=payload, schema=step["input_schema"])
                except ValidationError as e:
                    return make_standard_response(
                        success=False,
                        error=f"Input validation failed for {task_name}: {e.message}",
                        data=None,
                        history=history,
                        input_data=data,
                    )

            # Call agent (async)
            try:
                result = await self.call_agent(
                    step["endpoint"], step.get("method", "POST"), payload, token
                )
            except (httpx.HTTPStatusError, httpx.RequestError, httpx.TimeoutException) as e:
                return make_standard_response(
                    success=False,
                    error=f"Agent call failed for {task_name}: {str(e)}",
                    data=None,
                    history=history,
                    input_data=data,
                )

            # Validate output if in schema
            if "output_schema" in step:
                try:
                    validate(instance=result, schema=step["output_schema"])
                except ValidationError as e:
                    return make_standard_response(
                        success=False,
                        error=f"Output validation failed for {task_name}: {e.message}",
                        data=result,
                        history=history,
                        input_data=data,
                    )

            history.append({task_name: result})

            # Handle condition
            if "condition" in step:
                cond = step["condition"]
                if eval(cond["if"], {}, {"output": result}):
                    task_name = cond["then"]
                else:
                    task_name = cond["else"]
            else:
                task_name = step.get("next")

            # Prepare input for next step
            payload = result

        return make_standard_response(
            success=True,
            error=None,
            data=history[-1] if history else None,
            history=history,
            input_data=data,
        )
