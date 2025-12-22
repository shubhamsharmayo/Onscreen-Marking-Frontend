import BarChart from "./charts/BarChart";
import DoughnutChart from "./charts/DoughnutChart";
import Boxes from "./boxes/Boxes";
import { useEffect, useState } from "react";
import { FaUsers } from "react-icons/fa6";
import { MdOutlineScanner } from "react-icons/md";
import { FaTasks } from "react-icons/fa";
import { RiAiGenerate } from "react-icons/ri";
import { SiGoogleclassroom } from "react-icons/si";
import { IoBookSharp } from "react-icons/io5";
import { MdLibraryBooks } from "react-icons/md";
import { BsClipboard2DataFill } from "react-icons/bs";
import axios from "axios";
import { toast } from "react-toastify";
import socket from "../../../services/socket/socket";
import { getUserDetails } from "../../../services/common";

const Dashboard = () => {
  const [expandedChart, setExpandedChart] = useState(null);
  const [showData, setShowData] = useState(false);
  const [selectedChartData, setSelectedChartData] = useState(null);
  const [responseData, setResponseData] = useState([]);
  const [arr, setArr] = useState([]);
  const [val, setVal] = useState([]);
  const [analytical, setanalytical] = useState({});
  const [analyticEval, setanalyticEval] = useState({})
  const [loading, setloading] = useState(false);
  const [user, setuser] = useState();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const dataSets = {
    Users: { labels: ["Admin", "Evaluator", "Moderator"], data: [10, 15, 20] },
    "Scanned Data": {
      labels: ["Sheet1", "Sheet2", "Sheet3"],
      data: [300, 450, 600],
    },
    Tasks: {
      labels: ["Pending", "Completed", "In Progress"],
      data: [20, 50, 10],
    },
    "Result Generated": { labels: ["Pass", "Fail"], data: [80, 20] },
    Schemas: { labels: ["Schema A", "Schema B", "Schema C"], data: [5, 8, 12] },
    Classes: { labels: ["Class 1", "Class 2", "Class 3"], data: [25, 30, 40] },
    Courses: { labels: ["Math", "Science", "English"], data: [12, 20, 15] },
    Booklets: { labels: ["Booklet A", "Booklet B"], data: [100, 150] },
    ResultGenerated: { labels: ["Results Generated"], data: [100] },
    ScannedData: { labels: ["Scanned Data"], data: [150] },
  };

  const labels = Object.keys(dataSets);

  // Generate dataset dynamically by summing up the `data` array for each category
  const processedData = labels.map((category) =>
    dataSets[category].data.reduce((acc, val) => acc + val, 0)
  );

  useEffect(() => {
    setloading(true);
    const fetchData = async () => {
      try {
        const userData = await getUserDetails(token);
        console.log(userData?.data);
        setuser(userData.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    console.log(user?.role);

    if (user?.role === "admin") {
      socket.emit("join-analytics-room");
      socket.on("admin-analytics-data", (data) => {
        // console.log(data);
        setanalytical(data);
      });
    } else {
      socket.emit("join-evaluatorAnalytics-room", { userId });
      socket.on("evaluator-analytics-data", (data) => {
        // console.log(data);
         setanalyticEval(data);
      });
    }
  }, [loading]);

  const handleBoxClick = (title) => {
    if (title === "Users") {
      let arrr = [];
      let vall = [];
      for (const key in responseData.usersByRole) {
        arrr.push(key);
      }
      for (const key in responseData.usersByRole) {
        vall.push(responseData.usersByRole[key]);
      }
      setArr(arrr);
      setVal(vall);
    } else if (title === "Tasks") {
      let arrr = [];
      let vall = [];
      for (const key in responseData.tasks) {
        arrr.push(key);
      }
      for (const key in responseData.tasksByStatus) {
        vall.push(responseData.tasksByStatus[key]);
      }
      setArr(arrr);
      setVal(vall);
    } else if (title === "Courses") {
      let arrr = [];
      let vall = [];
      arrr.push(title);
      vall.push(responseData.totalCourses);
      setArr(arrr);
      setVal(vall);
    } else if (title === "Subjects") {
      let arrr = [];
      let vall = [];
      arrr.push(title);
      vall.push(responseData.totalSubjects);
      setArr(arrr);
      setVal(vall);
    } else if (title === "Schemas") {
      let arrr = [];
      let vall = [];
      arrr = ["Schema A", "Schema B", "Schema C"];
      vall = [5, 8, 12];
      setArr(arrr);
      setVal(vall);
    } else if (title === "Classes") {
      let arrr = [];
      let vall = [];
      arrr = ["Class 1", "Class 2", "Class 3"];
      vall = [25, 30, 40];
      setArr(arrr);
      setVal(vall);
    } else if (title === "ScannedData") {
      let arrr = [];
      let vall = [];
      arrr = ["Scanned Data"];
      vall = [150];
      setArr(arrr);
      setVal(vall);
    } else if (title === "ResultGenerated") {
      let arrr = [];
      let vall = [];
      arrr = ["Results Generated"];
      vall = [100];
      setArr(arrr);
      setVal(vall);
    } else {
      setSelectedChartData(dataSets[title]);
    }
  };

  // useEffect(() => {
  //   try {
  //     async function fetchData() {
  //       const response = await axios.get(
  //         `${process.env.REACT_APP_API_URL}/api/analytic/getadminanalytics`
  //       );
  //       setResponseData(response.data);
  //     }
  //     fetchData();
  //   } catch (error) {
  //     toast.error(error?.message);
  //   }
  // }, [arr, val]);

  const openChart = (chartType) => {
    setExpandedChart(chartType);
  };

  const closeChart = () => {
    setExpandedChart(null);
  };

  if (loading) {
    return;
  }

  return (
    <div className="dashboard relative p-5 dark:text-white">
      {/* Boxes Area */}
      {user?.role === "admin" ? (
        <div
          className={`boxes mb-5 grid gap-3 overflow-auto pt-1 sm:gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-4 ${
            showData ? "h-80 md:h-56 lg:h-32" : ""
          }`}
        >
          <Boxes
            icon={<FaUsers fontSize={36} />}
            title={"Users"}
            amount={analytical.totalUsers}
            // percentage={100}
            event={() => handleBoxClick("Users")}
          />
          <Boxes
            icon={<FaTasks fontSize={36} />}
            title={"Tasks"}
            amount={analytical.tasks}
            // percentage={45}
            event={() => handleBoxClick("Tasks")}
          />
          <Boxes
            icon={<SiGoogleclassroom fontSize={36} />}
            title={"Classes"}
            amount={analytical.courses}
            // percentage={45}
            event={() => handleBoxClick("Classes")}
          />
          <Boxes
            icon={<MdLibraryBooks fontSize={36} />}
            title={"Subjects"}
            amount={analytical.subjects}
            // percentage={45}
            event={() => handleBoxClick("Subjects")}
          />
          {showData && (
            <>
              {/* <div className="boxes flex flex-col items-center justify-start gap-5 transition-all sm:gap-5 md:flex-row md:gap-3 lg:gap-7"> */}
              <Boxes
                icon={<BsClipboard2DataFill fontSize={36} />}
                title={"Schemas"}
                amount={analytical.schemas}
                // percentage={100}
                event={() => handleBoxClick("Schemas")}
              />

              <Boxes
                icon={<MdOutlineScanner fontSize={36} />}
                title={"Scanned Data"}
                // amount={analytical.}
                // percentage={45}
                event={() => handleBoxClick("ScannedData")}
              />
              <Boxes
                icon={<RiAiGenerate fontSize={36} />}
                title={"Result Generated"}
                // amount={analytical.}
                // percentage={45}
                event={() => handleBoxClick("ResultGenerated")}
              />
              {/* </div> */}
            </>
          )}
        </div>
      ) : (
        <div
          className={`boxes mb-5 grid gap-3 overflow-auto pt-1 sm:gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-4 ${
            showData ? "h-80 md:h-56 lg:h-32" : ""
          }`}
        >
          <Boxes
            icon={<RiAiGenerate fontSize={36} />}
            title={"Completed"}
            amount={analyticEval.completedTasks}
            // percentage={45}
            event={() => handleBoxClick("ResultGenerated")}
          />
          <Boxes
            icon={<RiAiGenerate fontSize={36} />}
            title={"Evaluated"}
            amount={analyticEval.evaluatedBooklets}
            // percentage={45}
            event={() => handleBoxClick("ResultGenerated")}
          />
          <Boxes
            icon={<RiAiGenerate fontSize={36} />}
            title={"Pending"}
            amount={analyticEval.pendingBooklets}
            // percentage={45}
            event={() => handleBoxClick("ResultGenerated")}
          />
          {/* <Boxes
            icon={<RiAiGenerate fontSize={36} />}
            title={"Completed"}
            amount={analyticEval.completedTasks}
            // percentage={45}
            event={() => handleBoxClick("ResultGenerated")}
          /> */}
        </div>
      )}

      <div className="mt-2 flex cursor-pointer justify-between">
        <div className="font-semibold text-indigo-600 dark:text-indigo-400">
          Click on any above data to see detailed insights...
        </div>
        <div
          className="rounded-lg bg-indigo-500 px-4 py-2 text-white transition-all hover:bg-indigo-600"
          onClick={() => {
            setShowData(!showData);
          }}
        >
          {showData ? "Show Less..." : "Show More Analytics..."}
        </div>
      </div>

      <div className="text-4xl font-semibold">Data Analytics</div>

      {/* Charts Area */}
      <div className="charts mt-5 flex flex-col items-center justify-center gap-5 lg:flex-row lg:items-start lg:gap-7">
        {/* Bar Chart Section */}
        <div
          onClick={() => openChart("bar")}
          className="bar w-full cursor-pointer rounded-xl border-blue-300 bg-white p-4 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100 hover:border hover:shadow-xl dark:bg-navy-700 dark:shadow-gray-800 md:w-full lg:w-7/12"
        >
          <div className="flex h-72 items-center justify-center sm:h-80 md:h-96">
            <BarChart user={user} analytical={analytical} analyticEval={analyticEval}/>
          </div>
        </div>

        {/* Doughnut Chart Section */}
        <div
          onClick={() => openChart("doughnut")}
          className="line w-full cursor-pointer rounded-xl border-blue-300 bg-white p-4 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-100 hover:border hover:shadow-xl dark:bg-navy-700 dark:shadow-gray-800 dark:text-white md:w-full lg:w-5/12"
        >
          <div className="flex h-72 justify-center sm:h-80 md:h-96">
            <DoughnutChart arr={arr} val={val} />
          </div>
        </div>
      </div>

      {/* Expanded Chart Modal */}
      {expandedChart && (
        <div
          className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-md"
          onClick={closeChart}
        >
          <div
            className="w-11/12 max-w-4xl rounded-lg bg-white p-6 dark:bg-navy-800"
            onClick={(e) => e.stopPropagation()}
          >
            {expandedChart === "bar" && <BarChart user={user} analytical={analytical} analyticEval={analyticEval}/>}
            {expandedChart === "doughnut" && (
              <div className="flex items-center justify-center sm:mx-auto md:mx-auto md:w-1/2 lg:mx-auto lg:w-1/2">
                <DoughnutChart arr={arr} val={val} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
