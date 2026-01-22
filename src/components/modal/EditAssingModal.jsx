import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const EditAssingModal = ({
  setShowEditModal,
  currentTask,
  setShowTaskModal,
  setCurrentTask,
  updateTaskInParent,
}) => {
  const [taskName, setTaskName] = useState(currentTask?.taskName);
  const [totalFiles, setTotalFiles] = useState(currentTask?.totalBooklets);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    setTaskName(currentTask?.taskName);
    setTotalFiles(currentTask?.totalBooklets);
  }, [currentTask]);

  const handleSubmitButton = async () => {
    if (!totalFiles || totalFiles <= 0) {
      toast.error("Total files must be greater than 0");
      return;
    }

    // ⚠️ PAYLOAD REMAINS SAME (AS REQUESTED)
    const updatedTask = {
      ...currentTask,
      taskName,
      totalBooklets: totalFiles,
      userId: currentTask.userId?._id || currentTask.userId,
    };

    try {
      setLoader(true);

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tasks/edit/task/${currentTask._id}`,
        updatedTask,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update UI after success
      updateTaskInParent({
        ...currentTask,
        totalBooklets: totalFiles,
      });

      toast.success("Task updated successfully");

      setShowEditModal(false);
      setShowTaskModal(false);
      setCurrentTask({});
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Error updating task");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50 backdrop-blur-md">
      <div className="m-2 w-full max-w-md rounded-lg bg-white p-4 shadow-xl dark:bg-navy-700 sm:p-8">
        <h3 className="mb-6 text-center text-2xl font-semibold text-indigo-800 dark:text-white">
          Edit Task
        </h3>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white sm:text-lg">
              Subject Code
            </label>
            <input
              type="text"
              value={currentTask?.subjectCode || ""}
              disabled
              className="mt-2 w-full rounded-md border-gray-300 px-4 py-2 text-sm dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white sm:text-lg">
              Total Files
            </label>
            <input
              type="number"
              value={totalFiles}
              onChange={(e) => setTotalFiles(Number(e.target.value))}
              className="mt-2 w-full rounded-md border px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 dark:bg-navy-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => setShowEditModal(false)}
            className="rounded-md bg-red-500 px-6 py-2 font-medium text-white hover:bg-red-600"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmitButton}
            disabled={loader}
            className="rounded-md bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {loader ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAssingModal;
