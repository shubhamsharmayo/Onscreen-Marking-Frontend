// CheckModule.jsx (complete file)
import React, { useCallback, useEffect, useRef, useState } from "react";
import ImageContainer from "components/Imagecontainer/ImageContainer";
import { getUserDetails } from "services/common";
import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import Dropdown from "components/dropdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReviewerQuestion from "components/QuestionSection/ReviewerQuestion";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../store/authSlice";
import avatar from "assets/img/avatars/avatar4.png";
import {
  setIndex,
  setBaseImageUrl,
  setCurrentTaskDetails,
  setCurrentAnswerPdfImageId,
  setCurrentAnswerPdfId,
  setCurrentBookletId,
} from "store/evaluatorSlice";
import ProgressBar from "./ProgressBar";
import {
  getTaskById,
  getAnswerPdfById,
  updateAnswerPdfById,
  submitImageById,
} from "components/Helper/Reviewer/ReviewerRoute";
import { setCurrentBookletIndex } from "store/evaluatorSlice";
import EvalQuestionModal from "components/modal/EvalQuestionModal";
import LineLoader from "UI/LineLoader/LineLoader";
import { io } from "socket.io-client";
import useInactivityLogout from "../../../hook/InactivityTracker";
import { toast } from "react-toastify";
import axios from "axios";
// import socket from '../../../services/socket/socket'
const CheckModule = () => {
  const [answerSheetCount, setAnswerSheetCount] = useState(null);
  const [answerImageDetails, setAnswerImageDetails] = useState([]);
  const [answerPdfDetails, setAnswerPdfDetails] = useState(null);
  const [showloader, setShowLoader] = useState(false);
  const [imageObj, setImageObj] = useState(null);
  const [taskdetails, settaskdetails] = useState({});
  const [totalMarksToDisplay, settotalMarksToDisplay] = useState(null);
  const [TotalMarks, setTotalMarks] = useState(null);
  const hasInitializedIndex = useRef(false);
  const [submitModel, setsubmitModel] = useState(false);
  const [evalToRevData, setevalToRevData] = useState([]);
  console.log(taskdetails);

  // Local timer display string (HH:MM:SS)
  const [remainingTimeStr, setRemainingTimeStr] = useState("00:00:00");
  // numeric seconds remaining from server
  const remainingSecondsRef = useRef(null);
  const pageTimer = useRef(null);
  // server paused flag
  const isPausedRef = useRef(true);
  // interval id for local ticking
  const tickIntervalRef = useRef(null);
  const PagetickIntervalRef = useRef(null);

  const [timeInSeconds, settimeInSeconds] = useState(0);

  const evaluatorState = useSelector((state) => state.evaluator);
  const currentIndex = evaluatorState.currentIndex;
  // console.log(currentIndex);
  const taskDetails = evaluatorState?.currentTaskDetails;
  const currentBookletIndex = evaluatorState.currentBookletIndex;
  const currentAnswerPdfId = evaluatorState.currentAnswerPdfId;
  const icons = evaluatorState.icons;
  const rerenderer = evaluatorState.rerender;
  const currentTaskDetails = evaluatorState.currentTaskDetails;
  const { id } = useParams();
  const [userTimerData, setuserTimerData] = useState({});
  const [pageTimerCount, setpageTimerCount] = useState("00:00:00");
  const [blankCheck, setblankCheck] = useState(false);
  const [confirmationData, setconfirmationData] = useState({
    marks: [],
    marksData: [],
  });

  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [questionDef, setquestionDef] = useState({});

  // console.log(totalMarksToDisplay);
  // console.log(TotalMarks);
  // token MUST be defined before socket connect code
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // ---------- Helper: format seconds -> HH:MM:SS ----------
  const formatSeconds = (tot) => {
    if (tot == null || isNaN(tot)) return "00:00:00";
    const s = Math.max(0, Math.floor(tot));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // ---------- Start/stop local ticking ----------
  const startLocalTick = useCallback(() => {
    clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = setInterval(() => {
      // decrement local seconds
      if (
        typeof remainingSecondsRef.current === "number" &&
        !isPausedRef.current
      ) {
        remainingSecondsRef.current = Math.max(
          0,
          remainingSecondsRef.current + 1
        );
        setRemainingTimeStr(formatSeconds(remainingSecondsRef.current));
        settimeInSeconds(remainingSecondsRef.current);
      }
    }, 1000);
  }, []);
  const startLocalTickPage = useCallback(() => {
    if (PagetickIntervalRef.current) return;
    pageTimer.current = 0;
    PagetickIntervalRef.current = setInterval(() => {
      // decrement local seconds
      if (typeof pageTimer.current === "number") {
        pageTimer.current = Math.max(0, pageTimer.current + 1);
        setpageTimerCount(formatSeconds(pageTimer.current));
      }
    }, 1000);
  }, []);

  const stopLocalTickPage = useCallback(() => {
    if (PagetickIntervalRef.current) {
      clearInterval(PagetickIntervalRef.current);
      PagetickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (blankCheck) {
      stopLocalTickPage(); // ⛔ stop timer
    } else {
      startLocalTickPage(); // ▶ resume timer
    }
  }, [
    blankCheck,
    startLocalTickPage,
    stopLocalTickPage,
    evaluatorState.currentIndex,
  ]);

  useEffect(() => {
    return () => {
      stopLocalTickPage();
    };
  }, [evaluatorState.currentIndex, stopLocalTickPage]);
  // console.log(pageTimerCount);

  // const stopLocalTick = useCallback(() => {
  //   if (tickIntervalRef.current) {
  //     clearInterval(tickIntervalRef.current);
  //     tickIntervalRef.current = null;
  //   }
  // }, []);

  // ---------- Socket: register handlers once, emit where needed ----------
  useEffect(() => {
    if (!id || !answerPdfDetails || socket) return;

    const taskId = id;
    const answerPdfId = answerPdfDetails._id;

    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    newSocket.on("room-joined", (data) => {
      console.log("room-joined:", data);
    });

    newSocket.on("start-timer-update", (data) => {
      // console.log("⏱ Received start-timer-update:", data);

      remainingSecondsRef.current = data.remainingTime * 60;
      setuserTimerData(data);
      isPausedRef.current = false;
      // console.log(data);
      // Start ticking as soon as we get timer
      startLocalTick();
    });
    newSocket.on("connect", () => {
      // console.log("Socket connected:", newSocket.id);

      newSocket.emit("join-timerRoom", { taskId });
      newSocket.emit("start-evaluation", { taskId, answerPdfId });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id, answerPdfDetails, token]);

  // console.log(remainingSecondsRef.current);
  useEffect(() => {
    if (!socket || !id || !answerPdfDetails) return;

    const taskId = id;
    const answerPdfId = answerPdfDetails._id;

    const intervalId = setInterval(() => {
      const remainingTime = remainingSecondsRef.current / 60;

      if (typeof remainingTime === "number") {
        socket.emit("timer-update", {
          taskId,
          answerPdfId,
          remainingTime,
        });

        // console.log("📤 Sent timer update:", {
        //   taskId,
        //   answerPdfId,
        //   remainingTime,
        // });
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [socket, id, answerPdfDetails]);

  useEffect(() => {
    if (!socket) return;

    const handleAnnotations = (data) => {
      // console.log("Annotations:", data);
    };

    socket.on("annotations-updated", handleAnnotations);

    // Cleanup
    return () => {
      socket.off("annotations-updated", handleAnnotations);
    };
  }, [socket]);

  useInactivityLogout(() => {
    dispatch(logout());
    navigate("/auth/sign-in");
  });

  //   useEffect(() => {
  //   if (!id || !answerPdfDetails || !socket) return;

  //   const taskId = id;
  //   const answerPdfId = answerPdfDetails._id;

  //   // ✅ emit request
  //   socket.emit("get-marks-data", {
  //     taskId,
  //     answerPdfId,
  //     userId: currentTaskDetails?.userId,
  //   });

  //   // ✅ named handler
  //   const handleFinalMarksData = (data) => {
  //     console.log("final-marks-data:", data);
  //     setconfirmationData(data);
  //   };

  //   // ✅ register listener
  //   socket.on("final-marks-data", handleFinalMarksData);

  //   // ✅ cleanup (VERY IMPORTANT)
  //   return () => {
  //     socket.off("final-marks-data", handleFinalMarksData);
  //   };

  // }, [id, answerPdfDetails, submitModel, socket]);

  // console.log(confirmationData)

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskDetails?._id) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tasks/getReassignedBooklets/${taskDetails._id}`
        );
        setevalToRevData(response?.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch reassigned booklets", err);
      }
    };

    fetchTaskData();
  }, [taskDetails]);
  console.log(evalToRevData);

  console.log({
    taskId: evalToRevData[0]?.toTaskId,
    userId: evalToRevData[0]?.toUserId,
    evaluatorId: evalToRevData[0]?.fromUserId,
    answerPdfId: answerPdfDetails?._id,
    page: currentIndex,
  });
  useEffect(() => {
    if (!socket) {
      return;
    }

    const payload = {
      taskId: evalToRevData[0]?.toTaskId,
      userId: evalToRevData[0]?.toUserId,
      evaluatorId: evalToRevData[0]?.fromUserId,
      answerPdfId: answerPdfDetails?._id,
      page: currentIndex,
    };
    console.log("socket.connected =", socket.connected);
    console.log("🔥 EMITTING fetch-reviewerData", payload);
    socket.emit("fetch-reviewerData", payload);
  }, [socket, currentIndex, evalToRevData, answerPdfDetails]);

  console.log(taskDetails);
  // -----------------------------------------------------------------
  // Keep your existing data-fetching useEffects — only change: after
  // fetch of task and answerPdfDetails the socket useEffect above will run.
  // -----------------------------------------------------------------
  useEffect(() => {
    const getTaskDetails = async () => {
      try {
        setShowLoader(true);
        const response = await getTaskById(id);
        console.log(response);
        if (response?.status === "active") {
          toast.warning(response?.message || "This task is already active.");
          navigate("/reviewer/assignedtasks"); // or wherever you want to send back
          return; // ❗ STOP further execution
        }
        console.log(response?.task);
        settaskdetails(response?.task);
        const {
          answerPdfDetails,
          extractedBookletPath,
          task,
          questionImagesFolderUrl,
          questionDef,
          questionImages,
        } = response;
        setquestionDef(questionDef);
        setAnswerPdfDetails(answerPdfDetails);
        dispatch(setCurrentAnswerPdfId(answerPdfDetails._id));
        dispatch(setCurrentTaskDetails(task));
        dispatch(setCurrentBookletIndex(task.currentFileIndex));
        dispatch(setCurrentBookletId(answerPdfDetails._id));
        dispatch(setBaseImageUrl(questionImagesFolderUrl));
        setAnswerSheetCount(answerPdfDetails);
      } catch (error) {
        console.log(error);
      } finally {
        setShowLoader(false);
      }
    };
    if (id) getTaskDetails();
  }, [id, dispatch]);

  console.log(answerImageDetails);

  useEffect(() => {
    if (
      hasInitializedIndex.current ||
      !answerImageDetails?.length ||
      !answerImageDetails[0]?.name
    ) {
      return;
    }

    const index = answerImageDetails[0].name.split("_")[1].split(".")[0];
    console.log(index);
    dispatch(setIndex({ index }));

    hasInitializedIndex.current = true; // ✅ lock it forever
  }, [answerImageDetails, dispatch]);

  console.log(evaluatorState.currentIndex);

  useEffect(() => {
    const getEvaluatorTasks = async (taskId) => {
      try {
        const res = await getAnswerPdfById(taskId);
        // dispatch(
        //   setCurrentAnswerPdfImageId(res[evaluatorState.currentIndex]._id)
        // );
        setAnswerImageDetails(res);
        // console.log(res);
      } catch (error) {
        console.log(error);
      }
    };
    if (answerSheetCount) {
      getEvaluatorTasks(answerSheetCount._id);
    }
    if (icons.length > 0) {
      getEvaluatorTasks(answerSheetCount?._id);
    }
  }, [
    evaluatorState.currentIndex,
    answerSheetCount,
    rerenderer,
    dispatch,
    icons,
  ]);

  // console.log(answerPdfDetails)
  // console.log(currentTaskDetails)

  const isDisabled = pageTimer.current > 15 || blankCheck;

  // ---- Image icons & handling (unchanged) ----
  const svgFiles = [
    "/pageicons/red.png",
    "/pageicons/green.png",
    "/pageicons/yellow.png",
  ];
  const Imgicons = answerImageDetails.map((item, index) => {
    const isActive =
      String(item.name.split("_")[1].split(".")[0]) ===
      String(evaluatorState.currentIndex);
    // console.log(item.name.split("_")[1].split(".")[0])
    // console.log(evaluatorState.currentIndex)

    const statusBgMap = {
      notVisited: "bg-red-200",
      visited: "bg-yellow-200",
      submitted: "bg-green-200",
    };

    const bgClass = statusBgMap[item.status] || "bg-gray-200";

    return (
      <div
        key={index}
        onClick={() => {
          if (!isDisabled) {
            toast.warning("spend atleast 15 seconds");
            return;
          }

          handleUpdateImageDetail(item, index);
        }}
        className={`
        my-1 flex h-[8rem] w-[5rem] cursor-pointer
        flex-wrap items-center justify-center rounded
        py-2 text-center transition-colors duration-200

        ${bgClass}
        ${isActive ? "border-[4px] border-gray-800" : "border border-gray-300"}
      `}
      >
        <div>{index + 1}</div>
      </div>
    );
  });

  const handleUpdateImageDetail = async (item, index) => {
    // console.log(item, currentIndex);
    try {
      if (item.status === "notVisited") {
        await updateAnswerPdfById(item._id, "visited");
      }
      const obj = {
        image: "captured_image.png",
        imageName: item.name,
        bookletName: answerPdfDetails.answerPdfName,
        subjectCode: currentTaskDetails.subjectCode,
      };
      setImageObj(obj);
      dispatch(setCurrentAnswerPdfImageId(item._id));
      // const name =  item.name.split("_")[1].split(".")[0];
      // console.log(name)
      dispatch(setIndex({ index: item.name.split("_")[1].split(".")[0] }));

      const onImageCaptured = async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append("image", blob, "captured_image.png");
          formData.append("imageName", item.name);
          formData.append("bookletName", answerPdfDetails.answerPdfName);
          formData.append("subjectCode", currentTaskDetails.subjectCode);
          await submitImageById(formData);
        } else {
          console.error("Failed to capture the image");
        }
      };
      onImageCaptured();

      setTimeout(() => {
        const btn = document.getElementById("download-png");
        if (btn) btn.click();
      }, 500);
    } catch (error) {
      console.log(error);
    }
  };

  // console.log( currentIndex )

  // ---------- user/profile fetching - unchanged ----------
  const [darkmode, setDarkmode] = useState(false);
  const [userDetails, setUserDetails] = useState("");
  const [questionModal, setShowQuestionModal] = useState(false);
  const authState = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUserDetails(token);
        setUserDetails(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    if (authState.isAuthenticated !== undefined) fetchData();
  }, [authState.isAuthenticated, token]);

  // console.log(blankCheck)

  // ---------- Render ----------
  if (showloader) {
    return (
      <div className="bg-transparent flex h-screen items-center justify-center">
        <LineLoader />
      </div>
    );
  } else {
    return (
      <>
        <div className="to-black text-black flex h-[10vh] w-[100vw] items-center justify-around bg-gradient-to-r from-white py-5">
          <div>
            <img src="/ios.png" alt="ios_default" />
          </div>
          <div className="flex w-[70%] items-center justify-between rounded-sm py-1 text-lg font-bold backdrop-blur-2xl">
            <section className="flex-1 basis-1/3 space-y-1 overflow-hidden px-4">
              <div className="truncate">
                <span className="text-black font-semibold">Evaluator ID</span>:{" "}
                <span className="text-black font-bold">46758390</span>
              </div>
              <div className="truncate">
                <span className="text-black font-semibold">Subject</span>:{" "}
                <span className="text-black font-bold">
                  {taskDetails?.subjectCode}
                </span>
              </div>
            </section>

            <section className="flex-1 basis-1/3 space-y-1 overflow-hidden px-4 text-center">
              <div className="truncate">
                <span className="text-black mr-1 font-semibold">
                  Current Booklet Index
                </span>
                :{" "}
                <span className="text-black font-bold">
                  {taskDetails?.currentFileIndex || "N/A"} of{" "}
                  {taskDetails?.totalBooklets}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <ProgressBar
                  value={totalMarksToDisplay}
                  max={userTimerData?.maxMarks}
                  min={userTimerData?.minMarks}
                />
                <span>
                  {totalMarksToDisplay}/{userTimerData?.maxMarks}
                </span>
              </div>
            </section>

            <section className="flex-1 basis-1/3 space-y-1 overflow-hidden px-4 text-end">
              {/* <div className="truncate">
               <span className="font-semibold text-gray-600">Login Time</span>:{" "}
              </div> */}
              <div className="truncate">
                <span className="text-black font-semibold">
                  Evaluation Time
                </span>
                :
                <span
                  className={`ml-2 font-mono ${
                    remainingSecondsRef.current / 60 > userTimerData.maxTime
                      ? "font-semibold text-red-600"
                      : "text-gray-800"
                  }`}
                >
                  {remainingTimeStr}
                </span>
                <br />
                <span className="text-black font-semibold">page Time</span>:
                <span
                  className={`ml-2 font-mono ${
                    pageTimer.current > 15 || blankCheck
                      ? "font-semibold text-green-600"
                      : "text-gray-800"
                  }`}
                >
                  {pageTimerCount}
                </span>
              </div>
            </section>
          </div>

          <div className="relative mt-[3px] flex h-[61px] w-[355px]  items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl">
            {/* <div className="flex h-full items-center rounded-full bg-lightPrimary text-navy-700 xl:w-[225px]">
              <p className="pl-3 pr-2 text-xl">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </p>
              <input
                type="text"
                placeholder="Search..."
                className="block h-full w-full rounded-full bg-lightPrimary text-sm outline-none"
              />
            </div> */}

            <div
              className="cursor-pointer text-gray-600"
              onClick={() => {
                if (darkmode) {
                  document.body.classList.remove("dark");
                  setDarkmode(false);
                } else {
                  document.body.classList.add("dark");
                  setDarkmode(true);
                }
              }}
            >
              {darkmode ? (
                <RiSunFill className="h-4 w-4 text-gray-600" />
              ) : (
                <RiMoonFill className="h-4 w-4 text-gray-600" />
              )}
            </div>

            <Dropdown
              button={
                <img
                  className="h-10 w-10 cursor-pointer rounded-full"
                  src={avatar}
                  alt="avatar"
                />
              }
              children={
                <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white shadow-xl">
                  <div className="cursor-pointer p-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-navy-700">
                        👋 Hey, {userDetails?.name}
                      </p>
                    </div>
                  </div>
                  <div className="h-px w-full bg-gray-200" />
                  <div className="flex flex-col p-4">
                    <a
                      href=" "
                      className="text-sm text-gray-800 hover:dark:text-white"
                      onClick={() => navigate("/admin/profile")}
                    >
                      Profile
                    </a>
                    <button
                      onClick={() => {
                        dispatch(logout());
                        navigate("/auth/sign-in");
                      }}
                      className="mt-3 text-sm font-medium text-red-500"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              }
              classNames={"py-2 top-8 -left-[180px] w-max"}
            />
          </div>
        </div>

        <div className="flex h-[90vh] w-full flex-row ">
          <div className=" h-full w-[8%] bg-[#F5F5F5] sm:w-[20%] md:w-[12%] lg:w-[10%]">
            <div className="h-[100%]  justify-center text-center ">
              <h2
                className="sticky top-0 z-10 h-[10%] border-b border-gray-300 bg-[#FFFFFF] px-2 py-3 font-bold shadow-md md:text-base lg:text-xl"
                style={{ fontSize: "1vw" }}
              >
                Answer Sheet Count
                <span
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    marginLeft: "4px",
                  }}
                >
                  {Imgicons.length}
                </span>
              </h2>
              <div className="h-[82%] ">
                <div className="grid max-h-full grid-cols-1 place-items-center overflow-auto bg-[#F5F5F5] md:grid-cols-1 lg:grid-cols-2">
                  {Imgicons}
                </div>
              </div>

              <button
                type="button"
                className="h-[8%] w-full bg-gradient-to-r from-[#33597a] to-[#33a3a3] px-1.5 py-2.5 text-center text-sm font-medium  text-white"
                onClick={() => setShowQuestionModal(true)}
              >
                Show Questions
              </button>
            </div>
          </div>

          <div
            id="imgcontainer"
            className="h-full flex-grow sm:w-[60%] md:w-[65%] lg:w-[72%]"
          >
            <ImageContainer
              ImageObj={imageObj}
              id={id}
              taskdetails={taskdetails}
              setblankCheck={setblankCheck}
            />
          </div>

          <div className=" h-full sm:w-[30%] md:w-[25%] lg:block lg:w-[20%]">
            <ReviewerQuestion
              answerPdfDetails={answerSheetCount}
              taskdetails={taskdetails}
              remainingSecondsRef={remainingSecondsRef.current}
              userTimerData={userTimerData}
              settotalMarksToDisplay={settotalMarksToDisplay}
              setTotalMarks={setTotalMarks}
              setsubmitModel={setsubmitModel}
              submitModel={submitModel}
              socket={socket}
              id={id}
              setconfirmationData={setconfirmationData}
              confirmationData={confirmationData}
              answerPdfDetailsId={answerPdfDetails}
            />
          </div>
        </div>

        {questionModal && (
          <EvalQuestionModal
            show={questionModal}
            onHide={() => setShowQuestionModal(false)}
          />
        )}
      </>
    );
  }
};

export default CheckModule;
