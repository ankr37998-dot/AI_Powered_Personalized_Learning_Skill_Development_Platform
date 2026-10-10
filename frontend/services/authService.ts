import { UserProfile, AuthSession, LoginCredentials, RegisterPayload } from '../types';
import { storageService } from './storageService';

const AUTH_SESSION_KEY = 'cognipath_auth_session';
const REGISTERED_ACCOUNTS_KEY = 'cognipath_auth_accounts';

export const authService = {
  /**
   * Retrieves active authenticated session or null if unauthenticated / expired
   */
  getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);

      // Check if session has expired (default: 7 days)
      if (!session.expiresAt || session.expiresAt < Date.now()) {
        this.logout();
        return null;
      }

      // Enforce student-only role
      if (session.user) {
        session.user.role = 'student';
      }

      return session;
    } catch {
      return null;
    }
  },

  /**
   * Authenticates student credentials
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    // Try backend authentication endpoint if running
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(2500)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          this.saveSession(data.session);
          return { success: true, user: data.session.user };
        }
      }
    } catch {
      // Backend offline or timeout; gracefully fall back to local authenticated accounts store
    }

    // Verify against accounts store
    const accounts = this.getStoredAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email);

    if (!account) {
      // If student enters demo credentials (alex.rivera@university.edu / password123)
      if (email === 'alex.rivera@university.edu' && password === 'password123') {
        const demoUser = storageService.getUserProfile();
        const session: AuthSession = {
          token: `token_demo_${Date.now()}`,
          user: demoUser,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        };
        this.saveSession(session);
        return { success: true, user: demoUser };
      }

      return { success: false, error: 'Invalid email or password. Please check your credentials or register.' };
    }

    if (account.password !== password) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    const session: AuthSession = {
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user: account.profile,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    this.saveSession(session);
    return { success: true, user: account.profile };
  },

  /**
   * Registers a new Student account (Student role strictly assigned by default)
   */
  async register(payload: RegisterPayload): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;

    if (!name) return { success: false, error: 'Full name is required.' };
    if (!email || !email.includes('@')) return { success: false, error: 'Please enter a valid email address.' };
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters long.' };

    const accounts = this.getStoredAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === email) || email === 'alex.rivera@university.edu') {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    const newStudentProfile: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
      role: 'student', // Non-negotiable student role assignment
      targetGoal: payload.targetGoal?.trim() || 'Master Full-Stack Software Engineering',
      currentSkillLevel: payload.currentSkillLevel || 'beginner',
      preferredLanguage: payload.preferredLanguage || 'JavaScript / TypeScript',
      registeredDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    // Save account
    accounts.push({
      email,
      password,
      profile: newStudentProfile
    });
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));

    // Automatically create authenticated session
    const session: AuthSession = {
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user: newStudentProfile,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    this.saveSession(session);
    storageService.setUserProfile(newStudentProfile);

    // Try posting to backend database asynchronously
    fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, role: 'student' })
    }).catch(() => {});

    return { success: true, user: newStudentProfile };
  },

  /**
   * Clears the student session and logs out
   */
  logout(): void {
    localStorage.removeItem(AUTH_SESSION_KEY);
  },

  saveSession(session: AuthSession): void {
    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      storageService.setUserProfile(session.user);
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  },

  getStoredAccounts(): { email: string; password: string; profile: UserProfile }[] {
    try {
      const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
};
