// src/services/api.ts
import axios, { AxiosError, AxiosResponse } from "axios";
import {
  ApiResponse,
  ProfileModel,
  GeneratedResume,
  NewResumePayload,
  UpdateUserPayload,
  User,
  HttpValidationError,
  // Import other needed types
} from "../types/api"; // Adjust path as needed

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

// Handles { data: { profiles: [] } }
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
      // Ensure created_at is consistently a string
      return response.data.data.profiles.map((p) => ({
        ...p,
        created_at: String(p.created_at),
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

// Sends created_at; Handles { data: { new_profile_id: ..., user: {...} } }
export const createProfile = async (
  profileData: Omit<ProfileModel, "id" | "created_at">
): Promise<ProfileModel> => {
  const payload = {
    ...profileData,
    created_at: new Date().toISOString(), // Add frontend timestamp
  };

  try {
    interface CreateProfileApiResponseData {
      new_profile_id: number;
      user: {
        // Structure matching your API response
        profile_name: string;
        user_id: number;
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
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
        education: profileDetailsFromApi.education,
        experience: profileDetailsFromApi.experience,
        skills: profileDetailsFromApi.skills,
        certifications: profileDetailsFromApi.certifications,
        projects: profileDetailsFromApi.projects,
        languages: profileDetailsFromApi.languages,
        hobbies: profileDetailsFromApi.hobbies,
        created_at: String(profileDetailsFromApi.created_at), // Use response's created_at
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

// Handles { data: { resumes: [] } }
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
        resume_id: r.id ?? r.resume_id, // Use 'id' from backend if present
        created_at: String(r.created_at), // Ensure created_at is string
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

// Handles { data: { resume: {...} } }
export const fetchSingleResume = async (
  userId: number,
  resumeId: number
): Promise<GeneratedResume> => {
  try {
    // Define expected nested structure
    interface FetchSingleResumeData {
      resume: GeneratedResume; // Expect resume object nested under 'resume' key
    }
    type FetchSingleResumeApiResponse = ApiResponse<FetchSingleResumeData>;

    const response = await apiClient.get<FetchSingleResumeApiResponse>(
      `/profile/${userId}/new_resume/${resumeId}`
    );
    console.log("API Response in fetchSingleResume:", response.data);

    // Check the nested structure
    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data === "object" &&
      typeof response.data.data.resume === "object" && // Check for nested 'resume' object
      response.data.data.resume !== null &&
      "name" in response.data.data.resume // Check for a mandatory field within 'resume'
    ) {
      // Extract the resume data from the nested 'resume' key
      const resumeData = response.data.data.resume;
      return {
        ...resumeData,
        resume_id: resumeData.id ?? resumeData.resume_id, // Standardize ID
        created_at: String(resumeData.created_at), // Ensure created_at is string
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
    // Extract detail message if available
    if (isApiError(error) && error.response?.data) {
      throw new Error("Error fetching resume details ");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while fetching resume details.");
  }
};

/*
 ****************************************************************************
 * VERIFY RESPONSE STRUCTURE for generateNewResume and updateUserSettings *
 ****************************************************************************
 * The functions below currently assume the relevant data (GeneratedResume / User)
 * is directly within response.data.data.
 *
 * If your API returns these nested under a key like 'resume' or 'user'
 * (similar to fetchSingleResume or createProfile), you MUST update these
 * functions using the same pattern:
 *   1. Define the specific nested structure interface (e.g., { new_resume_id: ..., resume: {...} }).
 *   2. Update the apiClient call's generic type (e.g., ApiResponse<SpecificInterface>).
 *   3. Adjust the success check and data extraction logic to access the nested data.
 ****************************************************************************
 */

// Assuming response data is directly in 'data' - VERIFY THIS!
export const generateNewResume = async (
  userId: number,
  payload: NewResumePayload
): Promise<{
  resume_id: number;
}> => {
  // Return an object containing just the ID
  console.warn(
    "generateNewResume: API POSTs data. Expecting { data: { resume_id: number, message: string } } in response."
  );
  // Remove frontend created_at if backend handles it or doesn't need it sent
  // Keep it if your backend explicitly requires it in the POST payload
  const fullPayload = { ...payload };
  // Example: If backend handles created_at:
  // const { created_at, ...payloadWithoutDate } = payload;
  // const fullPayload = payloadWithoutDate;

  try {
    // Define the *actual* structure of the 'data' field in the success response
    interface GenerateResumeResponseData {
      resume_id: number;
      message: string;
    }
    // Use the specific response type structure
    type GenerateResumeApiResponse = ApiResponse<GenerateResumeResponseData>;

    const response = await apiClient.post<GenerateResumeApiResponse>(
      `/profile/${userId}/new_resume`,
      fullPayload
    );
    console.log("API Response in generateNewResume:", response.data);

    // Check the specific structure we now expect
    if (
      response.data.status === "success" &&
      response.data.data &&
      typeof response.data.data.resume_id === "number" // Check if resume_id is a number
    ) {
      // Return the object containing the new resume ID
      return { resume_id: response.data.data.resume_id };
    }

    // Handle cases where status might be success but data structure is wrong
    console.warn(
      "generateNewResume: API call successful but response format unexpected:",
      response.data
    );
    // Use the message from the API response if available, otherwise throw generic error
    throw new Error(
      response.data.message ||
        response.data.data?.message ||
        "Failed to generate resume: Unexpected response structure"
    );
  } catch (error) {
    console.error("API Error (generateNewResume):", error);
    if (isApiError(error)) {
      // Check if it's an Axios error first
      if (error.response?.status === 422) {
        throw new Error(
          "Validation Failed: Please check resume details and JD."
        );
      }
      // Throw other Axios error details if possible
      const responseMessage =
        (error.response?.data as ApiResponse<any>)?.message ||
        (error.response?.data as any)?.detail;
      if (responseMessage) {
        throw new Error(String(responseMessage));
      }
    }
    // Fallback error handling
    if (error instanceof Error) {
      throw error; // Re-throw known errors
    } else {
      throw new Error("An unknown error occurred during resume generation.");
    }
  }
};
export const fetchResumePdfBlob = async (
  userId: number,
  resumeId: number
): Promise<Blob> => {
  console.log(`Fetching PDF Blob for user ${userId}, resume ${resumeId}`); // Debug log
  try {
    const response: AxiosResponse<Blob> = await apiClient.get(
      `/profile/${userId}/new_resume/${resumeId}/pdf`,
      {
        responseType: "blob", // Crucial
      }
    );

    const contentType = response.headers["content-type"];

    // Handle potential error response returned as JSON instead of blob
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

    // Handle cases where the response might be empty or not a PDF
    // Allow common PDF types just in case Content-Type isn't exactly 'application/pdf'
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
    ); // Debug log
    return response.data; // Return the Blob directly
  } catch (error) {
    console.error("API Error (fetchResumePdfBlob):", error);
    // Check if it's an Axios error and potentially extract details
    if (isApiError(error)) {
      if (error.response?.status === 404) {
        throw new Error("PDF not found for this resume (404).");
      }
      // If the response was JSON and parsed above, that error will be thrown.
      // Otherwise, throw a generic error based on status or message.
      const status = error.response?.status || "N/A";
      throw new Error(
        `Failed to fetch PDF (Status: ${status}). ${error.message}`
      );
    } else if (error instanceof Error) {
      // Re-throw specific errors caught above or generic ones
      throw error;
    } else {
      throw new Error("An unknown error occurred while fetching the PDF.");
    }
  }
};

// downloadResumePdf still uses the same endpoint but triggers download
export const downloadResumePdf = async (
  userId: number,
  resumeId: number,
  filename: string = "resume.pdf"
): Promise<void> => {
  try {
    // We can reuse the blob fetching logic
    const blob = await fetchResumePdfBlob(userId, resumeId);

    // Create link and trigger download
    const url = window.URL.createObjectURL(blob); // Use the fetched blob
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    // The error from fetchResumePdfBlob will propagate here
    console.error("API Error (downloadResumePdf):", error);
    // Throw the specific error message we got from fetchResumePdfBlob
    throw error;
  }
};

export const updateUserSettings = async (
  userId: number,
  settingsData: UpdateUserPayload
): Promise<User> => {
  // Construct the correct endpoint including the user ID
  const actualEndpoint = `/user/${userId}`;

  try {
    // Make the PATCH request. Expect ApiResponse where 'data' contains { user: User }
    const response = await apiClient.patch<ApiResponse<{ user: User }>>(
      actualEndpoint,
      settingsData
    );

    console.log("API Response in updateUserSettings:", response.data);

    // Check for success status and the nested user data
    if (response.data.status === "success" && response.data.data?.user) {
      // Optional chaining (?.) handles if response.data.data is null/undefined
      const updatedUser = response.data.data.user;

      // Basic validation to ensure it looks like a user object before returning
      if (
        typeof updatedUser === "object" &&
        updatedUser !== null &&
        "id" in updatedUser
      ) {
        return updatedUser;
      } else {
        // This case should ideally not happen if the API behaves correctly
        console.warn(
          "updateUserSettings: API status success, but user data missing or malformed in response.data.data.user:",
          response.data.data
        );
        throw new Error(
          "Failed to update settings: Unexpected response data structure after success."
        );
      }
    }

    // If status is not 'success' or data/user is missing, throw an error
    // Use the message from the API response if available
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

    // Keep the existing validation error handling (good for FastAPI's 422 responses)
    if (isApiError(error) && error.response?.status === 422) {
      throw new Error("Error updating settings ");
    }

    // Re-throw other errors (network issues, 500 errors, etc.)
    // Or handle them more specifically if needed
    // You might want to extract a generic error message from the caught error
    if (isApiError(error) && error.response) {
      // Use detail message from FastAPI for non-422 errors if available
      throw new Error("An unknown error occurred.");
    } else if (error instanceof Error) {
      // Use the error message property
      throw new Error(
        error.message || "An unknown error occurred while updating settings."
      );
    } else {
      // Fallback for non-standard errors
      throw new Error("An unknown error occurred while updating settings.");
    }
  }
};
// --- Utility ---
export { getUserId, isApiError };
