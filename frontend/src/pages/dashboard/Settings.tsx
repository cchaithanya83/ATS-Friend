// src/pages/dashboard/Settings.tsx
import React, { useState, useEffect } from "react";
import { updateUserSettings, getUserId } from "../../services/api";
import { User, UpdateUserPayload } from "../../types/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { LockClosedIcon, PhoneIcon } from "@heroicons/react/24/solid";

const Settings: React.FC = () => {
  const [currentPhone, setCurrentPhone] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const userId = getUserId();

  useEffect(() => {
    try {
      const userDataString = localStorage.getItem("userData");
      if (userDataString) {
        const userData: User = JSON.parse(userDataString);
        const userPhone = userData.phone || "";
        setPhone(userPhone);
        setCurrentPhone(userPhone);
      }
    } catch (e) {
      console.error("Error parsing user data for settings:", e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("User not identified. Please log in again.");
      return;
    }

    const payload: UpdateUserPayload = {};
    let changesMade = false;

    const newPhone = phone.trim();
    if (newPhone !== currentPhone) {
      payload.phone = newPhone === "" ? null : newPhone;
      changesMade = true;
    }

    const newPassword = password.trim();
    if (newPassword) {
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
      payload.password = newPassword;
      changesMade = true;
    }

    if (!changesMade) {
      setError("No changes detected to save.");
      // Optionally clear success message if trying to save unchanged data
      // setSuccess("");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateUserSettings(userId, payload);
      setSuccess("Settings updated successfully!");
      if (updatedUser) {
        try {
          const currentDataString = localStorage.getItem("userData");
          const currentData = currentDataString
            ? JSON.parse(currentDataString)
            : {};
          const updatedStorageData = {
            ...currentData,
            phone: updatedUser.phone,
          };
          localStorage.setItem("userData", JSON.stringify(updatedStorageData));
          setCurrentPhone(updatedUser.phone || "");
        } catch (storageError) {
          console.error(
            "Failed to update user data in localStorage:",
            storageError
          );
        }
      }
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings."
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass =
    "focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 disabled:opacity-50";
  const labelBaseClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div>
      {" "}
      {/* Removed outer padding */}
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6">
        Settings
      </h1>
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 md:p-8">
        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-sm text-green-600 dark:text-green-400 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className={labelBaseClass}>
              Phone Number
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputBaseClass}
                placeholder="(Optional)"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <legend className="text-base font-medium text-gray-900 dark:text-white">
              Change Password
            </legend>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Leave blank to keep your current password.
            </p>

            <div className="mt-4">
              <label htmlFor="password" className={labelBaseClass}>
                New Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputBaseClass}
                  placeholder="Min. 6 characters"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="confirmPassword" className={labelBaseClass}>
                Confirm New Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputBaseClass}
                  placeholder="Re-enter new password"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSubmitting
                  ? "bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary dark:focus:ring-offset-gray-800"
              } transition duration-150 ease-in-out`}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" color="white" className="mr-2" />
              ) : null}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
