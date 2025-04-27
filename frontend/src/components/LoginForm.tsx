// src/components/LoginForm.tsx
import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate, NavigateFunction } from "react-router-dom";
import { LockClosedIcon, EnvelopeIcon } from "@heroicons/react/24/solid";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface LoginSuccessResponse {
  status: "success";
  message: string | null;
  data: {
    user: User;
  };
}

interface ApiErrorResponse {
  detail?: string | { msg: string; type: string }[];
  message?: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate: NavigateFunction = useNavigate();

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
    setLoading(true);

    try {
      const response = await axios.post<LoginSuccessResponse>(
        `${API_URL}/login`,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
        }
      );

      if (response.data?.status === "success" && response.data.data?.user) {
        try {
          localStorage.setItem(
            "userData",
            JSON.stringify(response.data.data.user)
          );
          navigate("/dashboard");
        } catch (storageError) {
          console.error(
            "Error saving user data to localStorage:",
            storageError
          );
          setError(
            "Login successful, but couldn't save session. Please try again."
          );
        }
      } else {
        setError(
          response.data.message ||
            "Login failed. Unexpected response from server."
        );
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error("Login Error:", error.response?.data || error.message);

      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;

        if (status === 401 || status === 403) {
          setError("Invalid email or password.");
        } else if (responseData?.detail) {
          if (typeof responseData.detail === "string") {
            setError(responseData.detail);
          } else if (
            Array.isArray(responseData.detail) &&
            responseData.detail.length > 0
          ) {
            setError(
              `Validation Error: ${responseData.detail[0].msg}` ||
                "Login failed. Please check your input."
            );
          } else {
            setError("Login failed due to invalid data.");
          }
        } else if (responseData?.message) {
          setError(responseData.message);
        } else {
          setError(`An error occurred (Status: ${status}). Please try again.`);
        }
      } else if (error.request) {
        setError(
          "Could not connect to the server. Please check your network and try again."
        );
      } else {
        setError(
          "An unexpected error occurred during login setup. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div
          className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          role="alert"
        >
          {error}
        </div>
      )}
      <input type="hidden" name="remember" defaultValue="true" />
      <div className="shadow-sm space-y-4">
        {" "}
        {/* Added space-y-4 for better spacing */}
        <div className="rounded-md">
          <label htmlFor="email-address-login" className="sr-only">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              id="email-address-login"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-light dark:focus:border-primary-light"
              placeholder="Email address"
              value={email}
              onChange={handleInputChange(setEmail)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="rounded-md">
          {" "}
          {/* Added rounded-md */}
          <label htmlFor="password-login" className="sr-only">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              id="password-login"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-light dark:focus:border-primary-light"
              placeholder="Password"
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
          disabled={loading}
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
            loading
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
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
