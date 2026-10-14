import { request } from "./client";

const rolePath = {
  admin: "/admin",
  vendor: "/vendor",
};

export function register(role, payload) {
  return request(`${rolePath[role]}/register`, { method: "POST", body: payload });
}

export function login(role, payload) {
  return request(`${rolePath[role]}/login`, { method: "POST", body: payload });
}

export function me(token) {
  return request("/auth/me", { token });
}

export function logout(token) {
  return request("/auth/logout", { method: "POST", token });
}
