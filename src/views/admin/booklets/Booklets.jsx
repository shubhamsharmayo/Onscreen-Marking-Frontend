import React, { useEffect, useState, useRef } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { FcProcess } from "react-icons/fc";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { MdTask } from "react-icons/md";
import { FaCloudUploadAlt } from "react-icons/fa";

import { FaCloudDownloadAlt } from "react-icons/fa";
import AssignBookletModal from "../../../components/modal/AssignBookletModal";
import AssignModalComp from "../../../components/modal/AssignModelComp";
import { toast } from "react-toastify";
import axios from "axios";
import { getAllUsers } from "services/common";
import socket from "../../../services/socket/socket";

// Initialize socket connection
// const socket = io(process.env.REACT_APP_API_URL, {
//   transports: ["websocket"], // Force WebSocket only for stability
//   reconnectionAttempts: 5,
//   timeout: 20000,
// });

const Booklets = () => {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAssignBookletModal, setShowAssignBookletModal] = useState(false);
  const [currentBookletDetails, setCurrentBookletDetails] = useState("");
  const [assignModel, setassignModel] = useState(false);
  const [assignTask, setAssignTask] = useState("");
  const [allUsers, setAllUsers] = useState("");
const token = localStorage.getItem("token")
  const fileInputRef = useRef(null);
  console.log(currentBookletDetails)

  useEffect(() => {
    // Check if the `dark` mode is applied to the `html` element
    const htmlElement = document.body; // `html` element
    const checkDarkMode = () => {
      const isDark = htmlElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Optionally, observe for changes if the theme might toggle dynamically
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchTasksBySubjectCode = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tasks/subjectcode?subjectcode=${currentBookletDetails?.folderName}`
        );
        console.log(response.data); // Handle the response data
        setAssignTask(response?.data);
      } catch (error) {
        console.error("Error fetching tasks:", error); // Handle errors
      }
    };

    // Usage
    if (currentBookletDetails) {
      fetchTasksBySubjectCode();
    }
  }, [currentBookletDetails]);

  useEffect(() => {
    const handleFolderList = (folderList) => {
      // console.log("Initial folder list:", folderList);
      setRows(folderList?.map((folder) => ({ ...folder, id: folder?._id })));
      console.log(
        folderList?.map((folder) => ({ ...folder, id: folder?._id }))
      );
    };

    const handleFolderUpdate = (updatedFolder) => {
      console.log("Folder updated:", updatedFolder);
      setRows((prevFolders) =>
        prevFolders.map((folder) =>
          folder._id === updatedFolder._id
            ? { ...updatedFolder, id: updatedFolder._id }
            : folder
        )
      );
    };

    const handleFolderAdd = (newFolder) => {
      // console.log("New folder added:", newFolder);
      setRows((prevFolders) => [
        ...prevFolders,
        { ...newFolder, id: newFolder._id },
      ]);
    };

    const handleFolderRemove = ({ folderName }) => {
      // console.log("Folder removed:", folderName);
      setRows((prevFolders) =>
        prevFolders?.filter((folder) => folder?.folderName !== folderName)
      );
    };

    if (!socket.connected) socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("request-folder-list");
    });

    // Attach event listeners for real-time updates
    socket.on("folder-list", handleFolderList);
    socket.on("folder-update", handleFolderUpdate);
    socket.on("folder-add", handleFolderAdd);
    socket.on("folder-remove", handleFolderRemove);

    return () => {
      // Disconnect the socket and cleanup listeners

      socket.off("folder-list", handleFolderList);
      socket.off("folder-update", handleFolderUpdate);
      socket.off("folder-add", handleFolderAdd);
      socket.off("folder-remove", handleFolderRemove);
      socket.disconnect();
    };
  }, [allUsers]);

  console.log(rows);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    const rarFiles = files.filter(
      (file) =>
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed"
    );

    // Rule 1: PDF → multiple allowed
    // Rule 2: RAR → only one allowed
    // Rule 3: PDF + RAR together → NOT allowed

    if (rarFiles.length > 1) {
      toast.error("Only one RAR file can be uploaded at a time");
      event.target.value = "";
      return;
    }

    if (rarFiles.length === 1 && pdfFiles.length > 0) {
      toast.error("Cannot upload PDF and RAR together");
      event.target.value = "";
      return;
    }

    // Proceed with upload
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("file", file);
    });
    console.log(currentBookletDetails?.folderName)
    // formData.append("bookletId", currentBookletDetails?._id);
     formData.append("subjectCode", currentBookletDetails?.folderName);
    console.log(formData)
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookletprocessing/uploadingbooklets`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Upload successful");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await getAllUsers();
        setAllUsers(response || []);
      } catch (error) {
        console.error("Error fetching tasks:", error); // Handle errors
      }
    };
    fetchAllUsers();
  }, []);

  // console.log(allUsers)

  // console.log(assignTask)

  const darkTheme = createTheme({
    palette: {
      mode: "dark", // Use 'light' for light mode
      background: {
        default: "#111c44", // Background for dark mode
      },
      text: {
        primary: "#ffffff", // White text for dark mode
      },
    },
  });

  const columns = [
    { field: "folderName", headerName: "Course Code", width: 120 },
    { field: "description", headerName: "Description", width: 150 },
    { field: "scannedFolder", headerName: "Scanned Data", width: 150 },
    { field: "unAllocated", headerName: "Unallocated", width: 150 },
    { field: "allocated", headerName: "Allocated", width: 110 },
    { field: "evaluated", headerName: "Evaluated", width: 150 },
    {
      field: "evaluation_pending",
      headerName: "Evaluation Pending",
      width: 150,
    },

    {
      field: "processBooklets",
      headerName: "Process Booklets",
      width: 150,
      renderCell: (params) => (
        <div
          className="flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-yellow-600 "
          onClick={() => {
            localStorage.removeItem("navigateFrom");
            navigate(`/admin/process/booklets/${params.row.folderName}`);
          }}
        >
          <FcProcess className="size-7 text-indigo-500 " />
        </div>
      ),
    },
    {
      field: "downloadbooklet",
      headerName: "Download Booklets",
      width: 150,
      renderCell: (params) => (
        <div
          className="flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-yellow-600  "
          onClick={() => {
            setShowAssignBookletModal(true);
            setCurrentBookletDetails(params?.row);
          }}
        >
          <FaCloudDownloadAlt className="size-7 text-yellow-600 " />
        </div>
      ),
    },
    {
      field: "upload",
      headerName: "Upload",
      width: 150,
      renderCell: (params) => (
        <>
          <div
            className="flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-yellow-600"
            onClick={() => {
              setCurrentBookletDetails(params.row);
              fileInputRef.current.click();
            }}
          >
            <FaCloudUploadAlt className="size-7 text-yellow-600" />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.zip"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </>
      ),
    },
     {
      field: "assignTask",
      headerName: "Assign Task",
      width: 150,
      renderCell: (params) => (
        <div
          className="flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-yellow-600  "
          onClick={() => {
            setassignModel(true);
            setCurrentBookletDetails(params?.row);
          }}
        >
          {/* {console.log(params?.row)} */}
          <MdTask className="size-7 text-yellow-600 " />
        </div>
      ),
    },
  ];

  return (
    <div className="mt-12">
      {isDarkMode ? (
        <ThemeProvider theme={darkTheme}>
          <div style={{ height: "600px", width: "100%" }}>
            <DataGrid
              className="dark:bg-navy-700"
              columns={columns}
              rows={rows}
              slots={{ toolbar: GridToolbar }}
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  fontWeight: 900,
                  fontSize: "1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "0.80rem",
                  color: "#ffffff",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                "& .MuiTablePagination-root": {
                  color: "#ffffff",
                },
                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: "#111c44",
                  color: "#ffffff",
                },
                "& .MuiDataGrid-toolbarContainer button": {
                  color: "#ffffff",
                },
                "& .MuiDataGrid-toolbarContainer svg": {
                  fill: "#ffffff",
                },
              }}
            />
          </div>
        </ThemeProvider>
      ) : (
        <div
          style={{ maxHeight: "600px", width: "100%" }}
          className="dark:bg-navy-700"
        >
          <DataGrid
            columns={columns}
            rows={rows}
            slots={{ toolbar: GridToolbar }}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                fontWeight: 900,
                fontSize: "1rem",
                backgroundColor: "#ffffff",
                borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
              },
              "& .MuiTablePagination-root": {
                color: "#000000", // Text color for pagination controls
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.80rem", // Smaller row text
                color: "#000000", // Cell text color
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.1)", // Optional hover effect
              },
            }}
          />
        </div>
      )}
      {showAssignBookletModal && (
        <AssignBookletModal
          setShowAssignBookletModal={setShowAssignBookletModal}
          currentBookletDetails={currentBookletDetails}
          allUsers={allUsers}
        />
      )}
      {assignModel && (
        <AssignModalComp
          setassignModel={setassignModel}
          currentBookletDetails={currentBookletDetails}
        />
      )}
    </div>
  );
};

export default Booklets;
