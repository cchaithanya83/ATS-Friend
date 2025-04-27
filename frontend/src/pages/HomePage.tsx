// src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const HomePage: React.FC = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    // Use min-height to ensure content fills viewport vertically, adjust padding
    <div
      style={{
        minHeight:
          "calc(100vh - var(--header-height, 68px) - var(--footer-height, 50px))",
      }}
      className="flex flex-col"
    >
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 text-center flex-grow">
        {/* Hero Section */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            Craft Resumes That{" "}
            <span className="text-primary dark:text-primary-light">
              Beat the ATS
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl md:max-w-2xl mx-auto">
            Tailor your resume to specific job descriptions effortlessly and
            increase your chances of landing an interview.
          </p>
          <Link
            to="/auth" // Link to Auth page
            className="inline-flex items-center px-6 py-2.5 sm:px-8 sm:py-3 bg-primary hover:bg-primary-dark text-white text-base sm:text-lg font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 dark:bg-primary-dark dark:hover:bg-primary"
          >
            Get Started Now
            <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Link>
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="mt-16 md:mt-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }} // Trigger animation earlier
          variants={staggerContainer}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-10 md:mb-12">
            Why Choose ATSFriend? {/* Updated Name */}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {/* Feature 1 */}
            <motion.div
              variants={fadeIn}
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900/50 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto">
                <DocumentTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary dark:text-primary-light" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                JD-Resume Matching
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Upload your resume and the job description. We analyze keywords
                and suggest improvements.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={fadeIn}
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-center mb-4 bg-pink-100 dark:bg-pink-900/50 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto">
                <AdjustmentsHorizontalIcon className="w-6 h-6 sm:w-8 sm:h-8 text-secondary dark:text-secondary-light" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ATS Optimization
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Generate resumes formatted to pass Applicant Tracking Systems
                used by most companies.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={fadeIn}
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-center mb-4 bg-green-100 dark:bg-green-900/50 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto">
                <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fast & Easy
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Get a tailored resume draft in minutes, saving you hours of
                manual editing.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Call to Action Section */}
        <motion.div
          className="mt-16 md:mt-24 bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-8 md:p-12 rounded-lg shadow-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }} // Trigger animation earlier
          variants={fadeIn}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Impress Recruiters?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
            Stop getting filtered out. Start getting interviews.
          </p>
          <Link
            to="/auth" // Link to Auth page
            className="inline-flex items-center px-6 py-2.5 sm:px-8 sm:py-3 bg-secondary hover:bg-secondary-dark text-white text-base sm:text-lg font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 dark:bg-secondary-dark dark:hover:bg-secondary"
          >
            Sign Up for Free
            <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
