import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ReassignModal = ({
  showReAssignModal,
  users,
  setShowReAssignModal,
  currentTask,
}) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [userTaskStatus, setUserTaskStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // booklet states
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // transfer states
  const [transferCount, setTransferCount] = useState(0);
  const [maxTransferCount, setMaxTransferCount] = useState(0);

  /* ------------------------------------------------
     FETCH CURRENT USER TASK STATUS
  ------------------------------------------------- */
  useEffect(() => {
    if (!showReAssignModal || !currentTask?.userId?._id) return;

    const fetchUserTaskStatus = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tasks/user/task-status/${currentTask.userId._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setUserTaskStatus(res.data);
      } catch (error) {
        console.error("Failed to fetch user task status", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTaskStatus();
  }, [showReAssignModal, currentTask]);

  /* ------------------------------------------------
     INITIALIZE COMPLETED / PENDING COUNTS
  ------------------------------------------------- */
  useEffect(() => {
    if (!userTaskStatus || !currentTask) return;

    const matchedTask = userTaskStatus.tasks.find(
      (task) => task.subjectCode === currentTask.subjectCode
    );

    if (matchedTask) {
      const completed = matchedTask.booklets.completed;
      const total = matchedTask.booklets.total;
      const pending = total - completed;

      setCompletedCount(completed);
      setPendingCount(pending);

      setTransferCount(completed); // default input value
      setMaxTransferCount(completed); // max allowed
    }
  }, [userTaskStatus, currentTask]);

  /* ------------------------------------------------
     HANDLE INPUT CHANGE (DYNAMIC PENDING UPDATE)
  ------------------------------------------------- */
  const handleTransferChange = (value) => {
    if (value < 1 || value > maxTransferCount) return;

    setTransferCount(value);
    setPendingCount(maxTransferCount - value);
  };

  /* ------------------------------------------------
     SUBMIT REASSIGN
  ------------------------------------------------- */
  const handleReassign = async () => {
    if (!selectedUserId || transferCount < 1) return;

    const token = localStorage.getItem("token");
    const decodedToken = JSON.parse(atob(token.split(".")[1]));

    const payload = {
      fromTaskId: currentTask._id,
      toUserId: selectedUserId,
      transferCount: transferCount,
      reassignedBy: decodedToken.userId,
    };

    try {
      setSubmitting(true);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/reassign/pending-booklets`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowReAssignModal(false);
    } catch (error) {
      console.error("Reassign failed", error);

      const message =
        error?.response?.data?.message ||
        "Reassignment failed. Please try again.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
    // window.location.reload();
  };

  if (!showReAssignModal || !currentTask) return null;

  /* ------------------------------------------------
     RENDER
  ------------------------------------------------- */
  return (
    <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-md">
      <div className="w-[460px] rounded-xl bg-white shadow-lg dark:bg-navy-700 dark:text-white">
        {/* HEADER */}
        <div className="flex justify-between border-b px-4 py-3">
          <h2 className="text-xl font-bold">Reassign Task</h2>
          <span
            className="cursor-pointer text-gray-600 hover:text-red-600"
            onClick={() => setShowReAssignModal(false)}
          >
            ✕
          </span>
        </div>

        {/* TASK INFO */}
        <div className="space-y-1 bg-gray-50 px-4 py-3 text-sm dark:bg-navy-800">
          <div>
            <strong>Assigned User:</strong> {currentTask.userId?.name} (
            {currentTask.userId?.email})
          </div>
        </div>

        {/* PROGRESS & PENDING (DYNAMIC) */}
        <div className="px-4 py-3 text-sm">
          <div>
            <strong>In Progress / Completed:</strong> {completedCount}
          </div>
          <div>
            <strong>Pending (after transfer):</strong> {pendingCount}
          </div>
        </div>

        {/* TRANSFER INPUT */}
        <div className="px-4 py-2">
          <label className="mb-1 block text-sm font-medium">
            Transfer Pending Booklets
          </label>

          <select
            value={transferCount}
            onChange={(e) => handleTransferChange(Number(e.target.value))}
            className="w-full rounded-lg border p-2 dark:bg-navy-700"
          >
            <option value="" disabled>
              Select count
            </option>

            {Array.from({ length: maxTransferCount }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>

          <p className="mt-1 text-xs text-gray-500">
            Max allowed: {maxTransferCount}
          </p>
        </div>

        {/* SELECT USER */}
        <div className="px-4 py-3">
          <label className="mb-1 block text-sm font-medium">Reassign To</label>
          <select
            className="w-full rounded-lg border p-2 dark:bg-navy-700"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* ACTION */}
        <div className="px-4 pb-4">
          <button
            // disabled={
            //   !selectedUserId ||
            //   submitting ||
            //   transferCount < 1 ||
            //   transferCount > maxTransferCount
            // }
            onClick={handleReassign}
            className="w-full rounded-md bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Reassigning..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReassignModal;
