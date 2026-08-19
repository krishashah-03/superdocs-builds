const API_BASE = "http://127.0.0.1:8000";

async function request(path, { method = "GET", userId, body } = {}) {
  const headers = { "X-User-Id": userId };
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return data;
}

export function listDocuments(matterId, userId) {
  return request(`/matters/${matterId}/documents`, { userId });
}

export function checkoutDocument(matterId, documentId, userId) {
  return request(`/matters/${matterId}/documents/${documentId}/checkout`, {
    method: "POST",
    userId,
  });
}

export function discardCheckout(matterId, documentId, userId) {
  return request(`/matters/${matterId}/documents/${documentId}/discard-checkout`, {
    method: "POST",
    userId,
  });
}

export function proposeEdit(matterId, documentId, userId, instruction) {
  return request(`/matters/${matterId}/documents/${documentId}/edit`, {
    method: "POST",
    userId,
    body: { instruction },
  });
}

export function reviewChanges(matterId, documentId, userId, jobId, decisions) {
  return request(`/matters/${matterId}/documents/${documentId}/review`, {
    method: "POST",
    userId,
    body: { job_id: jobId, decisions },
  });
}

export function checkinDocument(matterId, documentId, userId, versionComment) {
  return request(`/matters/${matterId}/documents/${documentId}/checkin`, {
    method: "POST",
    userId,
    body: { version_comment: versionComment },
  });
}

export function listVersions(matterId, documentId, userId) {
  return request(`/matters/${matterId}/documents/${documentId}/versions`, { userId });
}

// Downloads need the X-User-Id header for the ethical-wall check, so a plain
// <a href> won't work (browsers don't attach custom headers to link
// navigation). Fetch as a blob instead, then trigger the save manually.
export async function downloadVersion(matterId, documentId, versionNumber, userId, filename) {
  const response = await fetch(
    `${API_BASE}/matters/${matterId}/documents/${documentId}/versions/${versionNumber}/download`,
    { headers: { "X-User-Id": userId } }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Download failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadDocument(matterId, userId, title, file) {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  const response = await fetch(`${API_BASE}/matters/${matterId}/documents`, {
    method: "POST",
    headers: { "X-User-Id": userId },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    throw new Error(detail || `Upload failed (${response.status})`);
  }
  return data;
}