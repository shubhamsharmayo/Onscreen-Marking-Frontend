import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AssignModelComp = ({ setassignModel, currentBookletDetails }) => {
  const [users, setUsers] = useState([]);
  const [manualModel, setManualModel] = useState(false);
  const [assignType, setAssignType] = useState(1);
  const [questionDefData, setQuestionDefData] = useState({ questions: [] });
  const [loading, setLoading] = useState(false);

  // Separate assignments for each role
  const [evaluatorAssignments, setEvaluatorAssignments] = useState({});
  const [reviewerAssignments, setReviewerAssignments] = useState({});

  const [assignRole, setAssignRole] = useState("evaluator");

  // Choose which state to use based on current role
  const assignments =
    assignRole === "evaluator" ? evaluatorAssignments : reviewerAssignments;

  const setAssignments =
    assignRole === "evaluator"
      ? setEvaluatorAssignments
      : setReviewerAssignments;

  // Fetch users (once)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users/get/usersFormanualAssign/${currentBookletDetails?.folderName}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUsers(res.data || []);
      } catch (err) {
        toast.error("Failed to load users");
      }
    };
    if (currentBookletDetails?.folderName) fetchUsers();
  }, [currentBookletDetails?.folderName]);

  // Fetch questions when switching to "By Questions"
  useEffect(() => {
    if (assignType !== 2) return;

    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/subjects/get/questions-by-folder/${currentBookletDetails?.subjectCode}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setQuestionDefData(res.data || { questions: [] });
      } catch (err) {
        toast.error("Failed to load questions");
      }
    };
    if (currentBookletDetails?.subjectCode) fetchQuestions();
  }, [assignType, currentBookletDetails?.subjectCode]);

  // ────────────────────────────────────────────────
  //  Validation: are ALL questions assigned for current role?
  // ────────────────────────────────────────────────
  const getAssignmentStatus = () => {
    const questions = questionDefData?.questions || [];
    if (questions.length === 0)
      return { allAssigned: false, count: 0, total: 0 };

    let count = 0;
    for (const q of questions) {
      const ass = assignments[q._id];
      if (ass?.userId && Number(ass.bookletCount) > 0) {
        count++;
      }
    }

    return {
      allAssigned: count === questions.length,
      count,
      total: questions.length,
    };
  };

  const { allAssigned, count: assignedCount, total } = getAssignmentStatus();

  const handleAssignAll = async () => {
    if (!allAssigned) {
      toast.warn(
        `Please assign ${assignRole} for all ${total} questions (${assignedCount}/${total} done)`
      );
      return;
    }

    const payload = questionDefData.questions.map((q) => {
      const a = assignments[q._id];
      return {
        questiondefinitionId: q._id,
        userId: a.userId,
        bookletsToAssign: Number(a.bookletCount),
        subjectCode: currentBookletDetails?.folderName,
        role: assignRole, // ← important: send role
      };
    });

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/create/task`,
        { assignments: payload }, // or change endpoint to bulk if you have one
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success(
        res.data.message || `All ${assignRole} assignments completed`
      );
      setassignModel(false);
    } catch (error) {
      console.error("Assign error:", error);
      toast.error(error?.response?.data?.message || "Failed to assign tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-black fixed inset-0 z-50 m-2 flex items-center justify-center bg-opacity-50 backdrop-blur-md">
        <div className="mx-3 w-full max-w-5xl rounded-xl bg-white shadow-2xl dark:bg-navy-700 dark:text-white sm:mx-6">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex w-full flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-bold">Assign Task</h2>

              <select
                className="h-10 w-44 rounded border px-3 text-sm dark:bg-navy-800"
                value={assignType}
                onChange={(e) => setAssignType(Number(e.target.value))}
              >
                <option value={1}>By Booklets</option>
                <option value={2}>By Questions</option>
              </select>

              <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  className={`px-5 py-2 text-sm font-semibold transition-colors ${
                    assignRole === "evaluator"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700"
                  }`}
                  onClick={() => setAssignRole("evaluator")}
                >
                  Evaluator
                </button>
                <button
                  className={`px-5 py-2 text-sm font-semibold transition-colors ${
                    assignRole === "reviewer"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700"
                  }`}
                  onClick={() => setAssignRole("reviewer")}
                >
                  Reviewer
                </button>
              </div>

              <h3 className="text-lg font-medium">
                Unallocated:{" "}
                <strong>{currentBookletDetails?.unAllocated ?? 0}</strong>
              </h3>
            </div>

            <button
              className="ml-4 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              onClick={() => setassignModel(false)}
            >
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <hr className="border-gray-200 dark:border-gray-600" />

          {/* Auto / Manual */}
          <div className="mt-6 flex justify-center gap-5 px-6">
            <button
              className="max-w-sm flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={loading}
              onClick={() => toast.info("Auto-assign not implemented yet")}
            >
              Auto Assign
            </button>
            <button
              className="max-w-sm flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              onClick={() => setManualModel(!manualModel)}
            >
              {manualModel ? "Hide Manual Assign" : "Manual Assign"}
            </button>
          </div>

          <hr className="my-6 border-gray-200 dark:border-gray-600" />

          {/* Manual – Questions mode */}
          {manualModel && assignType === 2 && (
            <div className="max-h-[58vh] overflow-y-auto px-6 pb-10">
              {questionDefData?.questions?.length === 0 ? (
                <p className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No questions loaded for this subject/folder
                </p>
              ) : (
                questionDefData.questions.map((item) => {
                  const ass = assignments[item._id] || {};
                  const maxAllowed =
                    (ass.remaining ?? 9999) <
                    (currentBookletDetails?.unAllocated ?? 0)
                      ? ass.remaining
                      : currentBookletDetails?.unAllocated ?? 0;

                  const isComplete = ass.userId && Number(ass.bookletCount) > 0;

                  return (
                    <div
                      key={item._id}
                      className={`mb-5 rounded-lg border p-5 transition-colors ${
                        isComplete
                          ? "dark:bg-green-950/30 border-green-400 bg-green-50 dark:border-green-700"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="mb-3 text-lg font-semibold">
                        {item.questionsName}
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <select
                          className="h-11 min-w-[220px] flex-1 rounded border px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-navy-800"
                          value={ass.userId || ""}
                          onChange={(e) => {
                            const user = users.find(
                              (u) => u.userId === e.target.value
                            );
                            if (!user) return;
                            setAssignments((prev) => ({
                              ...prev,
                              [item._id]: {
                                userId: user.userId,
                                remaining: user.remaining,
                                bookletCount:
                                  prev[item._id]?.bookletCount || "",
                              },
                            }));
                          }}
                        >
                          <option value="">Select {assignRole}</option>
                          {users.map((u) => (
                            <option
                             
                              key={u.userId}
                              value={u.userId}
                            >
                             {u.email.padEnd(30, " ")} {u.role}
                            </option>
                          ))}
                        </select>

                        {ass.userId && (
                          <select
                            className="h-11 w-36 rounded border px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-navy-800"
                            value={ass.bookletCount || ""}
                            onChange={(e) =>
                              setAssignments((prev) => ({
                                ...prev,
                                [item._id]: {
                                  ...prev[item._id],
                                  bookletCount:
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                },
                              }))
                            }
                          >
                            <option value="">Booklets</option>
                            {Array.from(
                              { length: Math.max(0, maxAllowed) },
                              (_, i) => i + 1
                            ).map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Assign Button */}
              {questionDefData?.questions?.length > 0 && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <button
                    className={`rounded-xl px-12 py-4 text-lg font-bold text-white transition ${
                      allAssigned && !loading
                        ? "bg-green-600 shadow-md hover:bg-green-700"
                        : "cursor-not-allowed bg-gray-400"
                    } disabled:opacity-70`}
                    disabled={loading || !allAssigned}
                    onClick={handleAssignAll}
                  >
                    {loading
                      ? "Assigning..."
                      : allAssigned
                      ? `Assign All ${total} as ${
                          assignRole.charAt(0).toUpperCase() +
                          assignRole.slice(1)
                        }`
                      : `Complete ${assignRole} assignments (${assignedCount}/${total})`}
                  </button>

                  {!allAssigned && assignedCount > 0 && (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Please assign a {assignRole} and booklet count for every
                      question
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
