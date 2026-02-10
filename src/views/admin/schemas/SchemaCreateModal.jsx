import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { GiCrossMark } from "react-icons/gi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllSchemas } from "./schemaApi";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, X } from "lucide-react";

const SchemaCreateModal = ({ setCreateShowModal, createShowModal }) => {
  const [selectedHiddenPage, setSelectedHiddenPage] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    totalQuestions: "",
    maxMarks: "",
    minMarks: "",
    compulsoryQuestions: "",
    // evaluationTime: "",
    isActive: true,
    status: false,
    numberOfPage: "",
    hiddenPage: [],
    minTime: "",
    maxTime: "",
    perPage: "",
    PageofSupplement: "",
    numberOfSupplement: "",
  });

  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === "numberOfPage" && value === "") {
      setFormData((prevData) => ({
        ...prevData,
        hiddenPage: [],
      }));
    }

    if (type === "number") {
      const numericValue = value === "" ? "" : Math.max(0, Number(value));

      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    if (name === "hiddenPage") {
      if (formData?.hiddenPage?.includes(parseInt(value) - 1)) return;
      setFormData((prevData) => ({
        ...prevData,
        [name]: [...prevData.hiddenPage, parseInt(value) - 1],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const removeHiddenPageIndex = (index) => {
    setFormData((prev) => ({
      ...prev,
      hiddenPage: prev.hiddenPage.filter((_, i) => i !== index),
    }));
  };

  // ✅ 1. Mutation for creating schema
  const createSchemaMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/schemas/create/schema`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries(["schemas"]);

      toast.success("Schema created successfully!");

      const createdSchemaId = data?.data?._id || data?._id;

      setCreateShowModal(false);

      // ✅ NAVIGATE TO CREATE STRUCTURE PAGE
      navigate(`/admin/schema/create/structure/${createdSchemaId}`);
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create schema.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔍 Validation (same as before)
    if (
      !formData.name ||
      !formData.maxMarks ||
      !formData.minMarks ||
      !formData.totalQuestions ||
      !formData.compulsoryQuestions === 0 ||
      // !formData.evaluationTime ||
      !formData.numberOfPage ||
      formData?.hiddenPage?.length === 0 ||
      !formData?.minTime ||
      // !formData?.numberOfSupplement === 0 ||
      // !formData?.PageofSupplement === 0 ||
      !formData?.perPage ||
      !formData?.maxTime
    ) {
      toast.error("All fields are required.");
      return;
    }

    if (Number(formData?.maxMarks) <= 0) {
      toast.error("Max Marks must be greater than zero.");
      return;
    }

    if (
      Number(formData?.minMarks) < 0 ||
      Number(formData?.minMarks) > Number(formData?.maxMarks)
    ) {
      toast.error("Min Marks must be valid and less than Max Marks.");
      return;
    }

    if (Number(formData?.totalQuestions) <= 0) {
      toast.error("Total Questions must be greater than zero.");
      return;
    }

    if (
      Number(formData?.compulsoryQuestions) > Number(formData?.totalQuestions)
    ) {
      toast.error("Compulsory Questions cannot exceed Total Questions.");
      return;
    }

    // if (Number(formData?.evaluationTime) <= 0) {
    //   toast.error("Evaluation Time must be positive.");
    //   return;
    // }
    if (Number(formData?.minTime) <= 0) {
      toast.error("Min Time must be positive.");
      return;
    }

    if (
      formData.numberOfSupplement !== "" &&
      Number(formData.numberOfSupplement) < 0
    ) {
      toast.error("Number of Supplement cannot be negative.");
      return;
    }

    if (
      formData.PageofSupplement !== "" &&
      Number(formData.PageofSupplement) < 0
    ) {
      toast.error("Pages in Supplement cannot be negative.");
      return;
    }

    if (Number(formData?.maxTime) <= 0) {
      toast.error("Max Time must be positive.");
      return;
    }

    // ✅ 3. Trigger mutation
    createSchemaMutation.mutate(formData);
  };

  const loading = createSchemaMutation.isPending;

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-50 flex items-start justify-center border-gray-800 backdrop-blur-sm sm:items-center ${
          createShowModal ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 opacity-60"
          onClick={() => setCreateShowModal(false)}
        ></div>

        <div className="dark:bg-slate-900 border-slate-200 dark:border-slate-700 relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border bg-white shadow-2xl sm:max-w-lg">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Create Schema</h2>
            <motion.button
              onClick={() => setCreateShowModal(false)}
              className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} className="text-white" />
            </motion.button>
          </div>

          <div className="p-3 sm:p-5">
            <form onSubmit={handleSubmit} className="sm:space-y-3">
              {/* Schema Name */}

              <div className="flex flex-col justify-between space-x-3 sm:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="name"
                  >
                    Schema Name:
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="perPage"
                  >
                    Page Time (in Sec)
                  </label>
                  <input
                    type="number"
                    id="perPage"
                    name="perPage"
                    value={formData.perPage}
                    placeholder="Per Page Time"
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              {/* Total Questions */}
              <div className="flex flex-col justify-between space-x-3 sm:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="totalQuestions"
                  >
                    Total Questions:
                  </label>
                  <input
                    type="number"
                    id="totalQuestions"
                    name="totalQuestions"
                    value={formData.totalQuestions}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="maxMarks"
                  >
                    Max Marks:
                  </label>
                  <input
                    type="number"
                    id="maxMarks"
                    name="maxMarks"
                    placeholder="- -"
                    value={formData.maxMarks}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              <div className="flex flex-col justify-between space-x-3 sm:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="minTime"
                  >
                    Min Time (in minutes):
                  </label>
                  <input
                    type="number"
                    id="minTime"
                    name="minTime"
                    placeholder="- -"
                    value={formData.minTime}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="maxTime"
                  >
                    Max Time (in minutes):
                  </label>
                  <input
                    type="number"
                    id="maxTime"
                    name="maxTime"
                    value={formData.maxTime}
                    placeholder="- -"
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              {/* Number of pages in Booklets and Hidden Pages */}
              <div className="flex flex-col justify-between sm:flex-row">
                {/* No. of pages input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="numberOfPage"
                  >
                    No. of pages in Booklets:
                  </label>
                  <input
                    type="number"
                    id="numberOfPage"
                    name="numberOfPage"
                    value={formData.numberOfPage}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>

                {/* Hidden Pages Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="hiddenPage"
                  >
                    Hidden Pages:
                  </label>
                  <select
                    id="hiddenPage"
                    value={selectedHiddenPage}
                    onChange={(e) => {
                      const value = Number(e.target.value) - 1;

                      if (!formData.hiddenPage.includes(value)) {
                        setFormData((prev) => ({
                          ...prev,
                          hiddenPage: [...prev.hiddenPage, value],
                        }));
                      }

                      setSelectedHiddenPage(""); // ✅ reset dropdown
                    }}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  >
                    <option
                      value=""
                      className="rounded-xl px-2 text-sm text-gray-400"
                    >
                      Select Hidden Pages
                    </option>
                    {Array.from(
                      { length: formData?.numberOfPage },
                      (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1}
                        </option>
                      )
                    )}
                  </select>
                </motion.div>
              </div>
              {/* Page Index Contains */}
              {formData?.hiddenPage?.length > 0 && (
                <div className="flex flex-col justify-between sm:flex-row">
                  <div className="flex w-full flex-wrap gap-2 rounded-md border border-gray-300 px-4 py-1 sm:py-3">
                    {formData?.hiddenPage?.map((item, index) => (
                      <div
                        key={index}
                        className="flex cursor-pointer items-center space-x-1 rounded-lg bg-green-800 px-4 py-2 text-sm text-white "
                        onClick={() => removeHiddenPageIndex(index)}
                      >
                        <span className="">{parseInt(item) + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Min Marks */}

              <div className="flex flex-col justify-between sm:flex-row">
                {/* No. of pages input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="numberOfSupplement"
                  >
                    No. of Supplement:
                  </label>
                  <input
                    type="number"
                    id="numberOfSupplement"
                    name="numberOfSupplement"
                    value={formData.numberOfSupplement}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="PageofSupplement"
                  >
                    Pages in Supplement:
                  </label>
                  <input
                    type="number"
                    id="PageofSupplement"
                    name="PageofSupplement"
                    value={formData.PageofSupplement}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              <div className="flex flex-col justify-between space-x-3 sm:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="minMarks"
                  >
                    Min Marks:
                  </label>
                  <input
                    type="number"
                    id="minMarks"
                    name="minMarks"
                    value={formData.minMarks}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="compulsoryQuestions"
                  >
                    Compulsory Questions:
                  </label>
                  <input
                    type="number"
                    id="compulsoryQuestions"
                    name="compulsoryQuestions"
                    value={formData.compulsoryQuestions}
                    onChange={handleChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              {/* <div className="mb-2 sm:mb-0">
                <label
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-white sm:mb-2 sm:text-lg"
                  htmlFor="evaluationTime"
                >
                  Evaluation Time (in minutes):
                </label>
                <input
                  type="number"
                  id="evaluationTime"
                  name="evaluationTime"
                  value={formData.evaluationTime}
                  onChange={handleChange}
                  className="w-72 rounded-md border border-gray-300 px-2 py-0.5 shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:w-full sm:px-4 sm:py-2 text-sm sm:text-md"
                />
              </div> */}
              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Creating Schema...
                  </span>
                ) : (
                  "Create Schema"
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SchemaCreateModal;
