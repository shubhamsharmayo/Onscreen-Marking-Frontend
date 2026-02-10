import React, { useState, useEffect } from "react";
import { GiCrossMark } from "react-icons/gi";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, X } from "lucide-react";

const SchemaQuestion = ({
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
    perPage: "",
    maxTime: "",
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
        perPage: selectedSchema.perPage || "",
        maxTime: selectedSchema.maxTime || "",
        isActive: selectedSchema.isActive || true,
        status: false,
        numberOfPage: selectedSchema.numberOfPage || "",
        hiddenPage: selectedSchema.hiddenPage.map((item) => Number(item)) || [],
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
      !formData.compulsoryQuestions === "" ||
      // !formData.evaluationTime ||
      !formData.minTime ||
      !formData.maxTime ||
      !formData.perPage ||
      !formData?.numberOfSupplement === 0 ||
      !formData?.PageofSupplement === 0 ||
      !formData.numberOfPage ||
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
            <h2 className="text-2xl font-bold text-white">Update Schema</h2>
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
              {/* <div className="mb-2 sm:mb-0">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white sm:mb-2 sm:text-lg">
                  Schema Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData?.name}
                  onChange={handleInputChange}
                  className="sm:text-md w-72 rounded-md border border-gray-300 px-2 py-0.5 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:w-full sm:p-3"
                />
              </div> */}
              {/* Input for Maximum Marks */}
              <div className="flex flex-col justify-between sm:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    className="mb-2 block text-sm font-medium text-gray-800"
                    htmlFor="maxMarks"
                  >
                    Maximum Marks
                  </label>
                  <input
                    id="maxMarks"
                    type="number"
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
                    className="mb-2 block text-sm font-medium text-gray-800"
                    htmlFor="minMarks"
                  >
                    Minimum Marks
                  </label>
                  <input
                    id="minMarks"
                    type="number"
                    name="minMarks"
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
                    className="mb-2 block text-sm font-medium text-gray-800"
                    htmlFor="totalQuestions"
                  >
                    Total Questions
                  </label>
                  <input
                    id="totalQuestions"
                    type="number"
                    name="totalQuestions"
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
                    className="mb-2 block text-sm font-medium text-gray-800"
                    htmlFor="compulsoryQuestions"
                  >
                    Compulsory Questions
                  </label>
                  <input
                    id="compulsoryQuestions"
                    type="number"
                    name="compulsoryQuestions"
                    value={formData?.compulsoryQuestions}
                    onChange={handleInputChange}
                    className="border-slate-200 w-full rounded-xl border-2 bg-white/60 px-4 py-2 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                  />
                </motion.div>
              </div>
              {/* <div className="flex flex-col justify-between sm:flex-row">
                <div className="mb-2 sm:mb-0">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white sm:mb-2 sm:text-lg">
                    Min Time (in minutes):
                  </label>
                  <input
                    type="number"
                    name="minTime"
                    value={formData?.minTime}
                    onChange={handleInputChange}
                    className="sm:text-md w-full rounded-md border border-gray-300 px-2 py-0.5 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                  />
                </div>
                <div className="mb-2 sm:mb-0">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white sm:mb-2 sm:text-lg">
                    Max Time (in minutes):
                  </label>
                  <input
                    type="number"
                    name="maxTime"
                    value={formData?.maxTime}
                    onChange={handleInputChange}
                    className="sm:text-md w-full rounded-md border border-gray-300 px-2 py-0.5 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:p-3"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-between sm:flex-row">
              
                <div className="mb-2 sm:mb-0">
                  <label
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-white sm:mb-2 sm:text-lg"
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
                    className="sm:text-md w-72 rounded-md border border-gray-300 px-2 py-0.5 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:w-full sm:px-4 sm:py-2"
                  />
                </div>

                <div className="mb-2 sm:mb-0">
                  <label
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-white sm:mb-2 sm:text-lg"
                    htmlFor="hiddenPage"
                  >
                    Hidden Pages:
                  </label>
                  <select
                    id="hiddenPage"
                    name="hiddenPage"
                    value={selectedHiddenPage}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      if (!formData.hiddenPage.includes(value)) {
                        setFormData((prev) => ({
                          ...prev,
                          hiddenPage: [...prev.hiddenPage, value],
                        }));
                      }

                      setSelectedHiddenPage(""); 
                    }}
                    className="sm:text-md max-h-10 w-72 rounded-md border border-gray-300 px-2 py-0.5 text-sm shadow-sm focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white sm:w-full sm:px-4 sm:py-2"
                  >
                    <option value="" className="px-2 text-sm text-gray-400">
                      Select Hidden Pages
                    </option>
                    {Array.from({ length: formData?.numberOfPage }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>{" "}
              
              {formData?.hiddenPage?.length > 0 && (
                <div className="flex flex-col justify-between sm:flex-row">
                  <div className="flex w-full flex-wrap gap-2 rounded-md border border-gray-300 px-4 py-1 sm:py-3">
                    {formData?.hiddenPage?.map((item, index) => (
                      <div
                        key={index}
                        className="flex cursor-pointer items-center space-x-1 rounded-lg bg-green-800 px-4 py-2 text-sm text-white "
                        onClick={() => removeHiddenPageIndex(index)}
                      >
                        <span className="">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
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
                "Update Question"
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SchemaQuestion;
