import React, { useState, useEffect } from "react";
import { updateUserSettings, getUserId } from "../../services/api"; // Adjust path
import { User, UpdateUserPayload } from "../../types/api"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path
import { LockClosedIcon, PhoneIcon } from "@heroicons/react/24/solid";

const Settings: React.FC = () => {
  const [currentPhone, setCurrentPhone] = useState<string>(""); // Store initial phone
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const userId = getUserId();

  // Load current user data (optional, just to prefill phone)
  useEffect(() => {
    try {
      const userDataString = localStorage.getItem("userData");
      if (userDataString) {
        const userData: User = JSON.parse(userDataString);
        const userPhone = userData.phone || "";
        setPhone(userPhone);
        setCurrentPhone(userPhone); // Store initial value
      }
    } catch (e) {
      console.error("Error parsing user data for settings:", e);
    }
  }, []); // Run once on mount

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("User not identified. Please log in again.");
      return;
    }

    // Construct payload only with fields that changed
    const payload: UpdateUserPayload = {};
    let changesMade = false;

    // Phone validation (optional, basic example)
    const newPhone = phone.trim();
    if (newPhone !== currentPhone) {
      // Add more robust phone validation if needed
      payload.phone = newPhone === "" ? null : newPhone; // Send null if cleared
      changesMade = true;
    }

    // Password validation
    const newPassword = password.trim();
    if (newPassword) {
      // Only include password if user entered something
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
      payload.password = newPassword; // Include password if valid and provided
      changesMade = true;
    }

    if (!changesMade) {
      setError("No changes detected to save.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateUserSettings(userId, payload);
      setSuccess("Settings updated successfully!");
      // Optionally update localStorage if user data is returned and used elsewhere
      if (updatedUser) {
        try {
          const currentDataString = localStorage.getItem("userData");
          const currentData = currentDataString
            ? JSON.parse(currentDataString)
            : {};
          // Merge existing data with updated fields (don't store password)
          const updatedStorageData = {
            ...currentData,
            phone: updatedUser.phone,
            // update other fields if necessary
          };
          localStorage.setItem("userData", JSON.stringify(updatedStorageData));
          setCurrentPhone(updatedUser.phone || ""); // Update current phone state
        } catch (storageError) {
          console.error(
            "Failed to update user data in localStorage:",
            storageError
          );
        }
      }
      // Clear password fields after successful update
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Settings
      </h1>

      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
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
          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
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
                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="(Optional)"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Change Password Section */}
          <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <legend className="text-base font-medium text-gray-900 dark:text-white">
              Change Password
            </legend>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Leave blank to keep your current password.
            </p>

            {/* New Password */}
            <div className="mt-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
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
                  className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Min. 6 characters"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {/* Confirm New Password */}
            <div className="mt-4">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
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
                  className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Re-enter new password"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </fieldset>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSubmitting
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition duration-150`}
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
