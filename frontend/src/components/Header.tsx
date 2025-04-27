import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Adjust path if needed
import {
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/solid";

// Define UserData type (or import if defined elsewhere)
interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

// Helper function to check authentication (can also be moved to a utils file)
const isAuthenticated = (): boolean => {
  try {
    // Optional: Add more robust check, e.g., validating the stored data structure
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) return false;
    // const userData: UserData = JSON.parse(userDataString);
    // return !!userData?.id; // Check if user data has an id
    return true; // Simple check for now
  } catch (error) {
    console.error("Error accessing localStorage for auth check:", error);
    return false;
  }
};

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation(); // Now called safely within a component rendered by App
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem("userData");
      navigate("/"); // Redirect to home after logout
    } catch (error) {
      console.error("Error clearing localStorage during logout:", error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-primary dark:text-primary-light hover:opacity-80 transition duration-200"
        >
          Resume
          <span className="text-secondary dark:text-secondary-light">
            Craft
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          {/* Show Login/Signup only if not on Auth page and not authenticated */}
          {!isAuthenticated() && location.pathname !== "/auth" && (
            <Link
              to="/auth"
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition duration-200 dark:bg-primary-dark dark:hover:bg-primary"
            >
              Login / Sign Up
            </Link>
          )}
          {/* Show Dashboard link and Logout if authenticated */}
          {isAuthenticated() && (
            <>
              <Link
                to="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition duration-200"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
              >
                <ArrowLeftOnRectangleIcon className="w-6 h-6" />
              </button>
            </>
          )}
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
          >
            {theme === "light" ? (
              <MoonIcon className="w-6 h-6" />
            ) : (
              <SunIcon className="w-6 h-6 text-yellow-400" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
