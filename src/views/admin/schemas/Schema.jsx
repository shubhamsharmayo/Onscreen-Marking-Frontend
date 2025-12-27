import React, { useEffect, useState } from "react";
import SchemaEditModal from "./SchemaEditModal";
import SchemaCreateModal from "./SchemaCreateModal";
import ConfirmationModal from "components/modal/ConfirmationModal";
import { useNavigate } from "react-router-dom";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { MdCreateNewFolder } from "react-icons/md";
import { FiEdit } from "react-icons/fi";
import { MdAutoDelete } from "react-icons/md";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllSchemas, deleteSchema, updateSchema } from "./schemaApi";

const Schema = () => {
  const [editShowModal, setEditShowModal] = useState(false);
  const [createShowModal, setCreateShowModal] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [schemaId, setSchemaId] = useState("");
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // const [schemaData, setschemaData] = useState()

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check dark mode
  useEffect(() => {
    const htmlElement = document.body;
    const checkDarkMode = () => setIsDarkMode(htmlElement.classList.contains("dark"));

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(htmlElement, { attributes: true, attributeFilter: ["class"] });

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
  const { data: schemaData = [], isLoading, isError } = useQuery({
    queryKey: ["schemas"],
    queryFn: () => getAllSchemas(token),
    enabled: !!token,
  });
  console.log(schemaData)

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

  // Update schema mutation
  const updateMutation = useMutation({
    mutationFn: updateSchema,
    onSuccess: () => {
      toast.success("Schema updated successfully");
      queryClient.invalidateQueries(["schemas"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Update failed");
    },
  });

  const handleUpdate = (id, updatedData) => {
    updateMutation.mutate({ id, data: updatedData, token });
    
    setEditShowModal(false);
  };

  // Grid rows
  const rows = schemaData.map((data) => ({
    id: data._id,
    name: data.name,
    maxMarks: data.maxMarks,
    minMarks: data.minMarks,
    totalQuestions: data.totalQuestions,
    compulsoryQuestions: data.compulsoryQuestions,
    // evaluationTime: data.evaluationTime,
    minTime:data.minTime,
    maxTime: data.maxTime,
    numberOfPage: data.numberOfPage,
    hiddenPage: data?.hiddenPage.map((item) => parseInt(item) + 1),
  }));

  const columns = [
    { field: "name", headerName: "Schema", flex: 1 },
    { field: "maxMarks", headerName: "Max Marks", flex: 1 },
    { field: "minMarks", headerName: "Min Marks", flex: 1 },
    { field: "minTime", headerName: "Min Time", flex: 1 },
    { field: "maxTime", headerName: "Max Time", flex: 1 },
    { field: "totalQuestions", headerName: "Primary Qs", flex: 1 },
    { field: "compulsoryQuestions", headerName: "Compulsory Qs", flex: 1 },
    // { field: "evaluationTime", headerName: "Eval Time", flex: 1 },
    { field: "numberOfPage", headerName: "No. of Pages Booklets", flex: 1 },
    { field: "hiddenPage", headerName: "Hidden Page", flex: 1 },
    {
      field: "createStructure",
      headerName: "Create Structure",
      renderCell: (params) => (
        <div
          className="flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-yellow-600"
          onClick={() => {
            localStorage.removeItem("navigateFrom");
            navigate(`/admin/schema/create/structure/${params.row.id}`);
          }}
        >
          <MdCreateNewFolder className="size-8" />
        </div>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      renderCell: (params) => (
        <div
          className="mt-1 flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-indigo-400"
          onClick={() => {
            setEditShowModal(true);
            setSelectedSchema(params.row);
          }}
        >
          <FiEdit className="size-6" />
        </div>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      renderCell: (params) => (
        <div
          className="mt-1 flex cursor-pointer justify-center rounded px-3 py-2 text-center font-medium text-red-600"
          onClick={() => {
            setConfirmationModal(true);
            setSchemaId(params.row.id);
          }}
        >
          <MdAutoDelete className="size-6" />
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="text-center p-4">Loading schemas...</div>;
  if (isError) return <div className="text-center p-4 text-red-500">Failed to load schemas</div>;

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
                    fontSize: "1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                  },
                  "& .MuiDataGrid-cell": { fontSize: "0.80rem", color: "#ffffff" },
                  "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                  "& .MuiTablePagination-root": { color: "#ffffff" },
                  "& .MuiDataGrid-footerContainer": { backgroundColor: "#111c44", color: "#ffffff" },
                  "& .MuiDataGrid-toolbarContainer button": { color: "#ffffff" },
                  "& .MuiDataGrid-toolbarContainer svg": { fill: "#ffffff" },
                }}
              />
            </ThemeProvider>
          ) : (
            <div style={{ maxHeight: "600px", width: "100%" }} className="dark:bg-navy-700">
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
                  "& .MuiDataGrid-cell": { fontSize: "0.80rem", color: "#000000" },
                  "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
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
