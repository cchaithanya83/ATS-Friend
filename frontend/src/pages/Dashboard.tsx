// src/components/dashboard/DashboardLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  UserCircleIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const DashboardLayout: React.FC = () => {
  const baseLinkClass =
    "flex items-center px-4 py-2 mt-2 text-gray-600 dark:text-gray-400 transition-colors duration-200 transform rounded-md";
  const activeLinkClass =
    "bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700";
  const hoverLinkClass =
    "hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200";

  // Combine classes conditionally for NavLink
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `${baseLinkClass} ${hoverLinkClass} ${isActive ? activeLinkClass : ""}`;

  return (
    <div className="flex h-[calc(100vh-var(--header-height,68px))]">
      {" "}
      {/* Adjust var if header height changes */}
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex-shrink-0 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Dashboard
          </h2>
          <nav>
            <NavLink to="profiles" className={getNavLinkClass}>
              <UserCircleIcon className="w-5 h-5 mr-3" /> Profiles
            </NavLink>
            <NavLink to="resumes" className={getNavLinkClass}>
              <DocumentDuplicateIcon className="w-5 h-5 mr-3" /> Generated
              Resumes
            </NavLink>
            <NavLink to="generate" className={getNavLinkClass}>
              <DocumentTextIcon className="w-5 h-5 mr-3" /> Generate New
            </NavLink>
            <NavLink to="settings" className={getNavLinkClass}>
              <Cog6ToothIcon className="w-5 h-5 mr-3" /> Settings
            </NavLink>
          </nav>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <Outlet /> {/* Nested routes will render here */}
      </main>
    </div>
  );
};

export default DashboardLayout;
