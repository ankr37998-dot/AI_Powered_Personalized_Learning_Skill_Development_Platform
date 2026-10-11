import {
  UserProfile,
  AuthSession,
  LoginCredentials,
  RegisterPayload,
} from "../types";
import { storageService } from "./storageService";

const AUTH_SESSION_KEY = "cognipath_auth_session";
const API_BASE_URL = "http://localhost:5000";

type AuthResult = { success: boolean; user?: UserProfile; error?: string };

async function readError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return typeof data.error === "string"
    ? data.error
    : `Authentication failed (HTTP ${response.status}).`;
}

export const authService = {
  getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (
        !session.expiresAt ||
        session.expiresAt < Date.now() ||
        !session.token
      ) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const email = credentials.email.trim().toLowerCase();
    if (!email || !credentials.password) {
      return { success: false, error: "Email and password are required." };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: credentials.password }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        return { success: false, error: await readError(response) };
      const data = await response.json();
      if (!data.session?.token || !data.session?.user) {
        return {
          success: false,
          error: "The server returned an invalid session.",
        };
      }
      this.saveSession(data.session);
      return { success: true, user: data.session.user };
    } catch {
      return {
        success: false,
        error: "Authentication server is unavailable. Please try again.",
      };
    }
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    if (!name) return { success: false, error: "Full name is required." };
    if (!email || !email.includes("@"))
      return { success: false, error: "Please enter a valid email address." };
    if (payload.password.length < 8 || payload.password.length > 128) {
      return {
        success: false,
        error: "Password must be between 8 and 128 characters.",
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, name, email, role: "student" }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        return { success: false, error: await readError(response) };
      const data = await response.json();
      if (!data.session?.token || !data.session?.user) {
        return {
          success: false,
          error: "The server returned an invalid session.",
        };
      }
      this.saveSession(data.session);
      return { success: true, user: data.session.user };
    } catch {
      return {
        success: false,
        error: "Registration server is unavailable. Please try again.",
      };
    }
  },

  async validateSession(): Promise<UserProfile | null> {
    const session = this.getCurrentSession();
    if (!session) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.token}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        this.clearLocalSession();
        return null;
      }
      const data = await response.json();
      const refreshed = { ...session, user: data.user };
      this.saveSession(refreshed);
      return data.user as UserProfile;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    const session = this.getCurrentSession();
    try {
      if (session?.token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
          signal: AbortSignal.timeout(3000),
        });
      }
    } catch {
      // Clear the local session even when the API cannot be reached.
    } finally {
      this.clearLocalSession();
    }
  },

  saveSession(session: AuthSession): void {
    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      storageService.setUserProfile(session.user);
    } catch (error) {
      console.warn("Failed to save auth session:", error);
    }
  },

  clearLocalSession(): void {
    localStorage.removeItem(AUTH_SESSION_KEY);
  },
};
