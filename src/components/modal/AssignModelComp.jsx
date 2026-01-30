import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AssignModelComp = ({ setassignModel, currentBookletDetails }) => {
  const [users, setUsers] = useState([]);
  const [manualModel, setManualModel] = useState(false);
  const [assignType, setAssignType] = useState(1);
  const [questionDefData, setQuestionDefData] = useState({ questions: [] });
  const [questionAssignments, setQuestionAssignments] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch users once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users/get/usersFormanualAssign/${currentBookletDetails?.folderName}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setUsers(res.data || []);
      } catch (err) {
        toast.error("Failed to load users");
      }
    };
    if (currentBookletDetails?.folderName) {
      fetchUsers();
    }
  }, [currentBookletDetails?.folderName]);

  // Fetch questions when switching to "By Questions" mode
  useEffect(() => {
    if (assignType !== 2) return;

    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/subjects/get/questions-by-folder/${currentBookletDetails?.subjectCode}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setQuestionDefData(res.data || { questions: [] });
        // Optional: reset assignments when questions change
        setQuestionAssignments({});
      } catch (err) {
        toast.error("Failed to load questions");
      }
    };
    if (currentBookletDetails?.subjectCode) {
      fetchQuestions();
    }
  }, [assignType, currentBookletDetails?.subjectCode]);

  // ────────────────────────────────────────────────
  //  Check assignment status
  // ────────────────────────────────────────────────
  const getAssignmentStatus = () => {
    const questions = questionDefData?.questions || [];
    if (questions.length === 0) {
      return { allAssigned: false, assignedCount: 0, total: 0 };
    }

    let assignedCount = 0;

    for (const q of questions) {
      const ass = questionAssignments[q._id];
      if (ass?.userId && Number(ass.bookletCount) > 0) {
        assignedCount++;
      }
    }

    return {
      allAssigned: assignedCount === questions.length,
      assignedCount,
      total: questions.length,
    };
  };

  const { allAssigned, assignedCount, total } = getAssignmentStatus();

  const handleAssignAll = async () => {
    if (!allAssigned) {
      toast.warn(`Please assign all ${total} questions (${assignedCount}/${total} done)`);
      return;
    }

    const assignments = questionDefData.questions.map((q) => {
      const a = questionAssignments[q._id];
      return {
        questiondefinitionId: q._id,
        userId: a.userId,
        bookletsToAssign: Number(a.bookletCount),
        subjectCode: currentBookletDetails?.folderName,
      };
    });

    setLoading(true);

    try {
      // If your backend supports bulk → use /bulk endpoint
      // If not → you may need to send them one by one or adjust payload
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/create/task`, // ← change if you have bulk endpoint
        { assignments }, // backend must accept array
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success(res.data.message || "All questions assigned successfully!");
      setassignModel(false);
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error?.response?.data?.message || "Failed to assign tasks");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────
  return (
    <div>
      <div className="bg-black fixed inset-0 z-50 m-2 flex items-center justify-center bg-opacity-50 backdrop-blur-md">
        <div className="mx-3 w-full max-w-5xl rounded-xl bg-white shadow-2xl dark:bg-navy-700 dark:text-white sm:mx-6 lg:w-10/12">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex w-full items-center justify-between gap-4">
              <h2 className="text-3xl font-bold">Assign Task</h2>

              <select
                className="h-10 w-44 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-600 dark:bg-navy-800"
                value={assignType}
                onChange={(e) => setAssignType(Number(e.target.value))}
              >
                <option value={1}>By Booklets</option>
                <option value={2}>By Questions</option>
              </select>

              <h3 className="text-lg font-medium">
                Unallocated: <span className="font-bold">{currentBookletDetails?.unAllocated ?? 0}</span>
              </h3>
            </div>

            <button
              className="ml-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              onClick={() => setassignModel(false)}
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <hr className="border-gray-200 dark:border-gray-600" />

          {/* Auto / Manual buttons */}
          <div className="mt-6 flex justify-center gap-6 px-6">
            <button
              className="flex-1 max-w-xs rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={loading}
              onClick={() => {
                // ← your auto-assign logic here
                toast.info("Auto-assign not implemented in this version");
              }}
            >
              Auto Assign
            </button>

            <button
              className="flex-1 max-w-xs rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              onClick={() => setManualModel(!manualModel)}
            >
              {manualModel ? "Hide Manual" : "Manual Assign"}
            </button>
          </div>

          <hr className="my-6 border-gray-200 dark:border-gray-600" />

          {/* Manual Assign – By Questions */}
          {manualModel && assignType === 2 && (
            <div className="max-h-[60vh] overflow-y-auto px-6 pb-8">
              {questionDefData?.questions?.length === 0 ? (
                <p className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No questions found for this subject
                </p>
              ) : (
                questionDefData.questions.map((item) => {
                  const assignment = questionAssignments[item._id] || {};
                  const maxBooklets =
                    (assignment.remaining ?? Infinity) < (currentBookletDetails?.unAllocated ?? 0)
                      ? assignment.remaining
                      : currentBookletDetails?.unAllocated ?? 0;

                  const isAssigned = assignment.userId && Number(assignment.bookletCount) > 0;

                  return (
                    <div
                      key={item._id}
                      className={`mb-5 rounded-lg border p-5 shadow-sm transition-all ${
                        isAssigned
                          ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="mb-3 font-semibold">{item.questionsName}</div>

                      <div className="flex flex-wrap items-center gap-4">
                        <select
                          className="h-11 min-w-[220px] flex-1 rounded-lg border border-gray-300 px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-navy-800"
                          value={assignment.userId || ""}
                          onChange={(e) => {
                            const selected = users.find((u) => u.userId === e.target.value);
                            if (!selected) return;

                            setQuestionAssignments((prev) => ({
                              ...prev,
                              [item._id]: {
                                userId: selected.userId,
                                remaining: selected.remaining,
                                bookletCount: prev[item._id]?.bookletCount || "",
                              },
                            }));
                          }}
                        >
                          <option value="">Select User</option>
                          {users.map((u) => (
                            <option key={u.userId} value={u.userId}>
                              {u.email}
                            </option>
                          ))}
                        </select>

                        {assignment.userId && (
                          <select
                            className="h-11 w-36 rounded-lg border border-gray-300 px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-navy-800"
                            value={assignment.bookletCount || ""}
                            onChange={(e) =>
                              setQuestionAssignments((prev) => ({
                                ...prev,
                                [item._id]: {
                                  ...prev[item._id],
                                  bookletCount: e.target.value === "" ? "" : Number(e.target.value),
                                },
                              }))
                            }
                          >
                            <option value="">Booklets</option>
                            {Array.from({ length: Math.max(0, maxBooklets) }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Assign All Button Area */}
              {questionDefData?.questions?.length > 0 && (
                <div className="mt-10 flex flex-col items-center gap-4">
                  <button
                    className={`rounded-xl px-12 py-4 text-lg font-bold text-white transition-all ${
                      allAssigned && !loading
                        ? "bg-green-600 shadow-lg hover:bg-green-700"
                        : "cursor-not-allowed bg-gray-400"
                    } disabled:opacity-70`}
                    disabled={loading || !allAssigned}
                    onClick={handleAssignAll}
                  >
                    {loading
                      ? "Assigning..."
                      : allAssigned
                      ? `Assign All ${total} Questions`
                      : `Complete all assignments (${assignedCount}/${total})`}
                  </button>

                  {!allAssigned && assignedCount > 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Please assign a user and booklet count for every question
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignModelComp;