const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

// All backend responses are { success: true, data: T } or { success: true, message: string }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  const json = await res.json();
  // Unwrap { success, data } envelope
  return (json.data !== undefined ? json.data : json) as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  name: string;
  email: string;
  picture?: string | null;
  createdAt?: string;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request<User>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<User>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request<{ message: string }>("/api/auth/logout", { method: "POST" }),
  me: () => request<User>("/api/auth/me"),
  forgotPassword: (data: { email: string }) =>
    request<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request<{ message: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
};

// ─── Jobs ────────────────────────────────────────────────────────────────────

export interface Job {
  jobId: string;
  userId?: string;
  company: string;
  role: string;
  date: string;
  applied: "yes" | "no";
  openingType?: "public" | "referral" | "internal";
  referral?: "available" | "not_available";
  shortlisted?: "yes" | "no" | "waiting";
  interviews?: "yes" | "no" | "waiting";
  selected: "yes" | "no" | "waiting";
  companyLogo?: string | null;
  companyDomain?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export type CreateJobInput = {
  company: string;
  role: string;
  date: string;
  applied?: "yes" | "no";
  openingType?: "public" | "referral" | "internal";
  selected?: "yes" | "no" | "waiting";
  notes?: string;
};

export const jobsApi = {
  getAll: () => request<Job[]>("/api/jobs"),
  create: (data: Partial<Job>) =>
    request<Job>("/api/jobs", { method: "POST", body: JSON.stringify(data) }),
  update: (jobId: string, data: Partial<Job>) =>
    request<Job>(`/api/jobs/${jobId}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (jobId: string) => request<{ message: string }>(`/api/jobs/${jobId}`, { method: "DELETE" }),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface Task {
  taskId: string;
  userId?: string;
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  date: string;
  completed: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export const tasksApi = {
  getAll: () => request<Task[]>("/api/tasks"),
  create: (data: Partial<Task>) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (taskId: string, data: Partial<Task>) =>
    request<Task>(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (taskId: string) => request<{ message: string }>(`/api/tasks/${taskId}`, { method: "DELETE" }),
};

// ─── Templates ───────────────────────────────────────────────────────────────

export interface Template {
  templateId: string;
  userId?: string;
  category: "cover_letter" | "resume" | "cold_email" | "follow_up" | "other";
  templateType: "technical" | "behavioral" | "general";
  title: string;
  content: string;
  updatedAt?: string;
  createdAt?: string;
}

export const templatesApi = {
  getAll: () => request<Template[]>("/api/templates"),
  create: (data: Partial<Template>) =>
    request<Template>("/api/templates", { method: "POST", body: JSON.stringify(data) }),
  update: (templateId: string, data: Partial<Template>) =>
    request<Template>(`/api/templates/${templateId}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (templateId: string) => request<{ message: string }>(`/api/templates/${templateId}`, { method: "DELETE" }),
  seedDefaults: () => request<{ message: string; seeded: number }>("/api/templates/seed-defaults", { method: "POST" }),
};
