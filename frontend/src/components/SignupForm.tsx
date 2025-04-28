// src/components/SignupForm.tsx
import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
} from "@heroicons/react/24/solid";

interface SignupSuccessResponse {
  status: "success";
  message: string | null;
  data: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface ApiErrorResponse {
  detail?: string | { msg: string; type: string }[];
  message?: string;
}

interface SignupFormProps {
  switchToLogin: () => void;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const SignupForm: React.FC<SignupFormProps> = ({ switchToLogin }) => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setter(e.target.value);
    };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || null,
      created_at: new Date().toISOString(), // Optional: Set to current time
    }; // Backend handles created_at

    try {
      const response = await axios.post<SignupSuccessResponse>(
        `${API_URL}/signup`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
        }
      );

      if (response.data?.status === "success") {
        setSuccess("Account created successfully! Redirecting to login...");
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setTimeout(() => {
          switchToLogin();
        }, 2000);
      } else {
        setError(
          response.data.message || "Signup failed. Unexpected response format."
        );
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error("Signup Error:", error.response?.data || error.message);

      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;

        if (status === 400 || status === 422) {
          // Include 422 for validation
          if (responseData?.detail) {
            if (typeof responseData.detail === "string") {
              if (
                responseData.detail
                  .toLowerCase()
                  .includes("email already registered")
              ) {
                setError("This email address is already registered.");
              } else {
                setError(responseData.detail);
              }
            } else if (
              Array.isArray(responseData.detail) &&
              responseData.detail.length > 0
            ) {
              setError(
                `Validation Error: ${responseData.detail[0].msg}` ||
                  "Please check your input."
              );
            } else {
              setError(
                "Signup failed due to invalid data. Please check your input."
              );
            }
          } else if (responseData?.message) {
            setError(responseData.message);
          } else {
            setError("Signup failed. Please check the details you provided.");
          }
        } else {
          setError(`An error occurred (Status: ${status}). Please try again.`);
        }
      } else if (error.request) {
        setError("Could not connect to the server. Please check your network.");
      } else {
        setError(
          "An unexpected error occurred during signup setup. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass =
    "appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-light dark:focus:border-primary-light";

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div
          className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm"
          role="alert"
        >
          {success}
        </div>
      )}
      <input type="hidden" name="remember" defaultValue="true" />
      <div className="rounded-md shadow-sm space-y-3">
        <div>
          <label htmlFor="name-signup" className="sr-only">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="name-signup"
              name="name"
              type="text"
              autoComplete="name"
              required
              className={inputBaseClass}
              placeholder="Full Name"
              value={name}
              onChange={handleInputChange(setName)}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="email-address-signup" className="sr-only">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email-address-signup"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputBaseClass}
              placeholder="Email address"
              value={email}
              onChange={handleInputChange(setEmail)}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="phone-signup" className="sr-only">
            Phone Number (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone-signup"
              name="phone"
              type="tel"
              autoComplete="tel"
              className={inputBaseClass}
              placeholder="Phone Number (Optional)"
              value={phone}
              onChange={handleInputChange(setPhone)}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="password-signup" className="sr-only">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password-signup"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={inputBaseClass}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={handleInputChange(setPassword)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || success !== ""}
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
            loading || success
              ? "bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary dark:focus:ring-offset-gray-800"
          } transition duration-150 ease-in-out`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing up...
            </>
          ) : (
            "Sign up"
          )}
        </button>
      </div>
    </form>
  );
};

export default SignupForm;
