// src/pages/dashboard/ResumeView.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchSingleResume, // To get metadata like name/title
  fetchResumePdfBlob, // To get the PDF data as Blob
  downloadResumePdf, // For the separate download button
  getUserId,
} from "../../services/api"; // Adjust path
import { GeneratedResume } from "../../types/api"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const ResumeView: React.FC = () => {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();

  // State for metadata
  const [resumeInfo, setResumeInfo] = useState<GeneratedResume | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  // State for PDF view (using Blob URL)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // State for download button
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Ref to store the blob URL for cleanup
  const blobUrlRef = useRef<string | null>(null);

  // --- Fetch Data Effect ---
  useEffect(() => {
    const userId = getUserId();
    const id = resumeId ? parseInt(resumeId, 10) : null;

    if (!userId || !id || isNaN(id)) {
      setInfoError("Invalid user or resume ID.");
      setPdfError("Invalid user or resume ID.");
      setLoadingInfo(false);
      setLoadingPdf(false);
      return;
    }

    let isMounted = true; // Flag to prevent state updates on unmounted component

    // Reset state when ID changes
    setResumeInfo(null);
    setPdfUrl(null);
    setInfoError(null);
    setPdfError(null);
    setLoadingInfo(true);
    setLoadingPdf(true);

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
      // Clean up previous blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      try {
        const blob = await fetchResumePdfBlob(userId, id);
        const url = URL.createObjectURL(blob);
        if (isMounted) {
          setPdfUrl(url);
          blobUrlRef.current = url; // Store for cleanup
        } else {
          URL.revokeObjectURL(url); // Cleanup if unmounted quickly
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

    // --- Cleanup ---
    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [resumeId]); // Rerun only if resumeId changes

  // --- Download Handler ---
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

  // --- Combined Loading State ---
  const isLoading = loadingInfo || loadingPdf;

  // --- Render Logic ---
  return (
    // Use flex-col and h-full on the main container if it's inside another flex/grid container
    // that provides height, otherwise the flex-grow below might not work as expected.
    <div className="p-4 md:p-6 h-full flex flex-col">
      {/* Header Section (Shrinks to content size) */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center flex-shrink-0">
        {/* ... (Header content: Back link, Title, Subtitle, Download Button - same as before) ... */}
        <div>
          <Link
            to="/dashboard/resumes"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light mb-1"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Resumes
          </Link>
          {loadingInfo && !resumeInfo && (
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1 mb-1"></div>
          )}
          {!loadingInfo && infoError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Error loading details: {infoError}
            </p>
          )}
          {resumeInfo && (
            <>
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white break-words">
                {resumeInfo.name || "Untitled Resume"}
              </h1>
              <p className="text-md text-gray-500 dark:text-gray-400 break-words">
                {resumeInfo.job_title || "No job title specified"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ID: {resumeInfo.resume_id} | Created:{" "}
                {new Date(resumeInfo.created_at).toLocaleString()}
              </p>
            </>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || !resumeInfo || !!pdfError}
          title={
            pdfError ? "Cannot download: PDF failed to load" : "Download as PDF"
          }
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
            downloading || !resumeInfo || !!pdfError
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark focus:ring-primary-dark"
          }`}
        >
          {downloading ? (
            <LoadingSpinner size="small" color="white" className="mr-2" />
          ) : (
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          )}
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
      </div>
      {/* Display Download Error if any (Shrinks to content size) */}
      {downloadError && (
        <div className="mb-4 text-sm text-red-700 dark:text-red-300 p-3 bg-red-100 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-600 flex-shrink-0">
          <p>
            <strong className="font-medium">Download Error:</strong>{" "}
            {downloadError}
          </p>
        </div>
      )}
      {/* PDF Viewer Area (Takes remaining space) */}
      {/*
         Using flex-grow to make this div take up the remaining vertical space.
         Added min-h-[calc(100vh-250px)] as an example minimum height.
         Adjust the 250px based on the approximate height of your header, navbars, footers etc.
         Alternatively, use a fixed height like min-h-[700px] or h-[80vh].
      */}
      <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 min-h-[calc(100vh-250px)] md:min-h-[700px]">
        {" "}
        {/* Adjusted Height */}
        {loadingPdf && (
          // Make loader fill the container
          <div className="w-full h-full flex justify-center items-center">
            <LoadingSpinner text="Loading PDF Preview..." />
          </div>
        )}
        {!loadingPdf && pdfError && (
          <div className="text-center p-6 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="font-semibold">Failed to load PDF Preview</p>
            <p className="text-sm">{pdfError}</p>
            <p className="text-xs mt-2">
              You can still try to download the PDF.
            </p>
          </div>
        )}
        {!loadingPdf && !pdfError && pdfUrl && (
          // Iframe fills its container (which now has a min-height)
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            title={`Resume Preview ${resumeId}`}
            className="border-none" // Remove default iframe border
          />
        )}
        {!loadingPdf && !pdfError && !pdfUrl && (
          // Error message if URL is missing after loading finishes without error
          <div className="text-center p-6 text-gray-500 dark:text-gray-400">
            <p>PDF preview is unavailable.</p>
          </div>
        )}
      </div>{" "}
      {/* End PDF Viewer Area */}
    </div> // End Main Container
  );
};

export default ResumeView;
