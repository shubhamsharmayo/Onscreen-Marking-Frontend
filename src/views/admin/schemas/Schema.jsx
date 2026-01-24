import React, { useEffect, useState, useRef } from "react";
import SchemaEditModal from "./SchemaEditModal";
import SubQuestionModal from "../../../components/modal/SubQuestionModal";
import SchemaCreateModal from "./SchemaCreateModal";
import ConfirmationModal from "components/modal/ConfirmationModal";
import { useNavigate } from "react-router-dom";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { MdCreateNewFolder } from "react-icons/md";
import { FaCloudUploadAlt, FaFileUpload } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { MdAutoDelete } from "react-icons/md";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllSchemas, deleteSchema, updateSchema } from "./schemaApi";
import Tooltip from "@mui/material/Tooltip";
import axios from "axios";

const Schema = () => {
  const [editShowModal, setEditShowModal] = useState(false);
  const [createShowModal, setCreateShowModal] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [schemaId, setSchemaId] = useState("");
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef(null);
  // const [schemaData, setschemaData] = useState()

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check dark mode
  useEffect(() => {
    const htmlElement = document.body;
    const checkDarkMode = () =>
      setIsDarkMode(htmlElement.classList.contains("dark"));

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      background: { default: "#111c44" },
      text: { primary: "#ffffff" },
    },
  });

  // Redirect if no token
  useEffect(() => {
    if (!token) navigate("/auth/sign-in");
  }, [navigate, token]);

  // Fetch schemas
  const {
    data: schemaData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["schemas"],
    queryFn: () => getAllSchemas(token),
    enabled: !!token,
  });
  console.log(schemaData);

  const handleSupplementaryUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("supplimentaryPdf", file); // ✅ exact backend key

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/schemas/uploadSupplimentarypdf/${schemaId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data?.message || "Supplementary PDF uploaded");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Supplementary PDF upload failed"
      );
    } finally {
      event.target.value = ""; // reset input
    }
  };

  // Delete schema mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSchema,
    onSuccess: () => {
      toast.success("Schema deleted successfully");
      queryClient.invalidateQueries(["schemas"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete schema");
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ id: schemaId, token });
    setConfirmationModal(false);
  };

  // const handleSelectCoordinates = async (folder) => {
  //   // console.log(folder.id);
  //   // console.log(savedQuestionData);
  //   setFolderIdQuestion(folder.id); // Set the folder ID
  //   setShowQuestionModal(true); // Show the modal
  //   setQuestionId(
  //     savedQuestionData.filter(
  //       (savedQuestion) =>
  //         parseFloat(savedQuestion.questionsName) === parseFloat(folder.id) ||
  //         undefined
  //     )
  //   );
  //   // console.log(
  //   //   savedQuestionData.filter(
  //   //     (savedQuestion) =>
  //   //       savedQuestion.questionsName === folder.id || undefined
  //   //   )
  //   // );
  //   setFormData((prevFormData) => ({
  //     ...prevFormData,
  //     questionImages: [],
  //     answerImages: [],
  //   }));
  // };
  // const handleFileUpload = async (event) => {
  //   const files = Array.from(event.target.files);
  //   if (!files.length) return;

  //   const pdfFiles = files.filter((file) => file.type === "application/pdf");

  //   const rarFiles = files.filter(
  //     (file) =>
  //       file.type === "application/zip" ||
  //       file.type === "application/x-zip-compressed"
  //   );

  //   // Rule 1: PDF → multiple allowed
  //   // Rule 2: RAR → only one allowed
  //   // Rule 3: PDF + RAR together → NOT allowed

  //   if (rarFiles.length > 1) {
  //     toast.error("Only one RAR file can be uploaded at a time");
  //     event.target.value = "";
  //     return;
  //   }

  //   if (rarFiles.length === 1 && pdfFiles.length > 0) {
  //     toast.error("Cannot upload PDF and RAR together");
  //     event.target.value = "";
  //     return;
  //   }

  //   // Proceed with upload
  //   const formData = new FormData();

  //   files.forEach((file) => {
  //     formData.append("file", file);
  //   });
  //   console.log(currentBookletDetails?.folderName);
  //   // formData.append("bookletId", currentBookletDetails?._id);
  //   formData.append("subjectCode", currentBookletDetails?.folderName);
  //   console.log(formData);
  //   try {
  //     const response = await axios.post(
  //       `${process.env.REACT_APP_API_URL}/api/bookletprocessing/uploadingbooklets`,
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     toast.success("Upload successful");
  //   } catch (err) {
  //     // console.log(err?.response?.data?.message)
  //     toast.error(err?.response?.data?.message);
  //   } finally {
  //     event.target.value = "";
  //   }
  // };

  // Update schema mutation
  const updateMutation = useMutation({
    mutationFn: updateSchema,
    onSuccess: (_, variables) => {
      toast.success("Schema updated successfully");
      queryClient.invalidateQueries(["schemas"]);

      // ✅ CLOSE MODAL
      setEditShowModal(false);

      // ✅ NAVIGATE TO STRUCTURE PAGE
      navigate(`/admin/schema/create/structure/${variables.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Update failed");
    },
  });

  const handleUpdate = (id, updatedData) => {
    updateMutation.mutate({ id, data: updatedData, token });
  };

  // Grid rows
  const rows = schemaData.map((data) => ({
    id: data._id,
    name: data.name,
    maxMarks: data.maxMarks,
    minMarks: data.minMarks,
    totalQuestions: data.totalQuestions,
    numberOfSupplement: data.numberOfSupplement,
    compulsoryQuestions: data.compulsoryQuestions,
    // evaluationTime: data.evaluationTime,
    minTime: data.minTime,
    maxTime: data.maxTime,
    perPage: data.perPage,
    PageofSupplement: data.PageofSupplement,

    numberOfPage: data.numberOfPage,
    hiddenPage: data?.hiddenPage.map((item) => parseInt(item) + 1),
  }));

  const columns = [
    { field: "name", headerName: "Schema", flex: 1.4, minWidth: 1 },
    { field: "maxMarks", headerName: "Max Marks", flex: 0.7, minWidth: 1 },
    { field: "minMarks", headerName: "Min Marks", flex: 0.7, minWidth: 1 },
    { field: "minTime", headerName: "Min Time", flex: 0.7, minWidth: 1 },
    { field: "maxTime", headerName: "Max Time", flex: 0.7, minWidth: 1 },
    {
      field: "totalQuestions",
      headerName: "Primary Qs",
      flex: 0.7,
      minWidth: 1,
    },
    {
      field: "compulsoryQuestions",
      headerName: "Compulsory Qs",
      flex: 0.8,
      minWidth: 1,
    },
    // { field: "evaluationTime", headerName: "Eval Time", flex: 1 },
    {
      field: "numberOfPage",
      headerName: "No. of Pages Booklets",
      flex: 1.3,
      minWidth: 1,
    },
    { field: "hiddenPage", headerName: "Hidden Page", flex: 1, minWidth: 1 },
    {
      field: "createStructure",
      headerName: "Create Structure",
      flex: 1.3,
      minWidth: 1,
      renderCell: (params) => (
        <Tooltip title="update schema structure" arrow placement="top">
          <div
            className="flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-yellow-600"
            onClick={() => {
              localStorage.removeItem("navigateFrom");
              navigate(`/admin/schema/create/structure/${params.row.id}`);
            }}
          >
            <MdCreateNewFolder className="size-8" />
          </div>
        </Tooltip>
      ),
    },
    {
      field: "upload",
      headerName: "Upload",
      flex: 0.9,
      minWidth: 1,
      renderCell: (params) => (
        <>
          <Tooltip title="Upload Supplementary PDF" arrow placement="top">
            <div
              className="flex cursor-pointer justify-center rounded px-3 py-2"
              onClick={() => {
                setSchemaId(params.row.id); // ✅ store schemaId
                fileInputRef.current.click(); // ✅ open file picker
              }}
            >
              <FaCloudUploadAlt className="size-7 text-yellow-600" />
            </div>
          </Tooltip>

          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            className="hidden"
            onChange={handleSupplementaryUpload}
          />
        </>
      ),
    },
    {
      field: "Map",
      headerName: "Mapping",
      flex: 0.9,
      renderCell: (params) => (
        <Tooltip title="Map Supplementary PDF">
          <div
            className="flex cursor-pointer justify-center px-3 py-2"
            onClick={() => {
              setSchemaId(params.row.id);
              setShowQuestionModal(true);
            }}
          >
            <FaFileUpload className="size-7 text-yellow-600" />
          </div>
        </Tooltip>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      renderCell: (params) => (
        <Tooltip title="Edit schema" arrow placement="top">
          <div
            className="mt-1 flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-indigo-400"
            onClick={() => {
              setEditShowModal(true);
              setSchemaId(params.row.id);
              setSelectedSchema(params.row);
              console.log(params.row);
            }}
          >
            <FiEdit className="size-6" />
          </div>
        </Tooltip>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      renderCell: (params) => (
        <Tooltip title="Delete the schema" arrow placement="top">
          <div
            className="mt-1 flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-red-600"
            onClick={() => {
              setConfirmationModal(true);
              setSchemaId(params.row.id);
            }}
          >
            <MdAutoDelete className="size-6" />
          </div>
        </Tooltip>
      ),
    },
  ];

  if (isLoading)
    return <div className="p-4 text-center">Loading schemas...</div>;
  if (isError)
    return (
      <div className="p-4 text-center text-red-500">Failed to load schemas</div>
    );

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 p-4 lg:grid-cols-3 lg:gap-8">
      <div className="h-32 rounded-lg lg:col-span-3">
        <div className="overflow-x-auto rounded-lg">
          <div className="mb-4 flex items-start justify-start rounded-lg sm:justify-end">
            <div
              className="hover:bg-transparent inline-block cursor-pointer items-center rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring active:text-indigo-500"
              onClick={() => setCreateShowModal(!createShowModal)}
            >
              Create Schema
            </div>
          </div>

          {isDarkMode ? (
            <ThemeProvider theme={darkTheme}>
              <DataGrid
                className="dark:bg-navy-700"
                rows={rows}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                sx={{
                  "& .MuiDataGrid-columnHeaders": {
                    fontWeight: 900,
                    fontSize: "0.9rem",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                  },
                  "& .MuiDataGrid-cell": {
                    fontSize: "0.80rem",
                    color: "#ffffff",
                    display: "flex",
                    justifyContent: "center",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  "& .MuiTablePagination-root": { color: "#ffffff" },
                  "& .MuiDataGrid-footerContainer": {
                    backgroundColor: "#111c44",
                    color: "#ffffff",
                  },
                  "& .MuiDataGrid-toolbarContainer button": {
                    color: "#ffffff",
                  },
                  "& .MuiDataGrid-toolbarContainer svg": { fill: "#ffffff" },
                }}
              />
            </ThemeProvider>
          ) : (
            <div
              style={{ maxHeight: "600px", width: "100%" }}
              className="dark:bg-navy-700"
            >
              <DataGrid
                rows={rows}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                sx={{
                  "& .MuiDataGrid-columnHeaders": {
                    fontWeight: 900,
                    fontSize: "1rem",
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
                  },
                  "& .MuiTablePagination-root": { color: "#000000" },
                  "& .MuiDataGrid-cell": {
                    fontSize: "0.80rem",
                    color: "#000000",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      <SchemaEditModal
        editShowModal={editShowModal}
        setEditShowModal={setEditShowModal}
        selectedSchema={selectedSchema}
        handleUpdate={handleUpdate}
      />

      {showQuestionModal && (
        <SubQuestionModal
          showImageModal={showQuestionModal}
          setShowImageModal={setShowQuestionModal}
          schemaId={schemaId}
        />
      )}

      <SchemaCreateModal
        createShowModal={createShowModal}
        setCreateShowModal={setCreateShowModal}
      />

      <ConfirmationModal
        confirmationModal={confirmationModal}
        onSubmitHandler={handleConfirmDelete}
        setConfirmationModal={setConfirmationModal}
        setId={setSchemaId}
        heading="Confirm Schema Removal"
        message="Are you sure you want to remove this schema? This action cannot be undone."
        type="error"
      />
    </div>
  );
};

export default Schema;
