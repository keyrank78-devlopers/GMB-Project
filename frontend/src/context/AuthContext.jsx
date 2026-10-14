import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { updateVendorProfile } from "../api/profile";

const TOKEN_KEY = "gmb_access_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setReady(true);
      return;
    }

    setToken(saved);
    authApi
      .me(saved)
      .then((data) => setUser(data.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    ready,
    async login(role, credentials) {
      const data = await authApi.login(role, credentials);
      localStorage.setItem(TOKEN_KEY, data.data.accessToken);
      setToken(data.data.accessToken);
      setUser(data.data.user);
      return data.data.user;
    },
    async register(role, payload) {
      await authApi.register(role, payload);
      const credentials = role === "admin"
        ? { email: payload.email, password: payload.password }
        : { username: payload.username, password: payload.password };
      const data = await authApi.login(role, credentials);
      localStorage.setItem(TOKEN_KEY, data.data.accessToken);
      setToken(data.data.accessToken);
      setUser(data.data.user);
      return data.data.user;
    },
    async refreshUser() {
      if (!token) return null;
      const data = await authApi.me(token);
      setUser(data.data);
      return data.data;
    },
    async updateProfile(payload) {
      const data = await updateVendorProfile(token, payload);
      if (data.accessToken) {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        setToken(data.accessToken);
      }
      setUser(data.data);
      return data;
    },
    async logout() {
      try {
        if (token) await authApi.logout(token);
      } finally {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    },
  }), [token, user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
