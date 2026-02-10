import { data } from "autoprefixer";
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const SchemaDeleteModal = ({
  deleteShowModal,
  setDeleteShowModal,
  handleConfirmDelete,
  id,
}) => {
  if (!deleteShowModal) return null; // Don't render modal if showModal is false

  return (
    <AnimatePresence>
      <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
        <div className="dark:bg-slate-900 border-slate-200 dark:border-slate-700 relative m-2 transform overflow-hidden rounded-3xl border bg-white shadow-2xl sm:w-full sm:max-w-lg">
          {/* Close button */}
          <motion.button
            onClick={() => setDeleteShowModal(false)} // Handle close when 'X' is clicked
            className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} className="text-white" />
          </motion.button>

          {/* Modal content */}
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-300">
              Are you sure you want to delete this item?
            </h3>

            {/* Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  handleConfirmDelete(id);
                }}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteShowModal(false)}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-900 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SchemaDeleteModal;
