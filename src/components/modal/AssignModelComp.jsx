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
      setassignModel(false)
       toast.success(response?.data.message);
    } catch (error) {
      console.log(error);
    } finally {
      setloading(false);
    }
  };

  const handleSubmitButton = async () => {
    try {
      setloading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/create/task`, // API endpoint
        {
          userId: numberOfBooklets.id,
          subjectCode: currentBookletDetails?.folderName,
          bookletsToAssign: numberOfBooklets.BookletToAssign,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Optionally handle the response if needed
      setassignModel(false)
      console.log("Task created successfully:", response?.data);
      toast.success(response?.data.message);
    } catch (error) {
      console.log(error);
      // Display a proper error message if the server responds with an error
      //   toast.error(error?.response?.data?.message || "An error occurred");
    } finally {
      setloading(false);
    }
  };

  return (
    <div>
      <div className="bg-black fixed inset-0 z-50 m-2 flex items-center justify-center bg-opacity-50 backdrop-blur-md">
        <div className="mx-3 w-full rounded-xl bg-white shadow-lg drop-shadow-md dark:bg-navy-700 dark:text-white sm:mx-6 md:w-2/3 lg:w-7/12 2xl:w-6/12">
          <div className="flex justify-between px-7 py-5">
            <div className="flex w-full items-center justify-around">
              <h2 className="font-bold" style={{ fontSize: "32px" }}>
                Assign Task
              </h2>
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
          {manualModel && (
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
                        console.log({
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
        </div>
      </div>
    </div>
  );
};

export default AssignModelComp;
