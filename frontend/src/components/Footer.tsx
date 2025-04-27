// src/components/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="container mx-auto px-4 sm:px-6 py-1 flex flex-col md:flex-row items-center justify-between text-center md:text-left md:py-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-0 md:mb-0">
          © {new Date().getFullYear()} Chaithanya K. All rights reserved.
        </p>
        <div>
          <Link
            to="https://chaithanyak.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary underline text-sm font-medium"
          >
            chaithanyak.in
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
