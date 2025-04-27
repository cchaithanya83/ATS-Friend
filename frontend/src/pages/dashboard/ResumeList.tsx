// src/pages/dashboard/ResumeList.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchGeneratedResumes,
  downloadResumePdf,
  getUserId,
} from "../../services/api"; // Adjust path
import { GeneratedResume } from "../../types/api"; // Adjust path
import { EyeIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Create a reusable spinner

const ResumeList: React.FC = () => {
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [downloading, setDownloading] = useState<number | null>(null); // Track which resume is downloading

  useEffect(() => {
    const loadResumes = async () => {
      const userId = getUserId();
      if (!userId) {
        setError("User not found. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const data = await fetchGeneratedResumes(userId);
        setResumes(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load resumes."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadResumes();
  }, []);

  const handleDownload = async (resume: GeneratedResume) => {
    const userId = getUserId();
    // Ensure resume_id exists (using optional chaining and nullish coalescing)
    const resumeId = resume.id ?? resume.resume_id;
    if (!userId || !resumeId) {
      setError("Cannot download resume: Missing user or resume ID.");
      return;
    }
    setDownloading(resumeId);
    setError("");
    try {
      // Generate a filename, e.g., "CompanyName - JobTitle - Resume.pdf"
      const filename = `${resume.name.replace(
        / /g,
        "_"
      )}_${resume.job_title.replace(/ /g, "_")}_Resume.pdf`;
      await downloadResumePdf(userId, resumeId, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  if (error)
    return (
      <div className="text-red-600 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900 rounded">
        {error}
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Generated Resumes
      </h1>
      {resumes.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          You haven't generated any resumes yet.{" "}
          <Link to="../generate" className="text-primary hover:underline">
            Generate one now!
          </Link>
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul
            role="list"
            className="divide-y divide-gray-200 dark:divide-gray-700"
          >
            {resumes.map((resume) => {
              const resumeId = resume.id ?? resume.resume_id; // Get the ID safely
              return (
                <li
                  key={resumeId}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <p className="text-sm font-medium text-primary dark:text-primary-light truncate">
                        {resume.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {resume.job_title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Generated:{" "}
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      {resumeId && ( // Only show links if ID exists
                        <Link
                          to={`/dashboard/resumes/${resumeId}`} // Link to the view page
                          className="p-2 text-gray-500 hover:text-primary dark:hover:text-primary-light rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      )}
                      {resumeId && (
                        <button
                          onClick={() => handleDownload(resume)}
                          disabled={downloading === resumeId}
                          className={`p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            downloading === resumeId
                              ? "cursor-wait opacity-50"
                              : ""
                          }`}
                          title="Download PDF"
                        >
                          {downloading === resumeId ? (
                            <LoadingSpinner size="small" />
                          ) : (
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeList;
