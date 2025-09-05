// src/lib/api.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
});

// --- TypeScript Interfaces ---

export interface JobSearchPayload {
  query?: string | null;
  category_ids?: string[] | null;
  locations?: string[] | null;
  first?: number;
  after?: string | null;
}

export interface Client {
  country: string | null;
  total_feedback: number | null;
  total_posted_jobs: number | null;
  total_hires: number | null;
  verification_status: string | null;
  total_reviews: number | null;
}

export interface Job {
  title: string;
  id: string;
  ciphertext: string;
  url: string;
  snippet: string;
  skills: string[];
  date_created: string;
  category2: string;
  subcategory2: string;
  job_type: 'HOURLY' | 'FIXED';
  rate_display: string;
  workload: string | null;
  duration: string | null;
  client: Client;
}

export interface UserProfile {
  upwork_profile: any; // Consider defining a more specific type
  local_additions: any; // Consider defining a more specific type
}

export interface AnalysisPayload {
  job: Job;
  profile: UserProfile;
}

export interface JobAPIResponse {
  jobs: Job[];
  paging: {
    total: number;
    next_cursor: string | null;
    has_next_page: boolean;
  };
}

// --- API Functions ---

export const getAuthStatus = async () => {
  const response = await apiClient.get('/auth/status');
  return response.data;
};

export const fetchUserProfile = async () => {
  const response = await apiClient.get('/profile');
  return response.data;
};

export const fetchLocalProfile = async () => {
  const response = await apiClient.get('/local-profile');
  return response.data;
};

export const updateLocalProfile = async (profileData: any) => {
  const response = await apiClient.post('/local-profile', profileData);
  return response.data;
};

export const fetchJobs = async (payload: JobSearchPayload): Promise<JobAPIResponse> => {
  const response = await apiClient.post('/jobs/fetch', payload);
  return response.data;
};

export const getCategories = async () => {
  const response = await apiClient.get("/filters/categories");
  return response.data;
};

export const analyzeJob = async (payload: AnalysisPayload) => {
  const response = await apiClient.post('/jobs/analyze', payload);
  return response.data;
};

export const login = () => {
  window.location.href = `${apiClient.defaults.baseURL}/login`;
};