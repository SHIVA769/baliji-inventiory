import { getToken, clearToken } from "./authStorage.js";

const base = "/api";

function authHeaders() {
  const t = getToken();
  const h = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

function redirectToLogin() {
  clearToken();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function parseErrorBody(r) {
  const text = await r.text();
  try {
    const j = JSON.parse(text);
    return j.error || text || r.statusText;
  } catch {
    return text || r.statusText;
  }
}

async function apiFetch(path, options = {}) {
  const { headers: extraHeaders, body, ...rest } = options;
  let bodyInit = body;
  if (
    bodyInit != null &&
    typeof bodyInit === "object" &&
    !(bodyInit instanceof FormData)
  ) {
    bodyInit = JSON.stringify(bodyInit);
  }
  const headers = { ...authHeaders(), ...extraHeaders };
  let r;
  try {
    r = await fetch(`${base}${path}`, { ...rest, headers, body: bodyInit });
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "Cannot reach API. Start the Node server on port 5000 and ensure MongoDB is running."
      );
    }
    throw e;
  }
  if (r.status === 401) {
    redirectToLogin();
    throw new Error("Session expired. Sign in again.");
  }
  if (!r.ok) throw new Error(await parseErrorBody(r));
  if (r.status === 204) return null;
  const ct = r.headers.get("content-type");
  if (ct && ct.includes("application/json")) return r.json();
  return r.text();
}

export async function getProducts() {
  return apiFetch("/products", { method: "GET" });
}

export async function createProduct(body) {
  return apiFetch("/products", { method: "POST", body });
}

export async function updateProduct(id, body) {
  return apiFetch(`/products/${id}`, { method: "PATCH", body });
}

export async function adjustProduct(id, delta) {
  return apiFetch(`/products/${id}/adjust`, { method: "POST", body: { delta } });
}

export async function deleteProduct(id) {
  return apiFetch(`/products/${id}`, { method: "DELETE" });
}

export async function getTransactions() {
  return apiFetch("/transactions", { method: "GET" });
}

export async function changePassword(body) {
  return apiFetch("/auth/change-password", { method: "POST", body });
}
