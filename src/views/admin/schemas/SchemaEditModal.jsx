import { Loader2, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "motion/react";

const SchemaEditModal = ({
  editShowModal,
  setEditShowModal,
  selectedSchema,
  handleUpdate,
  loading,
}) => {
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
  const [selectedHiddenPage, setSelectedHiddenPage] = useState("");

  useEffect(() => {
    if (selectedSchema) {
      setFormData({
        name: selectedSchema.name || "",
        maxMarks: selectedSchema.maxMarks || "",
        minMarks: selectedSchema.minMarks || "",
        totalQuestions: selectedSchema.totalQuestions || "",
        compulsoryQuestions: selectedSchema.compulsoryQuestions || "",
        PageofSupplement: selectedSchema.PageofSupplement || "",
        numberOfSupplement: selectedSchema.numberOfSupplement || "",
        // evaluationTime: selectedSchema.evaluationTime || "",
        minTime: selectedSchema.minTime || "",
        maxTime: selectedSchema.maxTime || "",
        perPage: selectedSchema.perPage || "",
        isActive: selectedSchema.isActive || true,
        status: false,
        numberOfPage: selectedSchema.numberOfPage || "",
        hiddenPage:
          selectedSchema.hiddenPage.map((item) => parseInt(item) - 1) || [],
      });
    }
  }, [selectedSchema]);

  // console.log(selectedSchema)

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      const numericValue = value === "" ? "" : Math.max(0, Number(value));

      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    if (name === "numberOfPage" && value === "") {
      setFormData((prevData) => ({
        ...prevData,
        hiddenPage: [],
      }));
    }
    if (name === "hiddenPage") {
      if (formData?.hiddenPage?.includes(parseInt(value) - 1)) {
        return;
      }
      setFormData((prevData) => ({
        ...prevData,
        [name]: [...prevData?.hiddenPage, parseInt(value) - 1], // Preserves previous values and adds the new one
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };
  // console.log(formData)

  const removeHiddenPageIndex = (index) => {
    setFormData((prev) => ({
      ...prev,
      hiddenPage: prev?.hiddenPage.filter((_, i) => i !== index),
    }));
  };

  const validationCheck = async () => {
    if (
      !formData.name ||
      !formData.maxMarks ||
      !formData.minMarks ||
      !formData.totalQuestions ||
      formData.compulsoryQuestions === 0 ||
      // !formData.evaluationTime ||
      !formData.minTime ||
      !formData.maxTime ||
      !formData?.numberOfSupplement === 0 ||
      !formData?.PageofSupplement === 0 ||
      !formData.numberOfPage ||
      !formData.perPage ||
      formData?.hiddenPage?.length === 0
    ) {
      toast.error("All fields are required.");
      return;
    }

    if (!formData.name || formData?.name.trim().length === 0) {
      toast.error("Name is required.");
      return;
    }
    if (!formData.maxMarks || Number(formData?.maxMarks) < 0) {
      toast.error("Max Marks must be greater than zero.");
      return;
    }

    if (
      !formData.minMarks ||
      Number(formData?.minMarks) < 0 ||
      Number(formData?.minMarks) > Number(formData?.maxMarks)
    ) {
      toast.error(
        "Min Marks must be a positive number and less than or equal to Max Marks."
      );
      return;
    }

    if (
      formData.numberOfSupplement !== "" &&
      Number(formData.numberOfSupplement) <= 0
    ) {
      toast.error("Number of Supplement must be greater than 0.");
      return;
    }

    if (
      formData.PageofSupplement !== "" &&
      Number(formData.PageofSupplement) <= 0
    ) {
      toast.error("Pages in Supplement must be greater than 0.");
      return;
    }

    if (!formData.totalQuestions || Number(formData?.totalQuestions) <= 0) {
      toast.error("Total Questions must be greater than zero.");
      return;
    }

    // Validate compulsoryQuestions
    const compulsory = Number(formData.compulsoryQuestions);

    if (Number.isNaN(compulsory) || compulsory < 0) {
      toast.error("Compulsory Questions must be 0 or a positive number.");
      return;
    }

    if (
      Number(formData?.compulsoryQuestions) > Number(formData?.totalQuestions)
    ) {
      toast.error("Compulsory Questions cannot be more than Total Question.");
      return;
    }

    // if (!formData.evaluationTime || Number(formData?.evaluationTime) < 0) {
    //   toast.error("Evaluation Time must be a postive number.");
    //   return;
    // }
    if (Number(formData?.minTime) <= 0) {
      toast.error("Min Time must be positive.");
      return;
    }
    if (Number(formData?.maxTime) <= 0) {
      toast.error("Max Time must be positive.");
      return;
    }

    try {
      handleUpdate(selectedSchema.id, formData);
    } catch (error) {
      toast.error(error.response.data.message);
      console.log(error);
    }
  };

  // console.log("formData", formData);
  // console.log(selectedSchema);

  if (!editShowModal) return null;

  return (
    <AnimatePresence>
      <div
        className={`bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-md ${
          editShowModal ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 opacity-60"
          onClick={() => setEditShowModal(false)}
        ></div>
        <div className="dark:bg-slate-900 border-slate-200 dark:border-slate-700 relative m-2 transform overflow-hidden rounded-3xl border bg-white shadow-2xl sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Edit Schema</h2>
            <motion.button
              onClick={() => setEditShowModal(false)} // Close modal
              className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} className="text-white" />
            </motion.button>
          </div>

          <div className="p-3">
            <div className="sm:space-y-3">
              {/* Input for Schema Name */}
              <div className="flex flex-col justify-between sm:flex-row">
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
                    value={formData?.name}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>

                {/* Input for Compulsory Questions */}
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
                    placeholder="Per Page Time"
                    value={formData?.perPage}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              {/* Input for Maximum Marks */}
              <div className="flex flex-col justify-between sm:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="maxMarks"
                  >
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    id="maxMarks"
                    name="maxMarks"
                    value={formData?.maxMarks}
                    onChange={handleInputChange}
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
                    htmlFor="minMarks"
                  >
                    Minimum Marks
                  </label>
                  <input
                    type="number"
                    name="minMarks"
                    id="minMarks"
                    value={formData?.minMarks}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              {/* Input for Total Questions */}
              <div className="flex flex-col justify-between sm:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="totalQuestions"
                  >
                    Total Questions
                  </label>
                  <input
                    type="number"
                    name="totalQuestions"
                    id="totalQuestions"
                    value={formData?.totalQuestions}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>

                {/* Input for Compulsory Questions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="text-slate-700 mb-2 block text-sm font-medium"
                    htmlFor="compulsoryQuestions"
                  >
                    Compulsory Questions
                  </label>
                  <input
                    type="number"
                    name="compulsoryQuestions"
                    id="compulsoryQuestions"
                    value={formData?.compulsoryQuestions}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              <div className="flex flex-col justify-between sm:flex-row">
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
                    name="minTime"
                    id="minTime"
                    value={formData?.minTime}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>

                {/* Input for Compulsory Questions */}
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
                    id="minTime"
                    type="number"
                    name="maxTime"
                    value={formData?.maxTime}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    value={formData?.numberOfPage}
                    onChange={handleInputChange}
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
                    name="hiddenPage"
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
              </div>{" "}
              {/* Page Index Contains */}
              {formData?.hiddenPage?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex flex-col justify-between sm:flex-row">
                    <div className="border-slate-200 flex w-full flex-wrap gap-2 rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg">
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
                </motion.div>
              )}
              {/* Input for Evaluation Time */}
              {/* <div className="mb-2 sm:mb-0">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white sm:mb-2 sm:text-lg">
                  Evaluation Time (minutes)
                </label>
                <input
                  type="number"
                  name="evaluationTime"
                  value={formData.evaluationTime}
                  onChange={handleInputChange}
                  className="sm:text-md w-full rounded-md border border-gray-300 px-2 py-0.5 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                />
              </div> */}
            </div>

            {/* Update button */}
            <motion.button
              type="submit"
              disabled={loading}
              onClick={() => {
                validationCheck();
              }}
              className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Updating Schema...
                </span>
              ) : (
                "Update Schema"
              )}
            </motion.button>
            {/* <div className="flex justify-end sm:mt-6">
              {loading ? (
                <div
                  className={`flex items-center justify-center rounded-md px-3 py-1.5 text-white transition-colors sm:px-6 sm:py-3 ${
                    loading ? "bg-indigo-400" : "bg-indigo-600"
                  }`}
                >
                  <svg
                    className="mr-2 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Updating Schema...
                </div>
              ) : (
                <button
                  onClick={() => {
                    validationCheck();
                  }}
                  disabled={loading}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-white transition-colors hover:bg-indigo-700 sm:px-6 sm:py-3"
                >
                  Update Schema
                </button>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SchemaEditModal;
