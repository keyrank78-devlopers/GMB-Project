const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}/api/v1${path}`;
}

export async function request(path, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error("Cannot reach the server. Start the backend on port 5000.");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.code = data.code;
    error.errors = data.errors || [];
    error.status = response.status;
    throw error;
  }
  return data;
}
