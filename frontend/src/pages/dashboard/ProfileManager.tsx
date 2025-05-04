import React, { useState, useEffect, useCallback } from "react";
import {
  fetchProfiles,
  createProfile,
  getUserId,
  uploadResumePDF,
} from "../../services/api";
import { ProfileModel } from "../../types/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  PlusCircleIcon,
  UserCircleIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";

interface ProfileFormData {
  profile_name: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  links?: string | null;
  education?: string | null;
  experience?: string | null;
  skills?: string | null;
  certifications?: string | null;
  projects?: string | null;
  languages?: string | null;
}

const ProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  const initialFormData: ProfileFormData = {
    profile_name: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    links: "",
    education: "",
    experience: "",
    skills: "",
    certifications: "",
    projects: "",
    languages: "",
  };
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const userId = getUserId();

  const loadProfiles = useCallback(async () => {
    if (!userId) {
      setError("User not found. Please log in again.");
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await fetchProfiles(userId);
      setProfiles(data);
    } catch (err) {
      console.error("Error in loadProfiles callback:", err);
      setError(err instanceof Error ? err.message : "Failed to load profiles.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setUploadError("Please upload a PDF file.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setUploadError("");
    } else {
      setFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }
    setIsUploading(true);
    setUploadError("");
    try {
      const resumeData = await uploadResumePDF(file);
      const formattedData: ProfileFormData = {
        profile_name: "Resume Profile",
        name: resumeData.name || "",
        email: resumeData.email || "",
        phone: resumeData.phone || "",
        address: resumeData.address || "",
        links: resumeData.links ? resumeData.links.join(", ") : "",
        education: resumeData.education
          ? resumeData.education
              .map(
                (edu: any) =>
                  `${edu.degree}, ${edu.university}, ${edu.year || ""}`
              )
              .join("\n")
          : "",
        experience: resumeData.experience
          ? resumeData.experience
              .map(
                (exp: any) =>
                  `${exp.role}, ${exp.company}, ${exp.description}, ${
                    exp.years || ""
                  }`
              )
              .join("\n")
          : "",
        skills: resumeData.skills ? resumeData.skills.join(", ") : "",
        certifications: resumeData.certifications
          ? resumeData.certifications
              .map((cert: any) => `${cert.name}, ${cert.issuer || ""}`)
              .join("\n")
          : "",
        projects: resumeData.projects
          ? resumeData.projects
              .map(
                (proj: any) =>
                  `${proj.name}: ${proj.description || ""} (${proj.year || ""})`
              )
              .join("\n")
          : "",
        languages: resumeData.languages ? resumeData.languages.join(", ") : "",
      };

      setFormData(formattedData);
      setShowAddForm(true);
      setFile(null);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload and parse resume."
      );
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProfileSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!userId) {
      setFormError("Cannot create profile: User not logged in.");
      return;
    }
    if (
      !formData.profile_name.trim() ||
      !formData.name.trim() ||
      !formData.email.trim()
    ) {
      setFormError("Profile Nickname, Your Name, and Email are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const profilePayload = Object.entries(formData).reduce(
      (acc, [key, value]) => {
        const trimmedValue = typeof value === "string" ? value.trim() : value;
        if (
          [
            "phone",
            "address",
            "links",
            "education",
            "experience",
            "skills",
            "certifications",
            "projects",
            "languages",
          ].includes(key)
        ) {
          acc[key as keyof ProfileFormData] =
            trimmedValue === "" ? null : trimmedValue;
        } else {
          acc[key as keyof ProfileFormData] = trimmedValue;
        }
        return acc;
      },
      {} as ProfileFormData
    );

    const finalPayload: Omit<ProfileModel, "id" | "created_at"> = {
      ...profilePayload,
      user_id: userId,
    };

    try {
      const newProfile = await createProfile(finalPayload);
      setProfiles((prev) => [newProfile, ...prev]);
      setShowAddForm(false);
      setFormData(initialFormData);
      setFile(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create profile."
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClasses = (isTextarea: boolean = false): string => {
    return `block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 ${
      isTextarea ? "min-h-[80px]" : ""
    }`;
  };

  const labelBaseClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
          Your Profiles
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={!userId}
          title={
            !userId
              ? "Login required"
              : showAddForm
              ? "Cancel Adding Profile"
              : "Add New Profile"
          }
          className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-900 ${
            !userId
              ? "bg-gray-400 cursor-not-allowed"
              : showAddForm
              ? "bg-red-600 hover:bg-red-700"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {showAddForm ? (
            <>
              <PlusCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 transform rotate-45" />
              Cancel
            </>
          ) : (
            <>
              <PlusCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Add New
            </>
          )}
        </button>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b dark:border-gray-600 pb-2">
          Upload Resume (PDF)
        </h2>
        {uploadError && (
          <div className="mb-4 p-3 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 rounded-md text-sm">
            {uploadError}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full sm:w-auto text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
            disabled={isUploading}
          />
          <button
            onClick={handleFileUpload}
            disabled={!file || isUploading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-900 ${
              !file || isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? (
              <LoadingSpinner size="small" color="white" className="mr-2" />
            ) : null}
            {isUploading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Upload a PDF resume to auto-fill the profile form.
        </p>
      </div>

      {showAddForm && (
        <div className="mb-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white border-b dark:border-gray-600 pb-2">
            Create New Profile
          </h2>
          {formError && (
            <div className="mb-4 p-3 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 rounded-md text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddProfileSubmit} className="space-y-6">
            <fieldset className="border dark:border-gray-600 p-3 sm:p-4 rounded-md">
              <legend className="text-sm sm:text-base font-medium text-gray-900 dark:text-white px-2">
                Basic Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label htmlFor="profile_name" className={labelBaseClass}>
                    Profile Nickname *
                  </label>
                  <input
                    type="text"
                    id="profile_name"
                    name="profile_name"
                    required
                    value={formData.profile_name}
                    onChange={handleInputChange}
                    className={getInputClasses()}
                    placeholder="e.g., Main Profile, SDE Role"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="name" className={labelBaseClass}>
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={getInputClasses()}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelBaseClass}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={getInputClasses()}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={labelBaseClass}>
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses()}
                    placeholder="Optional"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className={labelBaseClass}>
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses()}
                    placeholder="Optional: City, State, Country"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="links" className={labelBaseClass}>
                    Links (Optional)
                  </label>
                  <input
                    type="text"
                    id="links"
                    name="links"
                    value={formData.links ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses()}
                    placeholder="Comma-separated: https://linkedin.com/in/johndoe, https://github.com/johndoe"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="border dark:border-gray-600 p-3 sm:p-4 rounded-md">
              <legend className="text-sm sm:text-base font-medium text-gray-900 dark:text-white px-2">
                Professional Details (Optional)
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-2">
                <div className="md:col-span-2">
                  <label htmlFor="education" className={labelBaseClass}>
                    Education
                  </label>
                  <textarea
                    id="education"
                    name="education"
                    value={formData.education ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses(true)}
                    placeholder="List degrees, schools, dates (one per line)..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="experience" className={labelBaseClass}>
                    Work Experience
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses(true)}
                    placeholder="List job titles, companies, dates, achievements (one per line)..."
                    rows={5}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="skills" className={labelBaseClass}>
                    Skills
                  </label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={formData.skills ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses(true)}
                    placeholder="Comma-separated: Python, React, AWS..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="certifications" className={labelBaseClass}>
                    Certifications
                  </label>
                  <textarea
                    id="certifications"
                    name="certifications"
                    value={formData.certifications ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses(true)}
                    placeholder="List certifications (one per line)..."
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="languages" className={labelBaseClass}>
                    Languages Spoken
                  </label>
                  <input
                    type="text"
                    id="languages"
                    name="languages"
                    value={formData.languages ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses()}
                    placeholder="Comma-separated: English, Spanish..."
                    disabled={isSubmitting}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="projects" className={labelBaseClass}>
                    Projects
                  </label>
                  <textarea
                    id="projects"
                    name="projects"
                    value={formData.projects ?? ""}
                    onChange={handleInputChange}
                    className={getInputClasses(true)}
                    placeholder="Describe projects, links if available (one per line)..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end pt-4 sm:pt-6 border-t dark:border-gray-600 space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData(initialFormData);
                  setFormError("");
                  setFile(null);
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex justify-center items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-900 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="white" className="mr-2" />
                ) : null}
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <LoadingSpinner />
        </div>
      )}
      {!loading && error && (
        <div className="my-4 text-red-700 dark:text-red-300 p-4 bg-red-100 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-600">
          <p className="font-medium">Error loading profiles:</p>
          <p>{error}</p>
          <button
            onClick={loadProfiles}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Try Again
          </button>
        </div>
      )}
      {!loading && !error && (
        <>
          {profiles.length === 0 && !showAddForm && (
            <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <IdentificationIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No profiles created yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first profile or uploading a PDF
                resume.
              </p>
            </div>
          )}

          {profiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col"
                >
                  <div className="p-4 sm:p-5 flex-grow">
                    <div className="flex items-center mb-3">
                      <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary dark:text-primary-light flex-shrink-0" />
                      <h3
                        className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate"
                        title={profile.profile_name}
                      >
                        {profile.profile_name}
                      </h3>
                    </div>
                    <div className="space-y-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <p>
                        <strong className="font-medium text-gray-800 dark:text-gray-200">
                          Name:
                        </strong>{" "}
                        {profile.name}
                      </p>
                      <p>
                        <strong className="font-medium text-gray-800 dark:text-gray-200">
                          Email:
                        </strong>{" "}
                        {profile.email}
                      </p>
                      {profile.phone && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Phone:
                          </strong>{" "}
                          {profile.phone}
                        </p>
                      )}
                      {profile.address && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Address:
                          </strong>{" "}
                          {profile.address}
                        </p>
                      )}
                      {profile.links && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Links:
                          </strong>{" "}
                          <span className="whitespace-pre-wrap block pl-2">
                            {profile.links}
                          </span>
                        </p>
                      )}
                      {profile.education && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Education:
                          </strong>{" "}
                          <span className="whitespace-pre-wrap block pl-2">
                            {profile.education}
                          </span>
                        </p>
                      )}
                      {profile.experience && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Experience:
                          </strong>{" "}
                          <span className="whitespace-pre-wrap block pl-2">
                            {profile.experience}
                          </span>
                        </p>
                      )}
                      {profile.skills && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Skills:
                          </strong>{" "}
                          <span className="whitespace-pre-wrap block pl-2">
                            {profile.skills}
                          </span>
                        </p>
                      )}
                      {profile.certifications && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Certifications:
                          </strong>{" "}
                          <span className="whitespace-pre-wrap block pl-2">
                            {profile.certifications}
                          </span>
                        </p>
                      )}
                      {profile.projects && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Projects:
                          </strong>{" "}
                          <span className="whitespace-pre-wrap block pl-2">
                            {profile.projects}
                          </span>
                        </p>
                      )}
                      {profile.languages && (
                        <p>
                          <strong className="font-medium text-gray-800 dark:text-gray-200">
                            Languages:
                          </strong>{" "}
                          <span className="whitespace-pre-wrap block pl-2">
                            {profile.languages}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 sm:px-5 py-2 sm:py-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {profile.id} | Created:{" "}
                      {new Date(profile.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfileManager;
