// src/components/dashboard/DashboardLayout.tsx
import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  UserCircleIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  Bars3Icon, // For mobile menu toggle
  XMarkIcon, // For closing mobile menu
} from "@heroicons/react/24/outline";

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  const baseLinkClass =
    "flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-150 transform rounded-lg";
  const hoverLinkClass =
    "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-200";
  const activeLinkClass =
    "bg-primary-light/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light font-semibold";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `${baseLinkClass} ${hoverLinkClass} ${isActive ? activeLinkClass : ""}`;

  const getCombinedNavLinkClass =
    (path: string) =>
    ({ isActive }: { isActive: boolean }): string =>
      getNavLinkClass({
        isActive:
          isActive || location.pathname.startsWith(`/dashboard/${path}/`),
      });

  const headerHeight = "64px";
  const footerHeight = "40px"; // Adjust if footer is visible in dashboard

  return (
    <div className="flex h-[calc(100vh-var(--header-height,68px)-var(--footer-height,73px))]  flex-col md:flex-row">
      {/* Mobile Sidebar Toggle Button (visible only on small screens) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className=" md:hidden fixed top-[68px] left-2 z-60 p-1 bg-white dark:bg-gray-800 rounded-md shadow" // Adjust positioning as needed
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Sidebar Navigation */}
      {/* Conditionally apply classes for mobile view: fixed, full height, translation */}
      <aside
        className={`fixed left-0 z-30 w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto shadow-sm transition-transform duration-300 ease-in-out
    top-[68px] h-[calc(100vh-68px)]
    md:relative md:top-0 md:h-[calc(100vh-64px-76px)] md:translate-x-0 md:shadow-none ${
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-3 py-4 space-y-1.5">
            <NavLink
              to="/dashboard/profiles"
              className={getNavLinkClass}
              onClick={() => setIsSidebarOpen(false)}
            >
              <UserCircleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Profiles
            </NavLink>
            <NavLink
              to="/dashboard/resumes"
              className={getCombinedNavLinkClass("resumes")}
              onClick={() => setIsSidebarOpen(false)}
            >
              <DocumentDuplicateIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Generated Resumes
            </NavLink>
            <NavLink
              to="/dashboard/generate"
              className={getNavLinkClass}
              onClick={() => setIsSidebarOpen(false)}
            >
              <DocumentTextIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Generate New
            </NavLink>

            <div className="pt-2 pb-1">
              <hr className="border-gray-200 dark:border-gray-600" />
            </div>

            <NavLink
              to="/dashboard/settings"
              className={getNavLinkClass}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Cog6ToothIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Settings
            </NavLink>

            <NavLink
              to="/"
              className={`${baseLinkClass} ${hoverLinkClass} mt-4`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <HomeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Back to Main Site
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Main Content Area */}
      {/* Add margin-left on medium+ screens to account for sidebar */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto bg-gray-50 dark:bg-gray-900 ">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
