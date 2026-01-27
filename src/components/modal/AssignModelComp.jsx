import React, { useEffect, useState } from "react";
import { getAllUsers } from "../../services/common";
import axios from "axios";
import { toast } from "react-toastify";

const AssignModelComp = ({ setassignModel, currentBookletDetails }) => {
  const [user, setUser] = useState("");
  const [manualModel, setmanualModel] = useState(false);
  const [numberOfBooklets, setnumberOfBooklets] = useState("");
  const [loading, setloading] = useState(false);
  const [maxBookletNumber, setmaxBookletNumber] = useState(
    currentBookletDetails?.unAllocated
  );
  const [selectedBooklets, setSelectedBooklets] = useState({});
  const [questionDefData, setquestionDefData] = useState({});
  const [assignType, setassignType] = useState(1);
  const [questionAssignments, setQuestionAssignments] = useState({});
  console.log(currentBookletDetails);
  console.log(maxBookletNumber);

  useEffect(() => {
    try {
      const fetchUsers = async () => {
        const users = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users/get/usersFormanualAssign/${currentBookletDetails?.folderName}`
        );
        console.log(users);

        setUser(users?.data);
      };
      fetchUsers();
    } catch (error) {
      // console.log(error);
      toast.error(error);
    }
  }, [setassignModel]);
  // console.log(user);

  const handleAutoAssign = () => {
    console.log(currentBookletDetails?.folderName);

    try {
      setloading(true);
      const response = axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/autoassign/task`,
        {
          subjectCode: currentBookletDetails?.folderName,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // console.log(response?.data)
      setassignModel(false);
      toast.success(response?.data.message);
    } catch (error) {
      console.log(error);
    } finally {
      setloading(false);
    }
  };

  const handleSubmitButton = async (questionId) => {
    const data = questionAssignments[questionId];
    console.log(questionId);
    try {
      setloading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/create/task`, // API endpoint
        assignType === 1
          ? {
              userId: numberOfBooklets.id,
              subjectCode: currentBookletDetails?.folderName,
              bookletsToAssign: numberOfBooklets.BookletToAssign,
            }
          : {
              questiondefinitionId: questionId,
              userId: data.userId,
              bookletsToAssign: data.bookletCount,
              subjectCode: currentBookletDetails?.folderName,
            },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Optionally handle the response if needed

      setassignModel(false);
      toast.success(response?.data.message);
    } catch (error) {
      console.log(error);
      // Display a proper error message if the server responds with an error
      //   toast.error(error?.response?.data?.message || "An error occurred");
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    try {
      const fetchUsers = async () => {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/subjects/get/questions-by-folder/${currentBookletDetails?.subjectCode}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log(response);

        setquestionDefData(response?.data);
      };
      fetchUsers();
    } catch (error) {
      // console.log(error);
      toast.error(error);
    }
  }, [assignType]);

  // const handleQuestionAssign = async (questionId) => {
  //   const data = questionAssignments[questionId];

  //   if (!data?.userId || !data?.bookletCount) {
  //     toast.error("Please select user and booklet count");
  //     return;
  //   }

  //   try {
  //     setloading(true);

  //     const payload = {
  //       questionDefinationId: questionId,
  //       userId: data.userId,
  //       bookletsToAssign: data.bookletCount,
  //       subjectCode: currentBookletDetails?.folderName,
  //     };

  //     // const response = await axios.post(
  //     //   `${process.env.REACT_APP_API_URL}/api/tasks/create/question-task`,
  //     //   payload,
  //     //   {
  //     //     headers: {
  //     //       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //     //     },
  //     //   }
  //     // );

  //     // toast.success(response?.data?.message || "Assigned successfully");

  //     console.log(payload);
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Assignment failed");
  //   } finally {
  //     setloading(false);
  //   }
  // };

  return (
    <div>
      <div className="bg-black fixed inset-0 z-50 m-2 flex items-center justify-center bg-opacity-50 backdrop-blur-md">
        <div className="mx-3 w-full rounded-xl bg-white shadow-lg drop-shadow-md dark:bg-navy-700 dark:text-white sm:mx-6 md:w-2/3 lg:w-7/12 2xl:w-6/12">
          <div className="flex justify-between px-7 py-5">
            <div className="flex w-full items-center justify-around">
              <h2 className="font-bold" style={{ fontSize: "32px" }}>
                Assign Task
              </h2>
              <select
                className="bg-transparent h-10 w-[1/2] overflow-auto rounded-lg border border-gray-300 px-2 text-sm text-gray-700 focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                onChange={(e) => {
                  setassignType(Number(e.target.value));
                  console.log(Number(e.target.value));
                }}
              >
                <option value="1">By Booklets</option>
                <option value="2">By Questions</option>
              </select>
              <h3>Unallocated : {currentBookletDetails?.unAllocated}</h3>
            </div>
            <div
              className="cursor-pointer text-gray-600"
              onClick={() => {
                setassignModel(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
          </div>
          <hr className="bg-gray-600" />
          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="flex w-full items-center  justify-between gap-2 px-1 3xl:gap-2">
              <button
                class={`text-md  my-2 mb-3 w-full rounded-md bg-indigo-600 px-2 py-1 font-bold text-white hover:bg-indigo-700 sm:px-6
                     `}
                onClick={() => handleAutoAssign()}
              >
                Auto Assign
              </button>
              <button
                class={`text-md  my-2 mb-3 w-full rounded-md bg-indigo-600 px-2 py-1 font-bold text-white hover:bg-indigo-700 sm:px-6
                     `}
                onClick={() => setmanualModel(!manualModel)}
              >
                Manual Assign
              </button>
            </div>

            <div></div>
          </div>
          <hr className="bg-gray-600" />
          {manualModel && assignType === 1 && (
            <div>
              {user &&
                user?.map((x) => (
                  <div className="m-5 flex justify-around">
                    <div>{x.email}</div>
                    <select
                      className="bg-transparent h-10 w-[1/2] overflow-auto rounded-lg border border-gray-300 px-2 text-sm text-gray-700 focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                      onChange={(e) => {
                        setnumberOfBooklets({
                          BookletToAssign: e.target.value,
                          id: x.userId,
                        });
                      }}
                    >
                      <option value="">Select Number</option>

                      {Array.from(
                        {
                          length:
                            x.remaining < currentBookletDetails?.unAllocated
                              ? x.remaining
                              : currentBookletDetails?.unAllocated,
                        },
                        (_, i) => i + 1
                      ).map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                    <div>
                      <button
                        className={`text-md  my-2 mb-3 w-full rounded-md bg-indigo-600 px-2 py-1 font-bold text-white hover:bg-indigo-700 sm:px-6
                     `}
                        onClick={() => handleSubmitButton()}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {manualModel && assignType === 2 && (
            <div className="max-h-[500px] overflow-y-auto pr-2">
              {questionDefData?.questions?.map((item) => (
                <div
                  key={item._id}
                  className="mb-3 flex justify-around rounded-lg border bg-white p-4 shadow-sm dark:bg-navy-900"
                >
                  <div className="mb-2 text-sm font-medium">
                    {item.questionsName}
                  </div>

                  {/* USER SELECT */}
                  <select
                    className="bg-transparent h-10 w-[1/2] overflow-auto rounded-lg border border-gray-300 px-2 text-sm text-gray-700 focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                    onChange={(e) => {
                      const selectedUser = user.find(
                        (u) => u.userId === e.target.value
                      );

                      if (!selectedUser) return;

                      setQuestionAssignments((prev) => ({
                        ...prev,
                        [item._id]: {
                          userId: selectedUser.userId,
                          remaining: selectedUser.remaining,
                          bookletCount: "",
                        },
                      }));
                    }}
                  >
                    <option value="">Select User</option>
                    {user.map((u) => (
                      <option key={u.userId} value={u.userId}>
                        {u.email}
                      </option>
                    ))}
                  </select>

                  {/* BOOKLET SELECT */}
                  {questionAssignments[item._id]?.userId && (
                    <select
                      className="bg-transparent h-10 w-[1/2] overflow-auto rounded-lg border border-gray-300 px-2 text-sm text-gray-700 focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                      onChange={(e) => {
                        setQuestionAssignments((prev) => ({
                          ...prev,
                          [item._id]: {
                            ...prev[item._id],
                            bookletCount: Number(e.target.value),
                          },
                        }));
                      }}
                    >
                      <option value="">Select Booklets</option>

                      {Array.from(
                        {
                          length:
                            questionAssignments[item._id].remaining <
                            currentBookletDetails?.unAllocated
                              ? questionAssignments[item._id].remaining
                              : currentBookletDetails?.unAllocated,
                        },
                        (_, i) => i + 1
                      ).map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    className="mt-3 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700
             disabled:opacity-50 sm:w-32"
                    disabled={
                      !questionAssignments[item._id]?.userId ||
                      !questionAssignments[item._id]?.bookletCount
                    }
                    onClick={() => handleSubmitButton(item._id)}
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignModelComp;
