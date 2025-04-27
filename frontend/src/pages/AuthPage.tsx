import React, { useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true); // State for toggling form

  const toggleForm = (): void => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-[calc(100vh-150px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Adjusted min-height to account for potential header/footer */}
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <button
              onClick={toggleForm}
              className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition duration-150 ease-in-out focus:outline-none"
            >
              {isLogin ? "create a new account" : "sign in if you have one"}
            </button>
          </p>
        </div>

        {/* Pass toggleForm to SignupForm if needed after successful signup */}
        {isLogin ? <LoginForm /> : <SignupForm switchToLogin={toggleForm} />}
      </div>
    </div>
  );
};

export default AuthPage;
