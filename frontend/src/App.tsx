// src/App.tsx

import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import ProfileManager from "./pages/dashboard/ProfileManager";
import ResumeList from "./pages/dashboard/ResumeList";
import GenerateResume from "./pages/dashboard/GenerateResume";
import ResumeView from "./pages/dashboard/ResumeView";
import Settings from "./pages/dashboard/Settings";

const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("userData");
};

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
        <Routes>
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
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="profiles" replace />} />
            <Route path="profiles" element={<ProfileManager />} />
            <Route path="resumes" element={<ResumeList />} />
            <Route path="resumes/:resumeId" element={<ResumeView />} />
            <Route path="generate" element={<GenerateResume />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;