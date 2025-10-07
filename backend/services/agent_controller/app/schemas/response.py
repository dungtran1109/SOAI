def make_standard_response(
    success: bool, error: str = None, data=None, history=None, input_data=None
):
    """
    Create a standardized response dict for pipeline execution.

    Args:
        success (bool): True if execution succeeded, False otherwise.
        error (str): Error message if any, else None.
        data: Final output data.
        history (list): List of step results.
        input_data: Initial input data.

    Returns:
        dict: Standardized response.
    """
    return {
        "success": success,
        "error": error,
        "data": data,
        "history": history or [],
        "input_data": input_data,
    }
