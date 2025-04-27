// src/pages/dashboard/GenerateResume.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProfiles,
  generateNewResume,
  getUserId,
} from "../../services/api";
import { ProfileModel, NewResumePayload } from "../../types/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const GenerateResume: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileModel[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [resumeName, setResumeName] = useState<string>("");
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
          setSelectedProfileId(String(data[0].id));
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

    const payload: NewResumePayload = {
      user_id: userId,
      user_resume_id: profileIdNum,
      name: resumeName.trim(),
      job_title: jobTitle.trim(),
      job_description: jobDescription.trim(),
      created_at: new Date().toISOString(), // Let service/API handle this ideally
    };

    setIsGenerating(true);
    try {
      const generatedResume = await generateNewResume(userId, payload);
      const newResumeId = generatedResume.resume_id;
      if (newResumeId) {
        navigate(`/dashboard/resumes/${newResumeId}`);
      } else {
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

  const inputBaseClass =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";
  const labelBaseClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="max-w-4xl mx-auto">
      {" "}
      {/* Limit width for better readability */}
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6">
        Generate New Resume
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="profile" className={labelBaseClass}>
              Base Profile *
            </label>
            {loadingProfiles ? (
              <div className="mt-1">
                <LoadingSpinner size="small" />
              </div>
            ) : profiles.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                className={`${inputBaseClass} pr-10 py-2 text-base`} // Adjusted padding for select
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

          <div>
            <label htmlFor="resumeName" className={labelBaseClass}>
              Resume Name *
            </label>
            <input
              type="text"
              id="resumeName"
              name="resumeName"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              required
              className={inputBaseClass}
              placeholder="e.g., Application for Google SWE"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label htmlFor="jobTitle" className={labelBaseClass}>
              Job Title *
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
              className={inputBaseClass}
              placeholder="e.g., Senior Software Engineer"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label htmlFor="jobDescription" className={labelBaseClass}>
              Job Description (Paste Here) *
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              rows={10} // Adjust rows as needed
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              className={inputBaseClass}
              placeholder="Paste the full job description text here..."
              disabled={isGenerating}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={
                isGenerating || loadingProfiles || profiles.length === 0
              }
              className={`inline-flex items-center justify-center px-5 py-2 sm:px-6 sm:py-2.5 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white ${
                isGenerating || loadingProfiles || profiles.length === 0
                  ? "bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary dark:focus:ring-offset-gray-800"
              } transition duration-150 ease-in-out`}
            >
              {isGenerating ? (
                <LoadingSpinner
                  size="small"
                  color="white"
                  className="mr-2 sm:mr-3"
                />
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
