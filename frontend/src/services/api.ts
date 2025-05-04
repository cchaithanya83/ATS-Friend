
import axios, { AxiosError, AxiosResponse } from "axios";
import {
  ApiResponse,
  ProfileModel,
  GeneratedResume,
  NewResumePayload,
  UpdateUserPayload,
  User,
  HttpValidationError,
  ResumeData,
} from "../types/api";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Type guard for AxiosError
function isApiError(
  error: unknown
): error is AxiosError<HttpValidationError | ApiResponse<null>> {
  return axios.isAxiosError(error);
}

// Helper to extract user ID
const getUserId = (): number | null => {
  try {
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) return null;
    const userData: User = JSON.parse(userDataString);
    return userData?.id ?? null;
  } catch (e) {
    console.error("Error parsing user data:", e);
    return null;
  }
};

// --- Profile Endpoints ---

export const fetchProfiles = async (
  userId: number
): Promise<ProfileModel[]> => {
  try {
    interface ProfileListContainer {
      profiles: ProfileModel[];
    }
    type ProfileListApiResponse = ApiResponse<ProfileListContainer>;

    const response = await apiClient.get<ProfileListApiResponse>(
      `/profile/${userId}`
    );
    console.log("API Response in fetchProfiles:", response.data);

    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data === "object" &&
      Array.isArray(response.data.data.profiles)
    ) {
      return response.data.data.profiles.map((p) => ({
        ...p,
      }));
    }

    console.warn(
      "fetchProfiles: API call successful, but response format is unexpected:",
      response.data
    );
    throw new Error(
      response.data.message ||
        "Failed to fetch profiles: Unexpected response structure"
    );
  } catch (error) {
    console.error("API Error caught in fetchProfiles:", error);
    if (isApiError(error) && error.response?.status === 404) {
      console.log("Caught 404 fetching profiles, treating as empty list.");
      return [];
    }

    if (
      isApiError(error) &&
      (error.response?.data as HttpValidationError)?.detail
    ) {
      throw new Error("Error fetching profiles: ");
    }
    if (error instanceof Error) {
      throw new Error(
        error.message || "An unknown error occurred while fetching profiles."
      );
    } else {
      throw new Error("An unknown error occurred while fetching profiles.");
    }
  }
};

export const createProfile = async (
  profileData: Omit<ProfileModel, "id" | "created_at">
): Promise<ProfileModel> => {
  const payload = {
    ...profileData,
    created_at: new Date().toISOString(),
  };

  try {
    interface CreateProfileApiResponseData {
      new_profile_id: number;
      user: {
        profile_name: string;
        user_id: number;
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
        links: string | null;
        education: string | null;
        experience: string | null;
        skills: string | null;
        certifications: string | null;
        projects: string | null;
        languages: string | null;
        hobbies: string | null;
        created_at: string;
      };
    }
    type CreateProfileApiResponse = ApiResponse<CreateProfileApiResponseData>;

    const response = await apiClient.post<CreateProfileApiResponse>(
      `/profile`,
      payload
    );

    console.log("API Response in createProfile:", response.data);

    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data === "object" &&
      typeof response.data.data.new_profile_id === "number" &&
      typeof response.data.data.user === "object" &&
      response.data.data.user !== null &&
      "profile_name" in response.data.data.user
    ) {
      const profileDetailsFromApi = response.data.data.user;
      const newId = response.data.data.new_profile_id;

      const createdProfile: ProfileModel = {
        id: newId,
        user_id: profileDetailsFromApi.user_id,
        profile_name: profileDetailsFromApi.profile_name,
        name: profileDetailsFromApi.name,
        email: profileDetailsFromApi.email,
        phone: profileDetailsFromApi.phone,
        address: profileDetailsFromApi.address,
        links: profileDetailsFromApi.links,
        education: profileDetailsFromApi.education,
        experience: profileDetailsFromApi.experience,
        skills: profileDetailsFromApi.skills,
        certifications: profileDetailsFromApi.certifications,
        projects: profileDetailsFromApi.projects,
        languages: profileDetailsFromApi.languages,
        hobbies: profileDetailsFromApi.hobbies,
        created_at: String(profileDetailsFromApi.created_at),
      };
      return createdProfile;
    }

    console.warn(
      "createProfile: API call successful but response format unexpected:",
      response.data
    );
    throw new Error(
      response.data.message ||
        "Failed to create profile: Unexpected response structure"
    );
  } catch (error) {
    console.error("API Error (createProfile):", error);
    if (isApiError(error) && error.response?.status === 422) {
      const errorDetail = (error.response?.data as HttpValidationError)?.detail;
      const message = Array.isArray(errorDetail)
        ? errorDetail
            .map((err) => `${err.loc?.[1] || "Field"}: ${err.msg}`)
            .join("; ")
        : typeof errorDetail === "string"
        ? errorDetail
        : "Validation Failed: Please check your profile details.";
      throw new Error(message);
    }
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Unknown error during profile creation");
    }
  }
};

