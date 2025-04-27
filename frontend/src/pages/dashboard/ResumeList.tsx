// src/pages/dashboard/ResumeList.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchGeneratedResumes,
  downloadResumePdf,
  getUserId,
} from "../../services/api";
import { GeneratedResume } from "../../types/api";
import { EyeIcon, ArrowDownTrayIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ResumeList: React.FC = () => {
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [downloading, setDownloading] = useState<number | null>(null);

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
        // Sort resumes by creation date, newest first
        const sortedData = data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setResumes(sortedData);
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
    const resumeId = resume.id ?? resume.resume_id;
    if (!userId || !resumeId) {
      setError("Cannot download resume: Missing user or resume ID.");
      return;
    }
    setDownloading(resumeId);
    setError("");
    try {
      const safeName =
        resume.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "resume";
      const safeJobTitle =
        resume.job_title.replace(/[^a-z0-9]/gi, "_").toLowerCase() ||
        "generated";
      const filename = `${safeName}_${safeJobTitle}_${resumeId}.pdf`;
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
      <div className="flex justify-center items-center h-40">
        {" "}
        {/* Adjusted height */}
        <LoadingSpinner />
      </div>
    );
  if (error)
    return (
      <div className="text-red-600 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-600">
        {error}
      </div>
    );

  return (
    <div>
      {" "}
      {/* Removed outer padding */}
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6">
        Generated Resumes
      </h1>
      {resumes.length === 0 ? (
        <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <DocumentDuplicateIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No resumes generated yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Go to the{" "}
            <Link
              to="../generate"
              className="text-primary hover:underline font-medium"
            >
              Generate New
            </Link>{" "}
            page to create your first tailored resume.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-md">
          <ul
            role="list"
            className="divide-y divide-gray-200 dark:divide-gray-700"
          >
            {resumes.map((resume) => {
              const resumeId = resume.id ?? resume.resume_id;
              return (
                <li
                  key={resumeId}
                  className="px-4 py-3 sm:px-6 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2 gap-x-4">
                    <div className="flex-grow min-w-0">
                      {" "}
                      {/* Allow text to truncate */}
                      <p
                        className="text-sm font-medium text-primary dark:text-primary-light truncate"
                        title={resume.name}
                      >
                        {resume.name}
                      </p>
                      <p
                        className="text-sm text-gray-500 dark:text-gray-400 truncate"
                        title={resume.job_title}
                      >
                        {resume.job_title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Generated:{" "}
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
                      {resumeId && (
                        <Link
                          to={`${resumeId}`} // Relative link
                          className="p-1.5 sm:p-2 text-gray-500 hover:text-primary dark:hover:text-primary-light rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="sr-only">View</span>
                        </Link>
                      )}
                      {resumeId && (
                        <button
                          onClick={() => handleDownload(resume)}
                          disabled={downloading === resumeId}
                          className={`p-1.5 sm:p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            downloading === resumeId
                              ? "cursor-wait opacity-50"
                              : ""
                          }`}
                          title="Download PDF"
                        >
                          {downloading === resumeId ? (
                            <LoadingSpinner
                              size="small"
                              className="h-4 w-4 sm:h-5 sm:w-5"
                            />
                          ) : (
                            <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                          <span className="sr-only">Download</span>
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
