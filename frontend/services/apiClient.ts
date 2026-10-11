import {
  BackendHealthState,
  LearningResource,
  AssessmentAttempt,
  UserProfile,
  CatalogTopic,
  ReportedResourceIssue,
} from "../types";

const API_BASE_URL =
  typeof window !== "undefined" && window.location.port === "5000"
    ? ""
    : "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  try {
    const session = JSON.parse(
      localStorage.getItem("cognipath_auth_session") || "null",
    );
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  } catch {
    return {};
  }
}

export const apiClient = {
  async getAdminMetrics(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/admin/metrics`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Admin metrics request failed.");
    return data;
  },

  async getAdminUsers(
    options: {
      search?: string;
      role?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const query = new URLSearchParams({
      search: options.search || "",
      role: options.role || "all",
      status: options.status || "all",
      page: String(options.page || 1),
      limit: String(options.limit || 5),
    });
    const response = await fetch(`${API_BASE_URL}/api/admin/users?${query}`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Admin user request failed.");
    return data;
  },

  async updateAdminUser(
    id: string,
    updates: { role?: string; status?: string },
  ): Promise<UserProfile> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(8000),
      },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Admin user update failed.");
    return data.user as UserProfile;
  },

  async submitResourceReport(report: {
    resourceId: string;
    reason: string;
    studentNotes: string;
  }): Promise<ReportedResourceIssue> {
    const response = await fetch(`${API_BASE_URL}/api/resource-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Resource report could not be saved.");
    return data.data as ReportedResourceIssue;
  },

  async getStudentState(): Promise<{
    state: Record<string, unknown> | null;
    hasStudentState: boolean;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/state`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      throw new Error(`State load failed (HTTP ${response.status}).`);
    const data = await response.json();
    return {
      state: data.state || null,
      hasStudentState: Boolean(data.hasStudentState),
    };
  },

  async saveStudentState(state: Record<string, unknown>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ state }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      throw new Error(`State save failed (HTTP ${response.status}).`);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Profile update failed.");
    return data.user as UserProfile;
  },

  /**
   * Pings backend health endpoint to check Express server and MongoDB Atlas status
   */
  async checkBackendHealth(): Promise<BackendHealthState> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        isServerReachable: true,
        databaseConnected: Boolean(data.databaseConnected),
        databaseName: data.databaseName || "cognipath_ai",
        databaseHost: data.databaseHost || "Unavailable",
        googleAiConfigured: Boolean(data.googleAiConfigured),
        activePort: data.port || 5000,
        mode: "standalone_express",
        latencyMs: latency,
      };
    } catch (err: any) {
      return {
        isServerReachable: false,
        databaseConnected: false,
        databaseName: "cognipath_ai",
        databaseHost: "Unavailable",
        googleAiConfigured: false,
        activePort: 5000,
        mode: "browser_orchestrated_service",
        latencyMs: 12,
      };
    }
  },

  /**
   * Submits an assessment attempt to the backend
   */
  async submitAssessment(
    attemptData: Partial<AssessmentAttempt>,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assessments/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          topicId: attemptData.topicId,
          topicTitle: attemptData.topicTitle,
          answers: (attemptData.answers || []).map(
            ({ questionId, selectedOption }) => ({
              questionId,
              selectedOption,
            }),
          ),
        }),
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) throw new Error("API server rejected submission");
      const json = await response.json();
      return { success: true, data: json.data };
    } catch (err: any) {
      // Graceful fallback to client storage engine
      return { success: false, error: err.message };
    }
  },
};
