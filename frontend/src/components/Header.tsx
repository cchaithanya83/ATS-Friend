// src/components/Header.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/solid";

const isAuthenticated = (): boolean => {
  try {
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) return false;
    return true;
  } catch (error) {
    console.error("Error accessing localStorage for auth check:", error);
    return false;
  }
};

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem("userData");

      navigate("/auth", { replace: true });
      window.location.reload(); // Reload the page to reflect the logout state
    } catch (error) {
      console.error("Error clearing localStorage during logout:", error);
    }
  };

  return (
    <header className=" bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 h-[var(--header-height,68px)]  flex-shrink-0 mb-4 md:mb-0"> 
      <nav className="container mx-auto px-4 sm:px-6 h-full flex justify-between items-center">
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold text-primary dark:text-primary-light hover:opacity-80 transition duration-200"
        >
          ATS
          <span className="text-secondary dark:text-secondary-light">
            Friend
          </span>
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {!isAuthenticated() && location.pathname !== "/auth" && (
            <Link
              to="/auth"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-primary hover:bg-primary-dark text-white rounded-md transition duration-200 dark:bg-primary-dark dark:hover:bg-primary"
            >
              Login / Sign Up
            </Link>
          )}
          {isAuthenticated() && (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-block text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition duration-200"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 sm:p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 sm:p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
          >
            {theme === "light" ? (
              <MoonIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <SunIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
