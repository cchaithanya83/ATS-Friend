// src/App.tsx - Update Routes section

import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
// ... other imports ...
import Header from "./components/Header";
// import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
// Import Dashboard Layout and Pages/Components
import DashboardLayout from "./components/dashboard/DashboardLayout";
import ProfileManager from "./pages/dashboard/ProfileManager"; // New page for profiles
import ResumeList from "./pages/dashboard/ResumeList"; // New page for listing resumes
import GenerateResume from "./pages/dashboard/GenerateResume"; // New page for generation form
import ResumeView from "./pages/dashboard/ResumeView"; // New page for viewing a single resume
import Settings from "./pages/dashboard/Settings"; // New page for settings

// --- Authentication Check --- (Keep or import your isAuthenticated helper)
const isAuthenticated = (): boolean => {
    // Replace with your actual authentication logic
    return !!localStorage.getItem("userData"); // Example: check for a token in local storage
};

// --- Protected Route Wrapper ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Header />
      <main
        className="flex-grow"
        style={{ "--header-height": "68px" } as React.CSSProperties}
      >
        {" "}
        {/* Pass header height for layout calc */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/auth"
            element={
              isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthPage />
              )
            }
          />
          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Index route for dashboard - redirects or shows overview */}
            <Route index element={<Navigate to="profiles" replace />} />{" "}
            {/* Default to profiles */}
            {/* Nested Dashboard Pages */}
            <Route path="profiles" element={<ProfileManager />} />
            <Route path="resumes" element={<ResumeList />} />
            <Route path="resumes/:resumeId" element={<ResumeView />} />{" "}
            {/* Route for single resume view */}
            <Route path="generate" element={<GenerateResume />} />
            <Route path="settings" element={<Settings />} />
            {/* Add other nested dashboard routes here */}
          </Route>
          {/* Optional: Catch-all 404 route */}
          <Route path="*" element={<Navigate to="/" replace />} />{" "}
          {/* Or a dedicated 404 component */}
        </Routes>
      </main>
      {/* Footer might not be needed/visible on dashboard routes depending on layout */}
      {/* <Footer /> */}
    </div>
  );
}

export default App;
