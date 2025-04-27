import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProfiles,
  generateNewResume,
  getUserId,
} from "../../services/api"; // Adjust path
import { ProfileModel, NewResumePayload } from "../../types/api"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

const GenerateResume: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileModel[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(""); // Use string for select value
  const [jobTitle, setJobTitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [resumeName, setResumeName] = useState<string>(""); // Name for the generated resume
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const userId = getUserId();

  useEffect(() => {
    const loadProfiles = async () => {
      if (!userId) {
        setError("User not identified. Please log in.");
        setLoadingProfiles(false);
        return;
      }
      try {
        setLoadingProfiles(true);
        setError("");
        const data = await fetchProfiles(userId);
        setProfiles(data);
        if (data.length > 0 && data[0].id) {
          setSelectedProfileId(String(data[0].id)); // Default to first profile's ID
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profiles."
        );
        console.error(err);
      } finally {
        setLoadingProfiles(false);
      }
    };
    loadProfiles();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (
      !userId ||
      !selectedProfileId ||
      !jobTitle.trim() ||
      !jobDescription.trim() ||
      !resumeName.trim()
    ) {
      setError(
        "Please select a profile and fill in all required fields (Resume Name, Job Title, Job Description)."
      );
      return;
    }

    const profileIdNum = parseInt(selectedProfileId, 10);
    if (isNaN(profileIdNum)) {
      setError("Invalid profile selected.");
      return;
    }

    // Construct payload based on NewResumePayload type and API spec
    // Assuming 'user_resume_id' in the OpenAPI spec refers to the base 'profile_id'
    const payload: NewResumePayload = {
      user_id: userId,
      user_resume_id: profileIdNum, // Using the selected profile ID here
      name: resumeName.trim(),
      job_title: jobTitle.trim(),
      job_description: jobDescription.trim(),
      created_at: new Date().toISOString(), // Assuming the backend requires this field
      // created_at is added by the service function
    };

    setIsGenerating(true);
    try {
      const generatedResume = await generateNewResume(userId, payload);
      // Navigate to the view page of the newly generated resume
      const newResumeId = generatedResume.id ?? generatedResume.resume_id;
      if (newResumeId) {
        navigate(`/dashboard/resumes/${newResumeId}`);
      } else {
        // Fallback: Navigate to the list if ID isn't returned as expected
        console.warn(
          "Generated resume ID not found in response, navigating to list."
        );
        navigate("/dashboard/resumes");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate resume."
      );
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Generate New Resume
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Selection */}
          <div>
            <label
              htmlFor="profile"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Base Profile *
            </label>
            {loadingProfiles ? (
              <LoadingSpinner size="small" />
            ) : profiles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No profiles found. Please{" "}
                <a
                  href="/dashboard/profiles"
                  className="text-primary hover:underline"
                >
                  create a profile
                </a>{" "}
                first.
              </p>
            ) : (
              <select
                id="profile"
                name="profile"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isGenerating}
              >
                <option value="" disabled>
                  -- Select a Profile --
                </option>
                {profiles.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.profile_name} ({p.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Resume Name */}
          <div>
            <label
              htmlFor="resumeName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Resume Name *
            </label>
            <input
              type="text"
              id="resumeName"
              name="resumeName"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Application for Google SWE"
              disabled={isGenerating}
            />
          </div>

          {/* Job Title */}
          <div>
            <label
              htmlFor="jobTitle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Job Title *
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Senior Software Engineer"
              disabled={isGenerating}
            />
          </div>

          {/* Job Description */}
          <div>
            <label
              htmlFor="jobDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Job Description (Paste Here) *
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Paste the full job description text here..."
              disabled={isGenerating}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={
                isGenerating || loadingProfiles || profiles.length === 0
              }
              className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                isGenerating || loadingProfiles || profiles.length === 0
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition duration-150`}
            >
              {isGenerating ? (
                <LoadingSpinner size="small" color="white" className="mr-3" />
              ) : null}
              {isGenerating ? "Generating..." : "Generate Resume"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateResume;
