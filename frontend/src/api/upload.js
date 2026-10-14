import { apiUrl } from "./client";

export async function sendFile(path, token, { method = "POST", file } = {}) {
  const body = new FormData();
  if (file) body.append("image", file);
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: file ? body : undefined,
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
    throw error;
  }
  return data;
}
