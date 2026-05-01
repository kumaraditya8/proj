import { api } from "./client";
import type { Role, User } from "@/types";

const TOKEN_KEY = "pm_token";
const USER_KEY = "pm_user";

export interface AuthResult {
  user: User;
  token: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResult> {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },

  async signup(name: string, email: string, password: string, role: Role = "member"): Promise<AuthResult> {
    const { data } = await api.post("/auth/signup", { name, email, password, role });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  current(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (!raw || !token) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
};
