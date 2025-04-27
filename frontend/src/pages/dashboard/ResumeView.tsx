// src/pages/dashboard/ResumeView.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchSingleResume,
  fetchResumePdfBlob,
  downloadResumePdf,
  getUserId,
} from "../../services/api";
import { GeneratedResume } from "../../types/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const ResumeView: React.FC = () => {
  const { resumeId } = useParams<{ resumeId: string }>();

  const [resumeInfo, setResumeInfo] = useState<GeneratedResume | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = getUserId();
    const id = resumeId ? parseInt(resumeId, 10) : null;

    if (!userId || !id || isNaN(id)) {
      const errorMsg = "Invalid user or resume ID.";
      setInfoError(errorMsg);
      setPdfError(errorMsg);
      setLoadingInfo(false);
      setLoadingPdf(false);
      return;
    }

    let isMounted = true;

    setResumeInfo(null);
    setPdfUrl(null);
    setInfoError(null);
    setPdfError(null);
    setLoadingInfo(true);
    setLoadingPdf(true);
    setDownloadError(null); // Reset download error on new load

    // --- Fetch Metadata ---
    const loadInfo = async () => {
      try {
        const data = await fetchSingleResume(userId, id);
        if (isMounted) setResumeInfo(data);
      } catch (err) {
        console.error("Error loading resume info:", err);
        if (isMounted)
          setInfoError(
            err instanceof Error
              ? err.message
              : "Failed to load resume details."
          );
      } finally {
        if (isMounted) setLoadingInfo(false);
      }
    };

    // --- Fetch PDF Blob ---
    const loadPdf = async () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      try {
        const blob = await fetchResumePdfBlob(userId, id);
        const url = URL.createObjectURL(blob);
        if (isMounted) {
          setPdfUrl(url);
          blobUrlRef.current = url;
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error("Error loading PDF blob:", err);
        if (isMounted)
          setPdfError(
            err instanceof Error ? err.message : "Failed to load PDF view."
          );
      } finally {
        if (isMounted) setLoadingPdf(false);
      }
    };

    loadInfo();
    loadPdf();

    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [resumeId]);

  const handleDownload = async () => {
    const userId = getUserId();
    const id = resumeId ? parseInt(resumeId, 10) : null;
    const name = resumeInfo?.name;
    const jobTitle = resumeInfo?.job_title;

    if (!userId || !id) {
      setDownloadError("Cannot download: Invalid ID.");
      return;
    }
    setDownloading(true);
    setDownloadError(null);
    try {
      const safeName =
        name?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "resume";
      const safeJobTitle =
        jobTitle?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "details";
      const filename = `${safeName}_${safeJobTitle}_${id}.pdf`;
      await downloadResumePdf(userId, id, filename);
    } catch (err) {
      console.error("Download error:", err);
      setDownloadError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const actualResumeId = resumeInfo?.id ?? resumeInfo?.resume_id; // Get the ID regardless of name

  return (
    <div className="h-[80vh]  flex flex-col md:h-[1400px]  bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 md:p-8 overflow-hidden">
      {" "}
      {/* Use full height of parent */}
      {/* Header Section */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row flex-wrap gap-y-2 gap-x-4 justify-between items-start sm:items-center flex-shrink-0">
        <div className="flex-grow min-w-0">
          {" "}
          {/* Allow text wrap/truncate */}
          <Link
            to="../" // Go up one level (to resume list)
            relative="path"
            className="inline-flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light mb-1"
          >
            <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Back to
            Resumes
          </Link>
          {loadingInfo && !resumeInfo && (
            <>
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1 mb-1"></div>
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1 mb-1"></div>
            </>
          )}
          {!loadingInfo && infoError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Error loading details: {infoError}
            </p>
          )}
          {resumeInfo && (
            <>
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white break-words"
                title={resumeInfo.name}
              >
                {resumeInfo.name || "Untitled Resume"}
              </h1>
              <p
                className="text-sm sm:text-md text-gray-500 dark:text-gray-400 break-words"
                title={resumeInfo.job_title}
              >
                {resumeInfo.job_title || "No job title specified"}
              </p>
              {actualResumeId && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ID: {actualResumeId} | Created:{" "}
                  {new Date(resumeInfo.created_at).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || !resumeInfo || !!pdfError || loadingPdf}
          title={
            pdfError ? "Cannot download: PDF failed to load" : "Download as PDF"
          }
          className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            downloading || !resumeInfo || !!pdfError || loadingPdf
              ? "bg-gray-400 cursor-not-allowed opacity-60"
              : "bg-primary hover:bg-primary-dark focus:ring-primary-dark"
          }`}
        >
          {downloading ? (
            <LoadingSpinner
              size="small"
              color="white"
              className="mr-1 sm:mr-2"
            />
          ) : (
            <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          )}
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
      </div>
      {/* Display Download Error if any */}
      {downloadError && (
        <div className="mb-4 text-xs sm:text-sm text-red-700 dark:text-red-300 p-2 sm:p-3 bg-red-100 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-600 flex-shrink-0">
          <p>
            <strong className="font-medium">Download Error:</strong>{" "}
            {downloadError}
          </p>
        </div>
      )}
      {/* PDF Viewer Area */}
      {/* flex-grow ensures it takes remaining space, min-h-0 allows shrinking */}
      <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 min-h-0 relative">
        {loadingPdf && (
          <div className="absolute inset-0 flex justify-center items-center bg-white/50 dark:bg-gray-800/50 z-10">
            <LoadingSpinner />
          </div>
        )}
        {!loadingPdf && pdfError && (
          <div className="text-center p-4 sm:p-6 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" />
            <p className="font-semibold text-sm sm:text-base">
              Failed to load PDF Preview
            </p>
            <p className="text-xs sm:text-sm">{pdfError}</p>
            <p className="text-xs mt-2">
              You can still try to download the PDF using the button above.
            </p>
          </div>
        )}
        {!loadingPdf && !pdfError && pdfUrl && (
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            title={`Resume Preview ${resumeId}`}
            className="border-none w-full h-full" // Ensure it fills container
          />
        )}
        {!loadingPdf &&
          !pdfError &&
          !pdfUrl &&
          !loadingInfo && ( // Show only if not loading pdf or info, and no errors
            <div className="text-center p-4 sm:p-6 text-gray-500 dark:text-gray-400">
              <p>PDF preview is unavailable.</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default ResumeView;
