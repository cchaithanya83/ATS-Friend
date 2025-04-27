// src/components/dashboard/DashboardLayout.tsx
import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  UserCircleIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon, // Example: Link back to main site homepage
} from "@heroicons/react/24/outline"; // Use outline icons for navigation typically

const DashboardLayout: React.FC = () => {
  const location = useLocation();

  // Define classes for NavLink styling
  const baseLinkClass =
    "flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-150 transform rounded-lg";
  const hoverLinkClass =
    "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-200";
  const activeLinkClass =
    "bg-primary-light/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light font-semibold"; // Example active style

  // Function to apply classes conditionally based on NavLink's isActive state
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `${baseLinkClass} ${hoverLinkClass} ${isActive ? activeLinkClass : ""}`;

  // Determine header height (adjust if your actual header height is different)
  // This assumes you've set --header-height in App.tsx or use a fixed value
  const headerHeight = "68px"; // Or use CSS variable: 'var(--header-height, 68px)'

  return (
    // Use flex layout for sidebar + content
    // Calculate height to fill remaining viewport below the header
    <div className="flex" style={{ height: `calc(100vh - ${headerHeight})` }}>
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto shadow-sm">
        <div className="flex flex-col h-full">
          {/* Optional Sidebar Header/Logo */}
          {/* <div className="px-4 py-4 border-b dark:border-gray-700"> ... </div> */}

          <nav className="flex-1 px-3 py-4 space-y-1.5">
            {/* Dashboard Links */}
            <NavLink to="/dashboard/profiles" className={getNavLinkClass}>
              <UserCircleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Profiles
            </NavLink>
            <NavLink
              to="/dashboard/resumes"
              className={({ isActive }) =>
                getNavLinkClass({
                  isActive:
                    isActive ||
                    location.pathname.startsWith("/dashboard/resumes/"),
                })
              }
            >
              {" "}
              {/* Highlight for child routes */}
              <DocumentDuplicateIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Generated Resumes
            </NavLink>
            <NavLink to="/dashboard/generate" className={getNavLinkClass}>
              <DocumentTextIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Generate New
            </NavLink>

            {/* Divider */}
            <div className="pt-2 pb-1">
              <hr className="border-gray-200 dark:border-gray-600" />
            </div>

            <NavLink to="/dashboard/settings" className={getNavLinkClass}>
              <Cog6ToothIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Settings
            </NavLink>

            {/* Optional: Link back to main site home */}
            <NavLink
              to="/"
              className={`${baseLinkClass} ${hoverLinkClass} mt-4`}
            >
              <HomeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              Back to Main Site
            </NavLink>
          </nav>

          {/* Optional Sidebar Footer */}
          {/* <div className="px-4 py-4 border-t dark:border-gray-700 mt-auto"> ... </div> */}
        </div>
      </aside>

      {/* Main Content Area */}
      {/* Use overflow-y-auto for scrolling only the content, not the whole page */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {/* Nested dashboard routes (ProfileManager, ResumeList, etc.) will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
