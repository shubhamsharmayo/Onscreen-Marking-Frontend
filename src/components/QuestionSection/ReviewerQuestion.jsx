import React, { useEffect, useState } from "react";
import axios from "axios";
import CustomAddButton from "UI/CustomAddButton";
import IconButton from "@mui/material/IconButton";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { getQuestionSchemaById } from "components/Helper/Evaluator/EvalRoute";
import { postMarkById } from "components/Helper/Evaluator/EvalRoute";
import { useDispatch, useSelector } from "react-redux";
// import socket from "../../services/socket/socket";
import { io } from "socket.io-client";
import {
  setCurrentIcon,
  setIsDraggingIcon,
  setCurrentQuestion,
  setCurrentMarkDetails,
  setCurrentTaskDetails,
  setCurrentQuestionDefinitionId,
  setIsLoadingTrue,
  setIsLoadingFalse,
  setCurrentSubQuestionParentId,
} from "store/evaluatorSlice";
import socket from "../../services/socket/socket";
import { changeCurrentIndexById } from "components/Helper/Evaluator/EvalRoute";
import { setCurrentBookletIndex } from "store/evaluatorSlice";
import { generateNumbers } from "services/Evaluator/generateNumber";
import { submitBookletById } from "components/Helper/Evaluator/EvalRoute";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../../services/common";
function sortByQuestionsName(arr) {
  return arr.sort((a, b) => {
    return Number(a.questionsName) - Number(b.questionsName);
  });
}