// --- Resume Endpoints ---

export const uploadResumePDF = async (file: File): Promise<ResumeData> => {
  try {
    interface UploadResumeResponseData {
      resume_data: ResumeData;
    }
    type UploadResumeApiResponse = ApiResponse<UploadResumeResponseData>;

    const formData = new FormData();
    formData.append("pdf", file);

    const response = await apiClient.post<UploadResumeApiResponse>(
      "/pdf-resume",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );

    console.log("API Response in uploadResumePDF:", response.data);

    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data === "object" &&
      response.data.data.resume_data
    ) {
      return response.data.data.resume_data;
    }

    console.warn(
      "uploadResumePDF: API call successful but response format unexpected:",
      response.data
    );
    throw new Error(
      response.data.message ||
        "Failed to parse resume: Unexpected response structure"
    );
  } catch (error) {
    console.error("API Error (uploadResumePDF):", error);
    if (isApiError(error)) {
      if (error.response?.status === 422) {
        const errorDetail = (error.response?.data as HttpValidationError)?.detail;
        const message = Array.isArray(errorDetail)
          ? errorDetail
              .map((err) => `${err.loc?.[1] || "Field"}: ${err.msg}`)
              .join("; ")
          : typeof errorDetail === "string"
          ? errorDetail
          : "Validation Failed: Please check the uploaded PDF.";
        throw new Error(message);
      }
      const responseMessage =
        (error.response?.data as ApiResponse<any>)?.message ||
        (error.response?.data as any)?.detail;
      if (responseMessage) {
        throw new Error(String(responseMessage));
      }
      throw new Error(`HTTP error! status: ${error.response?.status || "unknown"}`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to upload and parse resume.");
  }
};

export const fetchGeneratedResumes = async (
  userId: number
): Promise<GeneratedResume[]> => {
  try {
    interface ResumeListContainer {
      resumes: GeneratedResume[];
    }
    type ResumeListApiResponse = ApiResponse<ResumeListContainer>;

    const response = await apiClient.get<ResumeListApiResponse>(
      `/profile/${userId}/new_resume`
    );
    console.log("API Response in fetchGeneratedResumes:", response.data);

    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data === "object" &&
      Array.isArray(response.data.data.resumes)
    ) {
      return response.data.data.resumes.map((r) => ({
        ...r,
        resume_id: r.id ?? r.resume_id,
        created_at: String(r.created_at),
      }));
    }

    console.warn(
      "fetchGeneratedResumes: API call successful, but response format/status unexpected:",
      response.data
    );
    throw new Error(
      response.data.message ||
        "Failed to fetch resumes: Unexpected response structure"
    );
  } catch (error) {
    console.error("API Error caught in fetchGeneratedResumes:", error);
    if (isApiError(error) && error.response?.status === 404) {
      console.log("Caught 404 fetching resumes, treating as empty list.");
      return [];
    }

    if (
      isApiError(error) &&
      (error.response?.data as HttpValidationError)?.detail
    ) {
      throw new Error("Failed to fetch resume");
    }
    if (error instanceof Error) {
      throw new Error(
        error.message || "An unknown error occurred while fetching resumes."
      );
    } else {
      throw new Error("An unknown error occurred while fetching resumes.");
    }
  }
};

export const fetchSingleResume = async (
  userId: number,
  resumeId: number
): Promise<GeneratedResume> => {
  try {
    interface FetchSingleResumeData {
      resume: GeneratedResume;
    }
    type FetchSingleResumeApiResponse = ApiResponse<FetchSingleResumeData>;

    const response = await apiClient.get<FetchSingleResumeApiResponse>(
      `/profile/${userId}/new_resume/${resumeId}`
    );
    console.log("API Response in fetchSingleResume:", response.data);

    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data === "object" &&
      typeof response.data.data.resume === "object" &&
      response.data.data.resume !== null &&
      "name" in response.data.data.resume
    ) {
      const resumeData = response.data.data.resume;
      return {
        ...resumeData,
        resume_id: resumeData.id ?? resumeData.resume_id,
        created_at: String(resumeData.created_at),
      };
    }

    console.warn(
      "fetchSingleResume: API call successful but response format unexpected:",
      response.data
    );
    throw new Error(
      response.data.message ||
        "Failed to fetch resume details: Unexpected response structure"
    );
  } catch (error) {
    console.error("API Error (fetchSingleResume):", error);
    if (isApiError(error) && error.response?.status === 404) {
      throw new Error("Resume not found.");
    }
    if (isApiError(error) && error.response?.data) {
      throw new Error("Error fetching resume details ");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while fetching resume details.");
  }
};

