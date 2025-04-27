// src/types/api.ts

// --- Base Structures ---
export interface ApiResponse<T = any> {
  // Use generics for the data type
  status: "success" | "error" | string; // Allow other statuses if needed
  message: string | null;
  data: T | null; // Make data potentially null based on schema
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HttpValidationError {
  detail?: ValidationError[];
}

// --- User Related ---
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null; // Updated based on SignUpModel
  created_at: string; // Keep as string from JSON
}

// Login/Signup Models (if needed elsewhere, otherwise defined in components)
export interface LoginModel {
  email: string;
  password?: string; // Password might not always be needed in responses
}

export interface SignUpModel {
  name: string;
  email: string;
  password?: string; // Password usually not returned
  phone: string | null;
  created_at: string;
}

// --- Profile Related ---
export interface ProfileModel {
  profile_name: string;
  user_id: number;
  name: string; // Name associated with this profile (can differ from user name)
  email: string; // Email associated with this profile
  phone?: string | null;
  address?: string | null;
  education?: string | null; // Consider using a structured type later (e.g., array of objects)
  experience?: string | null; // ^ same
  skills?: string | null; // ^ same
  certifications?: string | null; // ^ same
  projects?: string | null; // ^ same
  languages?: string | null; // ^ same
  hobbies?: string | null; // ^ same
  created_at: string;
  // Add 'id' if the backend returns it when listing/getting profiles
  id?: number;
}

// --- Resume Related ---
export interface GeneratedResume {
  // From request schema:
  user_id: number;
  user_resume_id: number; // NOTE: This seems like it should be profile_id based on context/API path. Clarify if possible. Assume it's the base profile ID for now.
  profile_id?: number; // Maybe add this if user_resume_id is confusing
  name: string; // Name given to this generated resume
  job_title: string;
  job_description: string;
  new_resume?: string | null; // The generated content (LaTeX, Markdown, etc.)
  created_at: string;
  // Add 'id'/'resume_id' if the backend returns it when listing/getting resumes
  id?: number; // Assuming the backend adds an ID for the generated resume
  resume_id?: number; // Alias for id?
}

// Type for the request body when creating a resume
export type NewResumePayload = Omit<
  GeneratedResume,
  "id" | "resume_id" | "new_resume"
>; // Omit fields backend generates

// --- Settings Related ---
export interface UpdateUserPayload {
  password?: string;
  phone?: string | null;
  // Add other updatable fields if needed
}