const ReviewerQuestion = (props) => {
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [allQuestions, setAllQuestions] = useState([]);
  const [rotationStates, setRotationStates] = useState({});
  const [marked, setMarked] = useState(false);
  const [totalMarks, setTotalMarks] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRollbackModel, setshowRollbackModel] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  const evaluatorState = useSelector((state) => state.evaluator);
  const taskDetails = evaluatorState.currentTaskDetails;
  const [userData, setuserData] = useState([]);
  const currentBookletIndex = evaluatorState.currentBookletIndex;
  const currentQuestion = evaluatorState.currentQuestion;
  const currentAnswerPdfImageId = evaluatorState.currentAnswerPdfImageId;
  const currentBookletId = evaluatorState.currentBookletId;
  const currentParentId = evaluatorState.currentSubQuestionParentId;
  const currentTaskDetails = evaluatorState.currentTaskDetails;
  const marksStore = useSelector((state) => state.annotation.marksStore);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const {socket} = props
  console.log(currentBookletId);

  const sortByQuestionNumber = (a, b) => {
    const aParts = a.questionsName.split(".").map(Number);
    const bParts = b.questionsName.split(".").map(Number);

    const len = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < len; i++) {
      const diff = (aParts[i] || 0) - (bParts[i] || 0);
      if (diff !== 0) return diff;
    }

    return 0;
  };

  const sortedMarksData = [...(props.confirmationData?.marksData || [])].sort(
    sortByQuestionNumber
  );

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  useEffect(() => {
    console.log(props.confirmationData);
  }, [props.setsubmitModel, socket, props.submitModel]);

  // const rejectionReasons = [
  //   "Incorrect booklet uploaded",
  //   "Pages missing or unreadable",
  //   "Booklet not related to assigned task",
  //   "Other",
  // ];

  //  console.log({
  //     taskId,
  //     answerPdfId,
  //     userId: currentTaskDetails?.userId,
  //   });
  // useEffect(() => {
  //   if (allQuestions.length !== 0) {
  //     setCurrentQuestionDefinitionId(allQuestions[currentQuestion]._id);
  //   }
  //   console.log(allQuestions[currentQuestion]._id);
  // }, [allQuestions, currentQuestion]);
  // console.log(props.userTimerData);

  const handleSubmitConfirm = () => {
    if (!socket) return;

    const taskId = props.id;
    const answerPdfId = props.answerPdfDetailsId._id;

    socket.emit("get-marks-data", {
      taskId,
      answerPdfId,
      userId: currentTaskDetails?.userId,
    });

    props.setsubmitModel(true);
  };

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      props.setconfirmationData(data);
    };

    socket.on("updated-marks-data", handler);

    return () => socket.off("updated-marks-data", handler);
  }, [props.id, props.answerPdfDetailsId, socket]);

  console.log(props.confirmationData);

  useEffect(() => {
    const fetchQuestionDetails = async (answerPdfDetails, userId) => {
      // console.log(userId);
      try {
        socket.emit("get-questions", {
          taskId: answerPdfDetails.taskId,
          answerPdfId: answerPdfDetails._id,
          userId: userId,
        });

        // const response2 = await getQuestionSchemaById(
        //   answerPdfDetails.taskId,
        //   answerPdfDetails._id
        // );
        // console.log(response2);
        // const reducedArr = response2.reduce((total, item) => {
        //   return total + item.allottedMarks;
        // }, 0);
        // setTotalMarks(reducedArr);
        // console.log(reducedArr);
        // dispatch(
        //   setCurrentQuestionDefinitionId(response2[currentQuestion - 1]._id)
        // );

        // setAllQuestions(sortByQuestionsName(response2));
      } catch (error) {
        console.log(error);
      }
    };

    if (props.answerPdfDetails) {
      fetchQuestionDetails(
        props.answerPdfDetails,
        props.taskdetails.userId,
        props.taskdetails.questiondefinitionId
      );
    }
  }, [props.answerPdfDetails, marked, evaluatorState.rerender]);

  useEffect(() => {
    const allUsers = async () => {
      const response = await getAllUsers();
      console.log(response);
      setuserData(response);
    };
    allUsers();
  }, []);

  socket.on("questions-data", (data) => {
    console.log(data);
    setAllQuestions(sortByQuestionsName(data.marks));
    const reducedArr = data.marks
      .filter((item) => item.isSubQuestion === false)
      .reduce((total, item) => total + item.allottedMarks, 0);
    const total = data.marks
      .filter((item) => item.isSubQuestion === false)
      .reduce((total, item) => total + item.maxMarks, 0);
    setTotalMarks(reducedArr);
    props.settotalMarksToDisplay(reducedArr);
    props.setTotalMarks(total);
    const qID = data.marks.filter(
      (id) => parseFloat(id.questionsName) === currentQuestion
    );
    dispatch(setCurrentQuestionDefinitionId(qID._id));
    // console.log(qID);
  });

  const handleRejectSubmit = async () => {
    if (!selectedReason) {
      toast.warning("Please select a rejection reason");
      return;
    }

    if (selectedReason === "Other" && !otherReason.trim()) {
      toast.warning("Please enter rejection reason");
      return;
    }

    const token = localStorage.getItem("token");

    const payload = {
      answerPdfId: currentBookletId,
      taskId: taskDetails._id,
      userId: props.taskdetails.userId,
      reason: selectedReason === "Other" ? otherReason.trim() : selectedReason,
      rejectedAt: new Date().toISOString(),
    };

    try {
      setRejectLoading(true);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/rejectbooklet/${currentBookletId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(res.data?.message || "Assigned to Principal successfully");
      navigate("/reviewer/assignedtasks");
    } catch (error) {
      console.error("Assign to principal failed", error);
      toast.error(
        error?.response?.data?.message || "Failed to assign to principal"
      );
    }
  };

  const handleRotate = (index) => {
    setRotationStates({
      [index]: rotationStates[index] === 45 ? 0 : 45, // Toggle only the current index
    });
  };

  const handleListClick = async (item, mark, index) => {
    const { _id, answerPdfId, allottedMarks, maxMarks } = item;

    if (allottedMarks + mark > maxMarks) {
      alert("You have exceeded the maximum marks for this question");
      return;
    }
    const totalAllocatedMarks = allottedMarks + mark;
    try {
      const body = {
        questionDefinitionId: _id,
        answerPdfId: answerPdfId,
        allottedMarks: +mark,
        totalAllocatedMarks: totalAllocatedMarks,
        timerStamps: new Date().toLocaleString(),
      };
      dispatch(setCurrentQuestionDefinitionId(_id));
      dispatch(setCurrentMarkDetails(body));
      dispatch(setCurrentIcon("/check.png"));
      dispatch(setIsDraggingIcon(true));
      dispatch(setCurrentQuestion(parseFloat(item.questionsName)));
      // const response = await postMarkById(body);
      setMarked((prev) => !prev);
      setRotationStates({
        [index]: (rotationStates[index] = 0), // Toggle only the current index
      });
      // console.log(response);
    } catch (error) {}
  };
  // console.log(allQuestions);
  const QuestionData = allQuestions.map((item, index) => {
    const isRotated = rotationStates[index] === 45;
    const allotedMarks = item.allottedMarks;
    // console.log(item)
    const marks = generateNumbers(
      item.minMarks,
      item.maxMarks,
      item.marksDifference
    );
    const background =
      selectedQuestion === index
        ? allotedMarks !== 0
          ? "bg-green-300"
          : "bg-red-300"
        : allotedMarks === 0
        ? "bg-red-100"
        : "bg-green-100";
    // const background =
    //   allotedMarks !== 0
    //     ? selectedQuestion === index
    //       ? "bg-green-300" // Marks allocated and index matches
    //       : "bg-green-100" // Marks allocated and index doesn't match
    //     : selectedQuestion === index
    //     ? "bg-green-300" // No marks allocated but index matches
    //     : "bg-red-100"; // No marks allocated and index doesn't match
    const handleAllotZeroListClick = async (item, mark, index) => {
      const { _id, answerPdfId, allottedMarks } = item;

      try {
        const body = {
          questionDefinitionId: _id,
          answerPdfId: answerPdfId,
          allottedMarks: 0,
          timerStamps: new Date().toLocaleString(),
        };
        dispatch(setCurrentMarkDetails(body));
        dispatch(setCurrentIcon("/close.png"));
        dispatch(setIsDraggingIcon(true));
        dispatch(setCurrentQuestion(parseFloat(item.questionsName)));

        setMarked((prev) => !prev);
        setRotationStates({
          [index]: (rotationStates[index] = 0), // Toggle only the current index
        });
        // console.log(response);
      } catch (error) {}
      // console.log(item, mark);
    };

    return (
      <tr
        className={`h-16 border dark:border-gray-700 ${background} `}
        onClick={() => {
          setSelectedQuestion(index);
          dispatch(setCurrentQuestionDefinitionId(allQuestions[index]._id));
          dispatch(setCurrentQuestion(parseFloat(item.questionsName)));
          dispatch(
            setCurrentSubQuestionParentId(allQuestions[index].parentQuestionId)
          );
        }}
        key={index}
      >
        <th
          scope="row"
          className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
        >
          Q{item.questionsName}
        </th>
        <td className=" px-2 py-3">
          <div className="relative flex flex-row rounded-lg border  px-1 py-1">
            {!item.isSubQuestion && (
              <IconButton
                color={isRotated ? "warning" : "primary"}
                aria-label="add icon"
                onClick={() => handleRotate(index)}
                style={{
                  transform: `rotate(${isRotated ? 45 : 0}deg)`,
                  transition: "transform 0.3s ease-in-out",
                }}
              >
                <AddCircleOutlineIcon className="" />
              </IconButton>
            )}
            <input
              className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={allotedMarks}
              type="text"
            />
            {/* Modal */}
            {isRotated && !item.isSubQuestion && (
              <div
                className="absolute left--2 top-12 z-10 ml-2 w-24  rounded-md border border-gray-300 bg-white  shadow-lg"
                style={{
                  transform: "translateX(0)", // Position to the left of the button
                }}
              >
                <p className=" sticky top-0 bg-gray-200 text-center  text-sm text-gray-700">
                  {`Select Marks`}
                </p>
                <ul className=" h-full max-h-[300px]  overflow-y-auto text-sm text-gray-700">
                  {marks.map((mark, i) => {
                    return (
                      <li
                        onClick={() => handleListClick(item, mark, index)}
                        className="cursor-pointer border text-center hover:bg-gray-200 hover:text-blue-500" // Adds pointer cursor and hover effect
                        key={i}
                      >
                        {mark}
                      </li>
                    );
                  })}
                  <li
                    className="cursor-pointer border bg-gray-100 text-center font-bold hover:bg-gray-200 hover:text-red-500"
                    onClick={() => handleAllotZeroListClick(item, 0, index)} // Optional click action
                  >
                    Allot 0
                  </li>
                </ul>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  });

  // console.log(evaluatorState.isLoading);
  const handleNextBooklet = async () => {
    try {
      setIsLoadingTrue();

      // ✅ Step 1: Submit current booklet first
      const submitted = await submitCurrentBooklet();
      if (!submitted) return;

      const isLastBooklet =
        Number(taskDetails.currentFileIndex) >=
        Number(taskDetails.totalBooklets);

      // ✅ Step 2: If LAST booklet → just finish
      if (isLastBooklet) {
        navigate("/evaluator/assignedtasks");
        return;
      }

      // ✅ Step 3: Otherwise move to next booklet
      const taskId = taskDetails._id;
      const nextIndex = Number(taskDetails.currentFileIndex) + 1;

      const response = await changeCurrentIndexById(taskId, nextIndex);

      dispatch(setCurrentBookletIndex(response));
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoadingFalse();
    }
  };

  // console.log(evaluatorState.isLoading);
  const handlePrevBooklet = async () => {
    try {
      if (currentBookletIndex > 1) {
        setIsLoadingTrue();
        const taskId = taskDetails._id;
        const response = await changeCurrentIndexById(
          taskId,
          currentBookletIndex - 1
        );
        dispatch(setCurrentBookletIndex(currentBookletIndex - 1));
        // console.log(response);
      }
      // console.log(taskDetails);
      //
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingFalse();
    }
  };

  const submitCurrentBooklet = async () => {
    try {
      const remainingMinutes = Math.floor(props.remainingSecondsRef / 60);
      const timeTaken = props.userTimerData.totalTime - remainingMinutes;

      const res = await submitBookletById(
        currentBookletId,
        props.taskdetails.userId,
        timeTaken
      );

      if (!res.success) {
        toast.warning(res.message);
        return false;
      }

      toast.success(res.message);
      return true; // ✅ tell caller submit worked
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit booklet");
      return false;
    }
  };

  const rollback = async () => {
    console.log("ROLLBACK CLICKED");

    if (!selectedUser) {
      console.log("No user selected");
      return;
    }

    const obj = {
      assignments: [
        {
          evaluatorId: selectedUser,
          reviewerId: props.taskdetails.userId,
          subjectCode: props.taskdetails.subjectCode,
          questiondefinitionId: props.taskdetails.questiondefinitionId,
          bookletsToAssign: [currentBookletId],
        },
      ],
    };

    console.log("Payload:", obj);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/assign/reviewer-rollback`,
        obj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API success:", response.data);
    } catch (error) {
      console.log("API error:", error?.response?.data || error.message);
    }
  };

  const submitHandler = async () => {
    try {
      // remainingSecondsRef = seconds left
      const remainingMinutes = Math.floor(props.remainingSecondsRef / 60);

      // totalTime = total allowed time (minutes)
      const timeTaken = props.userTimerData.totalTime - remainingMinutes;

      const res = await submitBookletById(
        currentBookletId,
        props.taskdetails.userId,
        timeTaken // ✅ THIS IS 18 (example)
      );

      if (res.success) {
        toast.success(res.message);
        navigate("/evaluator/assignedtasks");
      } else {
        toast.warning(res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit booklet");
    }
  };

 const rollback = async () => {
  console.log("ROLLBACK CLICKED");

  if (!selectedUser) {
    console.log("No user selected");
    return;
  }

  const obj = {
    assignments: [
      {
        evaluatorId: selectedUser,
        reviewerId: props.taskdetails.userId,
        subjectCode: props.taskdetails.subjectCode,
        questiondefinitionId:
          props.taskdetails.questiondefinitionId,
        bookletsToAssign: [currentBookletId],
      },
    ],
  };

  console.log("Payload:", obj);

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/tasks/assign/reviewer-rollback`,
      obj,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("API success:", response.data);
  } catch (error) {
    console.log(
      "API error:",
      error?.response?.data || error.message
    );
  }
};


const handleAssignToPrincipal = async () => {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        questiondefinitionId: evaluatorState.currentQuestionDefinitionId,
        subjectCode: props.taskdetails?.subjectCode,
        reviewerid: props.taskdetails?.userId, // ✅ reviewerId = task.userId
        answerPdfId: currentBookletId,
      };

      console.log("Assign Payload:", payload);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/reviewer/rejectTask`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(res.data?.message || "Assigned to Principal successfully");
      navigate("/reviewer/assignedtasks");
    } catch (error) {
      console.error("Assign to principal failed", error);
      toast.error(
        error?.response?.data?.message || "Failed to assign to principal"
      );
    }
  };


  return (
    <div className="h-[100%] ">
      {/* <div className="flex  h-[7%] w-[100%]">
        <button
          type="button"
          className="mb-2  w-[50%] bg-[#33597a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#26445e] focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          onClick={handlePrevBooklet}
        >
          {"<"} Prev Booklet
        </button>
        <button
          type="button"
          className="mb-2  w-[100%] bg-[#33597a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#26445e] focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          onClick={handleNextBooklet}
        >
          Next Booklet {">"}
        </button>
      </div> */}

      <div className="relative h-[82%] overflow-hidden shadow-md sm:rounded-lg">
        {/* Scrollable content */}
        <div className="h-[calc(100%-4rem)] overflow-y-auto">
          {" "}
          {/* Adjust height as needed */}
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Q.No
                </th>
                <th scope="col" className="px-6 py-3">
                  Alloted Marks
                </th>
              </tr>
            </thead>
            <tbody>{QuestionData}</tbody>
          </table>
        </div>
        {/* Footer always visible */}
        <div className="bg-white dark:bg-gray-800">
          <table className="w-full">
            <tfoot>
              <tr className="h-4 bg-white dark:bg-gray-800">
                <th
                  scope="row"
                  className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                >
                  TOTAL
                </th>
                <td className="px-2 py-3">
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    value={totalMarks}
                    readOnly
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className=" mt-2 h-[10%]">
        <button
          type="button"
          onClick={handleAssignToPrincipal}
          className="mb-2 w-full border border-red-700 px-5 py-2.5 text-center text-sm font-medium text-red-700 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
        >
          Assign to Principal
        </button>

        <button
          type="button"
          disabled={
            props.remainingSecondsRef / 60 < props.userTimerData.minTime
          }
          onClick={() => setshowRollbackModel(true)}
          className={`w-full border px-5 py-2.5 text-center text-sm font-medium
    ${
      props.remainingSecondsRef / 60 < props.userTimerData.minTime
        ? "cursor-not-allowed border-green-700 bg-green-700 opacity-60"
        : "cursor-pointer bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300"
    }
    text-white focus:outline-none
  `}
        >
          RollBack to Evaluator
        </button>
        <button
          type="button"
          disabled={
            props.remainingSecondsRef / 60 < props.userTimerData.minTime
          }
          onClick={handleSubmitConfirm}
          className={`w-full border px-5 py-2.5 text-center text-sm font-medium
    ${
      props.remainingSecondsRef / 60 < props.userTimerData.minTime
        ? "cursor-not-allowed border-green-700 bg-green-700 opacity-60"
        : "cursor-pointer bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300"
    }
    text-white focus:outline-none
  `}
        >
          SUBMIT BOOKLET AND NEXT
        </button>
      </div>

      {showRollbackModel && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="w-[50%] rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Select User</h2>

            <div className="w-full rounded-lg border border-gray-300 bg-white p-3">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500"
              >
                <option value="">-- Select User --</option>

                {userData?.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* footer */}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setshowRollbackModel(false)}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>

              <button
                // disabled={!selectedUser}
               
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                onClick={rollback}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {props.submitModel && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="w-[50%] rounded-lg bg-white p-6 shadow-lg">
            <div className="w-full rounded-lg border border-gray-300 bg-white p-3">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Marks Summary
              </h3>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border px-3 py-2">Question No</th>
                    <th className="border px-3 py-2 text-center">Marks</th>
                    <th className="border px-3 py-2 text-center">Page No</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedMarksData.map((item) => {
                    const pageData = props.confirmationData?.marks?.find(
                      (m) => m.questionDefinitionId === item._id
                    );

                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        {/* Question Number */}
                        <td className="border px-3 py-2 font-medium text-gray-800">
                          Q{item.questionsName}
                        </td>

                        {/* Marks */}
                        <td className="border px-3 py-2 text-center">
                          <span
                            className={`font-semibold ${
                              item.allottedMarks > 0
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {item.allottedMarks}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            / {item.maxMarks}
                          </span>
                        </td>

                        {/* Page Number */}
                        <td className="border px-3 py-2 text-center text-gray-700">
                          {(pageData?.page ?? null) !== null
                            ? Number(pageData.page) - 1
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => props.setsubmitModel(false)}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleNextBooklet}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* {showRejectModal && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="w-[420px] rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Reject Booklet
            </h2>
            <div className="space-y-3">
              {rejectionReasons.map((reason, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-red-600"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
            {selectedReason === "Other" && (
              <textarea
                className="mt-4 w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Enter rejection reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
              />
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="mb-2 w-full border border-red-700 px-5 py-2.5 text-center text-sm font-medium text-red-700 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900"
              >
                Assign to Principal
              </button>

              <button
                onClick={handleRejectSubmit}
                disabled={rejectLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
              >
                {rejectLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default React.memo(ReviewerQuestion);