export const generateNewResume = async (
  userId: number,
  payload: NewResumePayload
): Promise<{
  resume_id: number;
}> => {
  console.warn(
    "generateNewResume: API POSTs data. Expecting { data: { resume_id: number, message: string } } in response."
  );
  const fullPayload = { ...payload };

  try {
    interface GenerateResumeResponseData {
      resume_id: number;
      message: string;
    }
    type GenerateResumeApiResponse = ApiResponse<GenerateResumeResponseData>;

    const response = await apiClient.post<GenerateResumeApiResponse>(
      `/profile/${userId}/new_resume`,
      fullPayload
    );
    console.log("API Response in generateNewResume:", response.data);

    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data.resume_id === "number"
    ) {
      return { resume_id: response.data.data.resume_id };
    }

    console.warn(
      "generateNewResume: API call successful but response format unexpected:",
      response.data
    );
    throw new Error(
      response.data.message ||
        response.data.data?.message ||
        "Failed to generate resume: Unexpected response structure"
    );
  } catch (error) {
    console.error("API Error (generateNewResume):", error);
    if (isApiError(error)) {
      if (error.response?.status === 422) {
        throw new Error(
          "Validation Failed: Please check resume details and JD."
        );
      }
      const responseMessage =
        (error.response?.data as ApiResponse<any>)?.message ||
        (error.response?.data as any)?.detail;
      if (responseMessage) {
        throw new Error(String(responseMessage));
      }
    }
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unknown error occurred during resume generation.");
    }
  }
};

export const fetchResumePdfBlob = async (
  userId: number,
  resumeId: number
): Promise<Blob> => {
  console.log(`Fetching PDF Blob for user ${userId}, resume ${resumeId}`);
  try {
    const response: AxiosResponse<Blob> = await apiClient.get(
      `/profile/${userId}/new_resume/${resumeId}/pdf`,
      {
        responseType: "blob",
      }
    );

    const contentType = response.headers["content-type"];

    if (contentType && contentType.indexOf("application/json") !== -1) {
      try {
        const errorJson = JSON.parse(await response.data.text());
        console.error("Server returned JSON error instead of PDF:", errorJson);
        throw new Error(
          errorJson.message ||
            errorJson.detail ||
            "Server returned an error instead of PDF."
        );
      } catch (parseError) {
        console.error("Failed to parse JSON error response:", parseError);
        throw new Error("Received an invalid error response from server.");
      }
    }

    const isPdf = contentType && contentType.includes("pdf");
    if (!response.data || response.data.size === 0 || !isPdf) {
      console.error(
        "Received empty or non-PDF response. Type:",
        contentType,
        "Size:",
        response.data?.size
      );
      throw new Error(
        `Failed to fetch PDF: Invalid file received (Type: ${contentType}, Size: ${
          response.data?.size ?? 0
        })`
      );
    }

    console.log(
      "Successfully fetched PDF Blob. Size:",
      response.data.size,
      "Type:",
      response.data.type
    );
    return response.data;
  } catch (error) {
    console.error("API Error (fetchResumePdfBlob):", error);
    if (isApiError(error)) {
      if (error.response?.status === 404) {
        throw new Error("PDF not found for this resume (404).");
      }
      const status = error.response?.status || "N/A";
      throw new Error(
        `Failed to fetch PDF (Status: ${status}). ${error.message}`
      );
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unknown error occurred while fetching the PDF.");
    }
  }
};

export const downloadResumePdf = async (
  userId: number,
  resumeId: number,
  filename: string = "resume.pdf"
): Promise<void> => {
  try {
    const blob = await fetchResumePdfBlob(userId, resumeId);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("API Error (downloadResumePdf):", error);
    throw error;
  }
};

export const updateUserSettings = async (
  userId: number,
  settingsData: UpdateUserPayload
): Promise<User> => {
  const actualEndpoint = `/user/${userId}`;

  try {
    const response = await apiClient.patch<ApiResponse<{ user: User }>>(
      actualEndpoint,
      settingsData
    );

    console.log("API Response in updateUserSettings:", response.data);

    if (response.data.status === "success" && response.data.data?.user) {
      const updatedUser = response.data.data.user;

      if (
        typeof updatedUser === "object" &&
        updatedUser !== null &&
        "id" in updatedUser
      ) {
        return updatedUser;
      } else {
        console.warn(
          "updateUserSettings: API status success, but user data missing or malformed in response.data.data.user:",
          response.data.data
        );
        throw new Error(
          "Failed to update settings: Unexpected response data structure after success."
        );
      }
    }

    console.warn(
      "updateUserSettings: API call did not report success or data format unexpected:",
      response.data
    );
    throw new Error(
      response.data.message ||
        "Failed to update settings: Server reported an issue or response was unexpected."
    );
  } catch (error) {
    console.error("API Error (updateUserSettings):", error);

    if (isApiError(error) && error.response?.status === 422) {
      throw new Error("Error updating settings ");
    }

    if (isApiError(error) && error.response) {
      throw new Error("An unknown error occurred.");
    } else if (error instanceof Error) {
      throw new Error(
        error.message || "An unknown error occurred while updating settings."
      );
    } else {
      throw new Error("An unknown error occurred while updating settings.");
    }
  }
};

// --- Utility ---
export { getUserId, isApiError };