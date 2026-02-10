import React, { useState } from "react";
import CardClasses from "components/cards/CardClasses";
import { getAllClasses } from "../../../services/common";
import ClassModal from "components/modal/ClassModal";
import axios from "axios";
import { toast } from "react-toastify";
import EditClassModal from "components/modal/EditClassModal";
import ConfirmationModal from "components/modal/ConfirmationModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const [currentClass, setCurrentClass] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setEditIsOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [classId, setClassId] = useState("");
  const [formData, setFormData] = useState({
    className: "",
    classCode: "",
    duration: "",
    session: "",
    year: "",
  });

  const queryClient = useQueryClient();

  // 🧠 Fetch all classes
  const {
    data: classes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: getAllClasses,
  });

  // 🧩 Add class mutation
  const addClassMutation = useMutation({
    mutationFn: async (formData) => {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/classes/create/class`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Class added successfully.");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsOpen(false);
      setFormData({
        className: "",
        classCode: "",
        duration: "",
        session: "",
        year: "",
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to add class");
    },
  });

  // 🗑️ Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/classes/remove/class/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setConfirmationModal(false);
    },
    onError: () => {
      toast.error("Failed to delete class");
    },
  });

  // 🧾 Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const { className, classCode, duration, session, year } = formData;

    if (!className || !classCode || !duration || !session || !year) {
      toast.warning("All fields are required.");
      return;
    }

    addClassMutation.mutate(formData);
  };

  // ❌ Handle delete
  const handleDelete = () => {
    deleteClassMutation.mutate(classId);
  };

  if (isLoading) {
    return <p className="mt-10 text-center text-lg">Loading classes...</p>;
  }

  if (isError) {
    return (
      <p className="mt-10 text-center text-lg text-red-600">
        Failed to load classes.
      </p>
    );
  }

  return (
    <div>
      {/* Create Button */}
      <div
        className="hover:text-white-600 active:text-white-500 mb-4 ml-10 ml-2 
        mt-12 inline-block cursor-pointer rounded-md border border-indigo-600 
        bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring"
        onClick={() => setIsOpen(true)}
      >
        Create Class
      </div>

      {/* Create Modal */}
      <ClassModal
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        loading={addClassMutation.isPending}
      />

      {/* Edit Modal */}
      <EditClassModal
        isEditOpen={isEditOpen}
        setEditIsOpen={setEditIsOpen}
        currentClass={currentClass}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Class Grid */}
      <div className="ml-7 grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {classes.length > 0 ? (
          classes.map((class_) => (
            <CardClasses
              key={class_._id}
              setClassId={setClassId}
              setConfirmationModal={setConfirmationModal}
              class_={class_}
              handleDelete={handleDelete}
              setEditIsOpen={setEditIsOpen}
              setCurrentClass={setCurrentClass}
            />
          ))
        ) : (
          <div className="col-span-full mt-12 flex flex-col items-center justify-center">
            <p className="text-lg font-semibold text-gray-700">
              No classes available. Create one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        confirmationModal={confirmationModal}
        onSubmitHandler={handleDelete}
        setConfirmationModal={setConfirmationModal}
        setId={setClassId}
        heading="Confirm Class Removal"
        message="Are you sure you want to remove this class? This will delete all associated data."
        type="error"
      />
    </div>
  );
};

export default Index;
