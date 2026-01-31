import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import SchemaQuestion from "../schemas/SchemaQuestion";
import { FaFileUpload, FaMapMarkerAlt } from "react-icons/fa";
import SubQuestionModal from "../../../components/modal/QuestionMappingModal";
import Tooltip from "@mui/material/Tooltip";
import { FaCloudUploadAlt } from "react-icons/fa";

const CreateSchemaStructure = () => {
  const [schemaData, setSchemaData] = useState(null);
  const [savedQuestionData, setSavedQuestionData] = useState([]);
  const [folders, setFolders] = useState([]);
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const countRef = useRef();
  const formRefs = useRef({});
  const [isSubQuestion, setIsSubQuestion] = useState(false);
  const [createShowModal, setCreateShowModal] = useState(false);
  const [questionData, setQuestionData] = useState({});
  const [editShowModal, setEditShowModal] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [schemaId, setSchemaId] = useState("");
  const [openPageDropdown, setOpenPageDropdown] = useState(null);
  // stores folderId of opened dropdown

  const [loading, setLoading] = useState(false);

  const [savingStatus, setSavingStatus] = useState({});
  const [deletingStatus, setDeletingStatus] = useState({});
  const [parentId, setParentId] = useState([]);
  const [currentQuestionNo, setCurrentQuesNo] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState([]);
  const [subQuestionsFirst, setSubQuestionsFirst] = useState([]);
  const [error, setError] = useState(false);
  //const [remainingMarks, setRemainingMarks] = useState("");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  const [questionToAllot, setQuestionToAllot] = useState("");
  const [subQuestionMap, setSubQuestionMap] = useState({});
  const hasRunRef = useRef(false);
  const fileInputRef = useRef(null);
  const coordinateStore = useRef({});

  const navigate = useNavigate();

  useEffect(() => {
    if (currentQuestionNo && !/^\d+-\d+$/.test(currentQuestionNo)) {
      setParentId([]);
    }
  }, [currentQuestionNo]);

  useEffect(() => {
    const fetchedData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/schemas/get/schema/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = response?.data;

        setSchemaData((prev) => ({ ...prev, ...data }));
        setSelectedSchema({
          id: data._id,
          ...data,
        });

        if (data?.totalQuestions) {
          setFolders(generateFolders(data.totalQuestions));
        }
      } catch (error) {
        console.error("Error fetching schema data:", error);
      }
    };
    fetchedData();
  }, [id, token]);

  useEffect(() => {
    const handler = (e) => {
      const { questionKey, coordinatePayload } = e.detail; // ✅ correct key
      coordinateStore.current[String(questionKey)] = coordinatePayload; // ensure string key
      toast.success("Coordinates attached to question");
    };

    window.addEventListener("questionCoordinatesSelected", handler);
    return () =>
      window.removeEventListener("questionCoordinatesSelected", handler);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/schemas/getall/questiondefinitions/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(response);
        const data = response?.data?.data || [];
        setSavedQuestionData(data);

        const totalMarksUsed = data.reduce(
          (acc, question) => acc + (question?.maxMarks || 0),
          0
        );
        console.log(totalMarksUsed);
        //setRemainingMarks((schemaData?.maxMarks || 0) - totalMarksUsed);

        const remainingQuestions =
          (schemaData?.totalQuestions || 0) - data.length;
        setQuestionToAllot(remainingQuestions > 0 ? remainingQuestions : 0);
      } catch (error) {
        console.error("Error fetching schema data:", error);

        if (error.response?.status === 404) {
          setSavedQuestionData([]);
        }
      }
    };

    fetchData();
  }, [id, token, schemaData, setSavedQuestionData, parentId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".relative")) {
        setOpenPageDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSchemaFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF or ZIP files are allowed");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("answerFile", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/schemas/uploadAnswerPdf/${id}`, // ✅ SCHEMA ID
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data?.message || "File uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      event.target.value = "";
    }
  };

  const remainingMarks = useMemo(() => {
    if (!schemaData) return 0;

    const totalUsed = savedQuestionData.reduce((sum, q) => {
      // Parent question with sub-questions → count parent max only
      if (q.isSubQuestion) {
        return sum + (q.maxMarks || 0);
      }

      // Normal question
      return sum + (q.maxMarks || 0);
    }, 0);

    return (schemaData.maxMarks || 0) - totalUsed;
  }, [schemaData, savedQuestionData]);

  // NEW: Helper function to calculate total marks of sub-questions
  const calculateSubQuestionsTotalMarks = (parentFolderId) => {
    const subQuestions = subQuestionMap[parentFolderId] || [];

    return subQuestions.reduce((total, sq) => {
      if (!sq) return total; // 🛑 prevent crash
      return total + (Number(sq.maxMarks) || 0);
    }, 0);
  };

  const totalPages = Number(schemaData?.numberOfPage || 0);

  // hiddenPage is index-based → convert to page numbers
  const hiddenPages = useMemo(() => {
    return (schemaData?.hiddenPage || []).map((p) => Number(p) + 1);
  }, [schemaData]);

  const allPages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  const usedPages = useMemo(() => {
    const set = new Set();
    savedQuestionData.forEach((q) => {
      if (Array.isArray(q.page)) {
        q.page.forEach((p) => set.add(Number(p)));
      }
    });
    return set;
  }, [savedQuestionData]);

  const getAvailablePages = (currentPages = []) => {
    return allPages.filter(
      (p) =>
        !hiddenPages.includes(p) && // not hidden
        (!usedPages.has(p) || currentPages.includes(p)) // allow editing existing
    );
  };

  const clampMarks = (value, min, max) => {
    if (value === "" || value === null) return "";
    return Math.min(Math.max(Number(value), min), max);
  };

  // NEW: Helper function to get parent question max marks
  // const getParentMaxMarks = (parentFolderId) => {
  //   const parentQuestion = savedQuestionData.find(
  //     (item) => parseInt(item.questionsName) === parentFolderId
  //   );
  //   return parentQuestion?.maxMarks || 0;
  // };

  //   const handleOpenMapping = (questionId) => {
  //   setActiveQuestionId(questionId);
  //   setShowMappingModal(true);
  // };
  //
  // const handleOpenLocate = (questionId) => {
  //   setActiveQuestionId(questionId);
  //   setShowLocateModal(true);
  // };

  const generateFolders = (count) => {
    const folders = [];
    for (let i = 1; i <= count; i++) {
      folders.push({
        id: i,
        name: `Q. ${i}`,
        children: [],
        showInputs: false,
        isSubQuestion: false,
      });
    }
    return folders;
  };

  const toggleInputsVisibility = (folderId) => {
    const updateFolders = (folders) =>
      folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            showInputs: !folder.showInputs,
            isSubQuestion: !folder.isSubQuestion,
          };
        }
        if (folder.children.length > 0) {
          return { ...folder, children: updateFolders(folder.children) };
        }
        return folder;
      });

    setFolders((prevFolders) => updateFolders(prevFolders));
  };

  const handleDeleteQuestion = async (folder, level, parentFolderId = null) => {
    const folderId = folder.id;
    if (deletingStatus[folderId]) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${folder.name}? ${
        folder.children?.length > 0
          ? "This will also delete all sub-questions."
          : ""
      }`
    );
    if (!confirmDelete) return;

    setDeletingStatus((prev) => ({ ...prev, [folderId]: true }));

    try {
      let currentQ = [];
      let currentSQ = [];

      if (level === 0) {
        currentQ = savedQuestionData.filter(
          (item) => parseInt(item.questionsName) === folderId
        );
      } else if (level > 0 && parentFolderId) {
        const parentSubQuestions = subQuestionMap[parentFolderId] || [];
        currentSQ = parentSubQuestions.filter(
          (item) => item.questionsName === String(folderId)
        );
      }

      const questionToDelete =
        level > 0 && currentSQ.length > 0 ? currentSQ[0] : currentQ[0];

      if (!questionToDelete || !questionToDelete._id) {
        toast.warning("No saved question to delete");
        setDeletingStatus((prev) => ({ ...prev, [folderId]: false }));
        return;
      }

      // Delete the question
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/schemas/delete/questiondefinition/${questionToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 🔥 NEW: If it's a main question (level 0), renumber all questions after it
      if (level === 0) {
        // Get all main questions that come after the deleted question
        const questionsToRenumber = savedQuestionData
          .filter((item) => {
            const questionNum = parseInt(item.questionsName);
            return questionNum > folderId && !item.questionsName.includes(".");
          })
          .sort(
            (a, b) => parseInt(a.questionsName) - parseInt(b.questionsName)
          );

        // Renumber each question (shift down by 1)
        for (const question of questionsToRenumber) {
          const oldQuestionNum = parseInt(question.questionsName);
          const newQuestionNum = oldQuestionNum - 1;

          await axios.put(
            `${process.env.REACT_APP_API_URL}/api/schemas/update/questiondefinition/${question._id}`,
            {
              ...question,
              questionsName: String(newQuestionNum),
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Also renumber all sub-questions for this question
          const subQuestions = savedQuestionData.filter(
            (item) => item.parentQuestionId === question._id
          );

          for (const subQ of subQuestions) {
            const subQuestionParts = subQ.questionsName.split(".");
            const newSubQuestionName = `${newQuestionNum}.${subQuestionParts[1]}`;

            await axios.put(
              `${process.env.REACT_APP_API_URL}/api/schemas/update/questiondefinition/${subQ._id}`,
              {
                ...subQ,
                questionsName: newSubQuestionName,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          }
        }

        // Update schema's totalQuestions
        const newTotalQuestions = (schemaData?.totalQuestions || 0) - 1;

        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/schemas/update/schema/${id}`,
          {
            ...schemaData,
            totalQuestions: newTotalQuestions,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // 🔥 NEW: If it's a sub-question, renumber sibling sub-questions
      if (level > 0 && parentFolderId) {
        const parentSubQuestions = subQuestionMap[parentFolderId] || [];
        const deletedSubQuestionParts = String(folderId).split(".");
        const deletedSubIndex = parseInt(deletedSubQuestionParts[1]);

        // Get all sub-questions that come after the deleted one
        const subQuestionsToRenumber = parentSubQuestions
          .filter((sq) => {
            const parts = sq.questionsName.split(".");
            return parseInt(parts[1]) > deletedSubIndex;
          })
          .sort((a, b) => {
            const aIndex = parseInt(a.questionsName.split(".")[1]);
            const bIndex = parseInt(b.questionsName.split(".")[1]);
            return aIndex - bIndex;
          });

        // Renumber each sub-question (shift down by 1)
        for (const subQ of subQuestionsToRenumber) {
          const parts = subQ.questionsName.split(".");
          const oldSubIndex = parseInt(parts[1]);
          const newSubIndex = oldSubIndex - 1;
          const newSubQuestionName = `${parentFolderId}.${newSubIndex}`;

          await axios.put(
            `${process.env.REACT_APP_API_URL}/api/schemas/update/questiondefinition/${subQ._id}`,
            {
              ...subQ,
              questionsName: newSubQuestionName,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        // Update parent question's numberOfSubQuestions
        const parentQuestion = savedQuestionData.find(
          (item) => parseInt(item.questionsName) === parentFolderId
        );

        if (parentQuestion) {
          await axios.put(
            `${process.env.REACT_APP_API_URL}/api/schemas/update/questiondefinition/${parentQuestion._id}`,
            {
              ...parentQuestion,
              numberOfSubQuestions:
                (parentQuestion.numberOfSubQuestions || 0) - 1,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }
      }

      toast.success("Question deleted and renumbered successfully");

      // Reload to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete question"
      );
    } finally {
      setDeletingStatus((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  const handleUpdate = async (schemaId, updatedData) => {
    try {
      setLoading(true);

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/schemas/update/schema/${schemaId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Schema updated successfully");
      setEditShowModal(false);

      // ✅ FULL PAGE REFRESH
      window.location.reload();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubQuestionsChange = async (
    folder,
    _,
    level,
    parentFolderId = null
  ) => {
    const folderId = folder.id;
    setCurrentQuesNo(folderId);
    console.log(_);

    if (savingStatus[folderId]) return;

    let currentQ = [];
    let currentSQ = [];

    if (level === 0) {
      currentQ = savedQuestionData.filter(
        (item) => parseInt(item.questionsName) === folderId
      );
    } else if (level > 0 && parentFolderId) {
      const parentSubQuestions = subQuestionMap[parentFolderId] || [];
      currentSQ = parentSubQuestions.filter(
        (item) => item.questionsName === String(folderId)
      );
    }

    const existingQuestion =
      level > 0 && currentSQ.length > 0 ? currentSQ[0] : currentQ[0];

    let parentQuestionId = null;
    if (level > 0 && parentFolderId) {
      const parentQuestion = savedQuestionData.find(
        (item) => parseInt(item.questionsName) === parentFolderId
      );
      parentQuestionId =
        parentQuestion?._id || existingQuestion?.parentQuestionId || null;
    }

    const pages =
      formRefs.current[`${folderId}-page`] ?? existingQuestion?.page ?? [];

    const minMarks = Number(
      formRefs.current[`${folderId}-minMarks`] ??
        existingQuestion?.minMarks ??
        0
    );

    const maxMarks = Number(
      formRefs.current[`${folderId}-maxMarks`] ??
        existingQuestion?.maxMarks ??
        0
    );

    const bonusMarks = Number(
      formRefs.current[`${folderId}-bonusMarks`] ??
        existingQuestion?.bonusMarks ??
        0
    );

    const marksDifference = Number(
      formRefs.current[`${folderId}-marksDifference`] ??
        existingQuestion?.marksDifference ??
        0
    );

    const page =
      formRefs.current[`${folderId}-page`] ?? existingQuestion?.page ?? "";

    let numberOfSubQuestions = "";
    let compulsorySubQuestions = "";

    if (folder.isSubQuestion) {
      numberOfSubQuestions += formRefs?.current[
        `${folderId}-numberOfSubQuestions`
      ]
        ? formRefs?.current[`${folderId}-numberOfSubQuestions`]
        : existingQuestion
        ? existingQuestion?.numberOfSubQuestions
        : "";

      compulsorySubQuestions += formRefs?.current[
        `${folderId}-compulsorySubQuestions`
      ]
        ? formRefs?.current[`${folderId}-compulsorySubQuestions`]
        : existingQuestion
        ? existingQuestion?.compulsorySubQuestions
        : "";
    }

    const getParentMaxMarks = (parentFolderId) => {
      const parentQuestion = savedQuestionData.find(
        (item) => String(item.questionsName) === String(parentFolderId)
      );
      return Number(parentQuestion?.maxMarks) || 0;
    };

    // NEW: Validation for sub-questions - check if sum exceeds parent max marks
    if (level > 0 && parentFolderId) {
      const parentMaxMarks = getParentMaxMarks(parentFolderId);
      const currentSubQuestionsTotal =
        calculateSubQuestionsTotalMarks(parentFolderId);

      // Calculate what the new total would be
      const existingSubQuestionMarks = existingQuestion?.maxMarks || 0;
      const newTotal =
        currentSubQuestionsTotal -
        existingSubQuestionMarks +
        parseFloat(maxMarks);

      if (newTotal > parentMaxMarks) {
        toast.error(
          `Sub-questions total marks (${newTotal}) cannot exceed parent question marks (${parentMaxMarks}). Current sub-questions total: ${currentSubQuestionsTotal}`
        );
        return;
      }
    }

    if (level === 0) {
      // MAIN QUESTION
      // Only check schema remaining marks if this question does NOT have sub-questions
      if (!folder.isSubQuestion) {
        if (maxMarks > remainingMarks + (existingQuestion?.maxMarks || 0)) {
          toast.error("Max Marks cannot exceed remaining marks");
          return;
        }
      }
    }

    // PAGE VALIDATION
    if (pages.length > 0) {
      // 1️⃣ Page must be within total pages
      const invalidPage = pages.find((p) => p < 1 || p > totalPages);

      if (invalidPage) {
        toast.error(`Page ${invalidPage} exceeds total pages (${totalPages})`);
        return;
      }

      // 2️⃣ Page must not be hidden
      const hiddenSelected = pages.find((p) => hiddenPages.includes(p));

      if (hiddenSelected) {
        toast.error(`Page ${hiddenSelected} is hidden and cannot be selected`);
        return;
      }

      // 3️⃣ Remove duplicates
      const uniquePages = [...new Set(pages)];
      formRefs.current[`${folderId}-page`] = uniquePages;
    }

    const effectiveRemainingMarks =
      remainingMarks + (existingQuestion?.maxMarks || 0);

    if (minMarks > effectiveRemainingMarks || minMarks > maxMarks) {
      return toast.error(
        "Min Marks cannot be greater than remaining marks or max marks"
      );
    }

    if (maxMarks % marksDifference !== 0 || maxMarks < marksDifference)
      return toast.error(
        "Marks Difference cannot be greater than Max marks or Marks Difference Always Multiple of Max marks"
      );

    if (bonusMarks > maxMarks)
      return toast.error("Bonus Marks cannot be greater than Max marks");

    const updatedQuestionData = {
      schemaId: id,
      questionsName: String(folderId),
      isSubQuestion: folder.isSubQuestion,
      minMarks,
      maxMarks,
      bonusMarks,
      marksDifference,
      page: pages.length ? pages : [],
      numberOfSubQuestions: parseInt(numberOfSubQuestions) || 0,
      compulsorySubQuestions: parseInt(compulsorySubQuestions) || 0,
      parentQuestionId: parentQuestionId,
      coordinates: coordinateStore.current[String(folderId)] || null,
    };

    console.log(updatedQuestionData);
    console.log(level);

    setSavingStatus((prev) => ({ ...prev, [folderId]: true }));

    try {
      if (existingQuestion && existingQuestion._id) {
        console.log("Updating question:", existingQuestion._id);
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/schemas/update/questiondefinition/${existingQuestion._id}`,
          updatedQuestionData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success(
          response?.data?.message || "Question updated successfully"
        );

        const updatedData = response.data.data;

        if (level === 0) {
          setSavedQuestionData((prev) =>
            prev.map((item) =>
              item._id === existingQuestion._id ? updatedData : item
            )
          );
        } else if (level > 0 && parentFolderId) {
          setSubQuestionMap((prev) => {
            const updated = { ...prev };
            if (updated[parentFolderId]) {
              updated[parentFolderId] = updated[parentFolderId].map((sq) =>
                sq._id === existingQuestion._id ? updatedData : sq
              );
            }
            return updated;
          });
        }

        if (level === 0 && folder.isSubQuestion) {
          const obj = { [level + 1]: updatedData._id };
          setParentId((prev) => {
            const filtered = prev.filter((p) => !p[level + 1]);
            return [...filtered, obj];
          });
        }

        if (folder.isSubQuestion && numberOfSubQuestions) {
          const updatedFolders = (folders) => {
            return folders.map((item) => {
              if (item.id === folderId) {
                const children = Array.from(
                  { length: numberOfSubQuestions },
                  (_, i) => ({
                    id: `${folderId}.${i + 1}`,
                    name: `Q. ${folderId}.${i + 1}`,
                    children: [],
                    showInputs: false,
                  })
                );
                return { ...item, children };
              }
              if (item.children && item.children.length > 0) {
                return { ...item, children: updatedFolders(item.children) };
              }
              return item;
            });
          };

          setFolders((prevFolders) => updatedFolders(prevFolders));
        }
      } else {
        console.log("Creating new question");
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/schemas/create/questiondefinition`,
          updatedQuestionData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success(
          response?.data?.message || "Question created successfully"
        );

        const newData = response.data.data;

        if (level === 0) {
          setSavedQuestionData((prev) => [...prev, newData]);
        } else if (level > 0 && parentFolderId) {
          setSubQuestionMap((prev) => ({
            ...prev,
            [parentFolderId]: [...(prev[parentFolderId] || []), newData],
          }));
        }

        const obj = { [level + 1]: newData._id };
        setParentId((prev) => [...prev, obj]);

        if (folder.isSubQuestion && numberOfSubQuestions) {
          const updatedFolders = (folders) => {
            return folders.map((item) => {
              if (item.id === folderId) {
                const children = Array.from(
                  { length: numberOfSubQuestions },
                  (_, i) => ({
                    id: `${folderId}.${i + 1}`,
                    name: `Q. ${folderId}.${i + 1}`,
                    children: [],
                    showInputs: false,
                  })
                );
                return { ...item, children };
              }
              if (item.children && item.children.length > 0) {
                return { ...item, children: updatedFolders(item.children) };
              }
              return item;
            });
          };

          setFolders((prevFolders) => updatedFolders(prevFolders));
        }
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error(
        error?.response?.data?.message || "Failed to save the question data."
      );
    } finally {
      setSavingStatus((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  const handleFolderClick = async (folderId) => {
    console.log(folderId);
    const currentQuestionInfo =
      savedQuestionData?.filter((item) =>
        item.questionsName.startsWith(String(folderId))
      ) || [];

    if (currentQuestionInfo.length === 0) {
      toast.warning("No sub-questions");
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/schemas/get/questiondefinition/${currentQuestionInfo[0]._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(response);
      const subQuestionsNumber =
        Number(response?.data?.data?.parentQuestion?.numberOfSubQuestions) || 0;

      setSubQuestionMap((prev) => ({
        ...prev,
        [folderId]: response?.data?.data?.subQuestions || [],
      }));

      setSubQuestionsFirst(response?.data?.data?.parentQuestion || []);
      setFolders((prevFolders) =>
        prevFolders.map((folder) => {
          if (folder.id !== folderId) return folder;

          return {
            ...folder,
            isCollapsed: !folder.isCollapsed,
            showInputs: !folder.isCollapsed,
            children:
              folder.children?.length > 0
                ? folder.children
                : Array.from({ length: subQuestionsNumber }, (_, i) => ({
                    id: `${folderId}.${i + 1}`,
                    name: `Q. ${folderId}.${i + 1}`,
                    children: [],
                    showInputs: false,
                    isSubQuestion: true,
                  })),
          };
        })
      );
      console.log(folders);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const handleFinalSubmit = async () => {
    if (questionToAllot != 0 || remainingMarks != 0) {
      toast.error("Please Allocate all questions & marks!!!");
      return;
    }

    const updatedSchemaData = {
      ...schemaData,
      status: true,
      isActive: true,
    };

    if (remainingMarks) return toast.error("Remaining marks should be 0");

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/schemas/update/schema/${id}`,
        updatedSchemaData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Schema data updated successfully");
      navigate(`/admin/schema`);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    if (
      !hasRunRef.current &&
      savedQuestionData.length > 0 &&
      folders.length > 0
    ) {
      hasRunRef.current = true;

      // Auto-expand folders that have sub-questions
      folders.forEach((folder) => {
        const currentQuestionInfo = savedQuestionData.filter((item) =>
          item.questionsName.startsWith(String(folder.id))
        );

        if (
          currentQuestionInfo.length > 0 &&
          currentQuestionInfo[0]?.isSubQuestion
        ) {
          handleFolderClick(folder.id);
        }
      });
    }
  }, [savedQuestionData, folders]);

  const renderFolder = (
    folder,
    level = 0,
    isLastChild = false,
    parentFolderId = null
  ) => {
    const folderId = folder.id;
    const isSaving = savingStatus[folderId] || false;
    const isDeleting = deletingStatus[folderId] || false;
    const folderStyle = `relative ml-${level * 4} mt-3`;
    const color = level % 2 === 0 ? "bg-[#f4f4f4]" : "bg-[#fafafa]";

    const getAllowedMaxMarks = () => {
      const schemaMax = Number(schemaData?.maxMarks) || 0;
      const alreadyUsed = Number(displayData[0]?.maxMarks || 0);
      return Math.min(schemaMax, remainingMarks + alreadyUsed);
    };

    const handleMarkChange = (inputBoxName, inputValue, event) => {
      // 1️⃣ Allow clearing
      if (inputValue === "") {
        formRefs.current[inputBoxName] = "";
        return;
      }

      // 2️⃣ Numeric only
      if (!/^\d+(\.\d+)?$/.test(inputValue)) return;

      const numericValue = Number(inputValue);
      if (Number.isNaN(numericValue)) return;

      const isSubQuestion = level > 0 && parentFolderId !== null;

      let allowedMax;

      // 3️⃣ Decide limit source
      if (isSubQuestion) {
        // 🔥 SUB-QUESTION → parent max marks
        allowedMax =
          formRefs.current[`${parentFolderId}-maxMarks`] ??
          savedQuestionData.find(
            (q) => parseInt(q.questionsName) === parentFolderId
          )?.maxMarks ??
          0;
      } else if (displayData[0]?.isSubQuestion) {
        // 🔥 PARENT QUESTION WITH SUB-QUESTIONS → its own max
        allowedMax =
          formRefs.current[`${folderId}-maxMarks`] ??
          displayData[0]?.maxMarks ??
          0;
      } else {
        // 🔥 NORMAL QUESTION → schema limit
        allowedMax = getAllowedMaxMarks();
      }

      let safeValue = clampMarks(numericValue, 0, allowedMax);
      formRefs.current[inputBoxName] = safeValue;

      // 5️⃣ Min ≤ Max
      if (inputBoxName.includes("minMarks")) {
        const currentMax =
          formRefs.current[inputBoxName.replace("minMarks", "maxMarks")] ??
          allowedMax;

        if (numericValue > currentMax) {
          toast.error("Min Marks cannot be greater than Max Marks");
          return; // ⛔ block update
        }
      }

      // 6️⃣ Force UI correction
      if (event && numericValue !== safeValue) {
        event.target.value = safeValue;
        toast.error(`Marks cannot exceed ${allowedMax}`);
      }

      formRefs.current[inputBoxName] = safeValue;
    };

    let displayData = [];

    if (level === 0) {
      displayData = savedQuestionData.filter(
        (item) => parseInt(item.questionsName) === folderId
      );
    } else if (level > 0 && parentFolderId) {
      const parentSubQuestions = subQuestionMap[parentFolderId] || [];
      displayData = parentSubQuestions.filter(
        (item) => item.questionsName === String(folderId)
      );
    }

    // NEW: Calculate and display remaining marks for parent questions with sub-questions
    const question = displayData?.[0] || null;

    const showSubQuestionMarksInfo =
      level === 0 && question?.isSubQuestion === true;

    const subQuestionsTotal = showSubQuestionMarksInfo
      ? calculateSubQuestionsTotalMarks(folderId)
      : 0;

    const remainingSubMarks = showSubQuestionMarksInfo
      ? (Number(question?.maxMarks) || 0) - subQuestionsTotal
      : 0;

    return (
      <div
        className={`${folderStyle} p-4 ${color} rounded shadow dark:bg-navy-900 dark:text-white`}
        key={`${folder.id}-${displayData[0]?._id || "new"}`}
      >
        {level > 0 && (
          <div
            className={`absolute left-[-16px] top-[-16px] ${
              isLastChild ? "h-1/2" : "h-full"
            } w-[2px] rounded-[12px] border-l-2 border-[#8a8a8a] bg-gradient-to-b from-gray-400 to-gray-500`}
          ></div>
        )}
        {level > 0 && (
          <div className="absolute left-[-16px] top-[16px] h-[2px] w-4 rounded-md bg-gradient-to-r from-gray-400 to-gray-500"></div>
        )}
        <div className="w-full">
          <div className="flex items-center justify-start gap-6">
            <div className="w-20">
              <span
                className="text-black-500 cursor-pointer font-semibold"
                onClick={() => handleFolderClick(folder.id)}
              >
                📁 {folder?.name}
              </span>
            </div>

            <div className="w-20">
              <input
                key={`max-${folderId}-${displayData[0]?._id || "new"}-${
                  displayData[0]?.maxMarks ?? 0
                }`}
                type="number"
                inputMode="numeric"
                placeholder="Max"
                defaultValue={displayData[0]?.maxMarks ?? ""}
                onChange={(e) => {
                  formRefs.current[`${folderId}-maxMarks`] = e.target.value;
                }}
                className="w-full rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div className="w-20">
              <input
                key={`${folderId}-minMarks-${displayData[0]?._id || "new"}`}
                onChange={(e) => {
                  handleMarkChange(`${folder.id}-minMarks`, e.target.value);
                }}
                type="number"
                inputMode="numeric"
                placeholder="Min"
                defaultValue={displayData[0]?.minMarks ?? ""}
                className="w-full rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div className="w-20">
              <input
                key={`${folderId}-bonusMarks-${displayData[0]?._id || "new"}`}
                onChange={(e) => {
                  handleMarkChange(`${folder.id}-bonusMarks`, e.target.value);
                }}
                type="number"
                inputMode="numeric"
                placeholder="Bonus"
                className="w-full rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                defaultValue={displayData[0]?.bonusMarks ?? ""}
              />
            </div>

            <div className="w-40">
              <input
                key={`${folderId}-marksDifference-${
                  displayData[0]?._id || "new"
                }`}
                onChange={(e) => {
                  handleMarkChange(
                    `${folder.id}-marksDifference`,
                    e.target.value
                  );
                }}
                type="number"
                inputMode="numeric"
                placeholder="Marks Difference"
                defaultValue={displayData[0]?.marksDifference || ""}
                className="w-full rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div className="relative w-44">
              {/* Button */}
              <div
                onClick={() =>
                  setOpenPageDropdown(
                    openPageDropdown === folderId ? null : folderId
                  )
                }
                className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-center dark:border-gray-700 dark:bg-navy-900"
              >
                {Array.isArray(displayData[0]?.page) &&
                displayData[0]?.page.length > 0
                  ? `Pages: ${displayData[0].page.join(", ")}`
                  : "Select Pages"}
              </div>

              {/* Dropdown Panel */}
              {openPageDropdown === folderId && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-navy-800">
                  {getAvailablePages(displayData[0]?.page || []).map((page) => {
                    const selectedPages =
                      formRefs.current[`${folderId}-page`] ??
                      displayData[0]?.page ??
                      [];

                    const isChecked = selectedPages.includes(page);

                    return (
                      <label
                        key={page}
                        className="flex cursor-pointer items-center gap-2 px-3 py-1 hover:bg-indigo-100 dark:hover:bg-navy-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            let updated = [...selectedPages];

                            if (isChecked) {
                              updated = updated.filter((p) => p !== page);
                            } else {
                              updated.push(page);
                            }

                            formRefs.current[`${folderId}-page`] = updated;
                            setSchemaData((prev) => ({ ...prev })); // force re-render
                          }}
                        />
                        <span>Page {page}</span>
                      </label>
                    );
                  })}

                  {getAvailablePages(displayData[0]?.page || []).length ===
                    0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No pages available
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex w-12 items-center justify-center">
              <Tooltip title="Map Supplementary PDF" arrow>
                <div
                  className="flex cursor-pointer justify-center rounded px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                  onClick={() => {
                    setActiveQuestionId(folder.id); // 🔥 USE QUESTION NUMBER
                    setShowQuestionModal(true);
                  }}
                >
                  <FaFileUpload className="text-yellow-600" size={18} />
                </div>
              </Tooltip>
            </div>

            <div className="flex w-28 items-center justify-center gap-2">
              <input
                key={`${folderId}-isSubQuestion-${
                  displayData[0]?._id || "new"
                }`}
                id={`isSubQuestion-${folderId}`}
                type="checkbox"
                className="cursor-pointer dark:bg-navy-900 dark:text-white"
                defaultChecked={displayData[0]?.isSubQuestion || false}
                onChange={() => {
                  toggleInputsVisibility(folder?.id);
                  setIsSubQuestion((prev) => !prev);
                }}
              />

              <label
                htmlFor={`isSubQuestion-${folderId}`}
                className="w-full cursor-pointer text-sm font-medium text-gray-700 dark:text-white"
              >
                Sub Questions
              </label>
            </div>

            <div className="w-20">
              <button
                className="font-md w-20 rounded-lg border-2 border-gray-900 bg-blue-800 px-2 py-1.5 text-white"
                disabled={isSaving}
                onClick={() =>
                  handleSubQuestionsChange(
                    folder,
                    countRef?.current?.value,
                    level,
                    parentFolderId
                  )
                }
              >
                {isSaving
                  ? "Saving..."
                  : displayData[0]?._id
                  ? "Update"
                  : "Save"}
              </button>
            </div>

            <div className="w-20">
              <button
                className="font-md w-20 rounded-lg border-2 border-gray-900 bg-red-600 px-2 py-1.5 text-white hover:bg-red-700 disabled:bg-gray-400"
                disabled={isDeleting}
                onClick={() =>
                  handleDeleteQuestion(folder, level, parentFolderId)
                }
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {/* NEW: Show sub-question marks summary for parent questions */}
          {showSubQuestionMarksInfo && (
            <div className="ml-12 mt-2 flex items-center gap-4 text-sm">
              <span
                className={`font-medium ${
                  remainingSubMarks < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                Sub-questions: {subQuestionsTotal}/
                {displayData[0]?.maxMarks || 0} marks used
                {remainingSubMarks < 0 && " ⚠️ EXCEEDED!"}
              </span>
            </div>
          )}

          {folder.showInputs && (
            <div className="ml-12 mt-4 flex items-center gap-4">
              <label className="ml-2 text-sm text-gray-700 dark:text-white">
                No. of Sub-Questions:
              </label>
              <input
                key={`${folderId}-numberOfSubQuestions-${
                  displayData[0]?._id || "new"
                }`}
                onChange={(e) => {
                  handleMarkChange(
                    `${folder.id}-numberOfSubQuestions`,
                    e.target.value
                  );
                }}
                type="text"
                className="w-20 rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                defaultValue={displayData[0]?.numberOfSubQuestions || ""}
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-white">
                No. of compulsory Sub-Questions
              </label>
              <input
                key={`${folderId}-compulsorySubQuestions-${
                  displayData[0]?._id || "new"
                }`}
                onChange={(e) => {
                  handleMarkChange(
                    `${folder.id}-compulsorySubQuestions`,
                    e.target.value
                  );
                }}
                type="text"
                defaultValue={displayData[0]?.compulsorySubQuestions || ""}
                className="w-20 rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {folder.children?.map((child, index) =>
          renderFolder(
            child,
            level + 1,
            index === folder?.children?.length - 1,
            level === 0 ? folder.id : parentFolderId
          )
        )}
      </div>
    );
  };

  return (
    <div
      className="max-h-[75vh] min-w-[1000px] space-y-4 overflow-x-auto overflow-y-scroll rounded-lg 
    border border-gray-300 px-5  dark:border-gray-700 dark:bg-navy-700"
    >
      <div className="sticky top-0 z-20 mb-4 flex justify-between bg-white p-3 shadow dark:bg-navy-700">
        <span className="cursor-pointer rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700">
          Questions To Allot: {questionToAllot ? questionToAllot : 0}
        </span>
        <span className="cursor-pointer rounded-lg bg-green-600 p-2 text-white hover:bg-green-700">
          Marks To Allot: {remainingMarks ? remainingMarks : 0}
        </span>
        <span>
          <div
            className="hover:bg-transparent inline-block cursor-pointer items-center rounded border border-indigo-600 bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            onClick={() => setEditShowModal(true)}
          >
            Edit Question Schema
          </div>
        </span>

        <span>
          <Tooltip title="Upload Answer PDF / ZIP" arrow>
            <div
              className="inline-flex cursor-pointer items-center rounded border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaCloudUploadAlt className="mr-2" />
              Upload File
            </div>
          </Tooltip>
        </span>

        <span
          className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          onClick={handleFinalSubmit}
        >
          Submit
        </span>
      </div>
      {folders.map((folder) => renderFolder(folder))}

      <SchemaQuestion
        editShowModal={editShowModal}
        setEditShowModal={setEditShowModal}
        selectedSchema={selectedSchema}
        handleUpdate={handleUpdate}
        loading={loading}
      />

      {showQuestionModal && (
        <SubQuestionModal
          showImageModal={showQuestionModal}
          setShowImageModal={setShowQuestionModal}
          schemaId={id} // ✅ from useParams
          questionId={activeQuestionId} // ✅ selected question
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.zip"
        style={{ display: "none" }}
        onChange={handleSchemaFileUpload}
      />
    </div>
  );
};

export default CreateSchemaStructure;
