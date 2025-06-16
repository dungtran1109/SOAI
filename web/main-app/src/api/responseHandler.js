export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorMap = {
      400: "Bad request, please check your input.",
      401: "Unauthorized, please log in again.",
      403: "Forbidden, you do not have permission to access this resource.",
      404: "Not found.",
      408: "Request timeout, please try again later.",
      429: "Too many requests, please try again later.",
      500: "Internal server error, please try again later.",
      502: "Bad gateway, please try again later.",
      503: "Service unavailable, please try again later.",
      504: "Gateway timeout, please try again later.",
    };
    const message = errorMap[response.status] || "An unexpected error occurred.";
    throw new Error(message);
  }

  if (response.status === 204) return null;

  try {
    const result = await response.json();
    console.log("[DEBUG handleResponse] Parsed JSON:", result);
    return result;
  } catch (err) {
    console.error("[DEBUG handleResponse] Failed to parse JSON:", err);
    return null;
  }
};