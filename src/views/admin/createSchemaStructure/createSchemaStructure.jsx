import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const CreateSchemaStructure = () => {
  const [schemaData, setSchemaData] = useState(null);
  const [savedQuestionData, setSavedQuestionData] = useState([]);
  const [folders, setFolders] = useState([]);
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const countRef = useRef();
  const formRefs = useRef({});
  const [isSubQuestion, setIsSubQuestion] = useState(false);
  const [questionData, setQuestionData] = useState({});
  const [savingStatus, setSavingStatus] = useState({});
  const [deletingStatus, setDeletingStatus] = useState({});
  const [parentId, setParentId] = useState([]);
  const [currentQuestionNo, setCurrentQuesNo] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState([]);
  const [subQuestionsFirst, setSubQuestionsFirst] = useState([]);
  const [error, setError] = useState(false);
  const [remainingMarks, setRemainingMarks] = useState("");
  const [questionToAllot, setQuestionToAllot] = useState("");
  const [subQuestionMap, setSubQuestionMap] = useState({});

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
        setRemainingMarks((schemaData?.maxMarks || 0) - totalMarksUsed);

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

  const extractParentId = (key, arrayOfObjects) => {
    for (let obj of arrayOfObjects) {
      if (obj.hasOwnProperty(key)) {
        return obj[key];
      }
    }
    return null;
  };

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

    // Confirm deletion
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

      // Find the question to delete
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

      const questionToDelete = level > 0 && currentSQ.length > 0 ? currentSQ[0] : currentQ[0];

      if (!questionToDelete || !questionToDelete._id) {
        toast.warning("No saved question to delete");
        
        // Remove from folders structure only
        const removeFolderFromStructure = (folders) => {
          return folders.filter(f => f.id !== folderId).map((folder) => {
            if (folder.children && folder.children.length > 0) {
              return { ...folder, children: removeFolderFromStructure(folder.children) };
            }
            return folder;
          });
        };
        
        setFolders((prevFolders) => removeFolderFromStructure(prevFolders));
        setDeletingStatus((prev) => ({ ...prev, [folderId]: false }));
        return;
      }

      // Delete from backend
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/schemas/delete/questiondefinition/${questionToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response?.data?.message || "Question deleted successfully");

      // Update savedQuestionData
      setSavedQuestionData((prev) => 
        prev.filter((item) => item._id !== questionToDelete._id)
      );

      // Update subQuestionMap if it's a parent with sub-questions
      if (level === 0 && folder.children?.length > 0) {
        setSubQuestionMap((prev) => {
          const updated = { ...prev };
          delete updated[folderId];
          return updated;
        });
      }

      // Remove from folders structure
      const removeFolderFromStructure = (folders) => {
        return folders.filter(f => f.id !== folderId).map((folder) => {
          if (folder.children && folder.children.length > 0) {
            return { ...folder, children: removeFolderFromStructure(folder.children) };
          }
          return folder;
        });
      };

      setFolders((prevFolders) => removeFolderFromStructure(prevFolders));

      // Recalculate remaining marks and questions
      const totalMarksUsed = savedQuestionData
        .filter(item => item._id !== questionToDelete._id)
        .reduce((acc, question) => acc + (question?.maxMarks || 0), 0);
      
      setRemainingMarks((schemaData?.maxMarks || 0) - totalMarksUsed);

    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error(error?.response?.data?.message || "Failed to delete question");
    } finally {
      setDeletingStatus((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  const handleSubQuestionsChange = async (folder, _, level) => {
    const folderId = folder.id;
    setCurrentQuesNo(folderId);

    if (savingStatus[folderId]) return;

    if (error)
      return toast.error(
        `Marks cannot be greater than remaining marks in Question: ${folderId}`
      );

    const currentQ =
      savedQuestionData &&
      savedQuestionData?.filter(
        (item) => parseInt(item.questionsName) === folderId
      );

    setCurrentQuestion(currentQ);

    const minMarks =
      formRefs?.current[`${folderId}-minMarks`] ||
      (currentQ && currentQ[0]?.minMarks);
    const maxMarks =
      formRefs?.current[`${folderId}-maxMarks`] ||
      (currentQ && currentQ[0]?.maxMarks);
    const bonusMarks =
      formRefs?.current[`${folderId}-bonusMarks`] ||
      (currentQ && currentQ[0]?.bonusMarks);
    const marksDifference =
      formRefs.current[`${folderId}-marksDifference`] ||
      (currentQ && currentQ[0]?.marksDifference);

    if (!minMarks || !maxMarks || !bonusMarks || !marksDifference) {
      toast.error("Please fill all the required fields");
      return;
    }

    let numberOfSubQuestions = "";
    let compulsorySubQuestions = "";

    if (folder.isSubQuestion) {
      numberOfSubQuestions += formRefs?.current[
        `${folderId}-numberOfSubQuestions`
      ]
        ? formRefs?.current[`${folderId}-numberOfSubQuestions`]
        : currentQ?.length > 0 || currentQ !== undefined
        ? currentQ[0]?.numberOfSubQuestions
        : "";

      compulsorySubQuestions += formRefs?.current[
        `${folderId}-compulsorySubQuestions`
      ]
        ? formRefs?.current[`${folderId}-compulsorySubQuestions`]
        : currentQ?.length > 0 || currentQ !== undefined
        ? currentQ[0]?.compulsorySubQuestions
        : "";

      if (!numberOfSubQuestions || !compulsorySubQuestions) {
        toast.error("Please fill all sub-question related fields");
        return;
      }
    }

    if (maxMarks > remainingMarks)
      return toast.error("Max Marks cannot be greater than remaining marks");

    if (minMarks > remainingMarks || minMarks > maxMarks)
      return toast.error(
        "Min Marks cannot be greater than remaining marks or max marks"
      );

    if (maxMarks % marksDifference != 0 || maxMarks < marksDifference)
      return toast.error(
        "Marks Difference cannot be greater than Max marks or Marks Difference Always Multiple of Max marks"
      );

    if (bonusMarks > maxMarks)
      return toast.error("Bonus Marks cannot be greater than Max marks");

    const updatedQuestionData = {
      schemaId: id,
      questionsName: folderId,
      isSubQuestion: folder.isSubQuestion,
      minMarks,
      maxMarks,
      bonusMarks,
      marksDifference,
      numberOfSubQuestions: parseInt(numberOfSubQuestions),
      compulsorySubQuestions: parseInt(compulsorySubQuestions),
      parentQuestionId: extractParentId(level, parentId) || null,
    };

    setSavingStatus((prev) => ({ ...prev, [folderId]: true }));

    try {
      if (currentQ && currentQ.length > 0) {
        console.log("put");
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/schemas/update/questiondefinition/${currentQ[0]?._id}`,
          updatedQuestionData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSavedQuestionData((prev) => {
          const newData = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data];
          return [...prev, ...newData];
        });

        toast.success(response?.data?.message);

        const obj = { [level + 1]: response.data.data._id };
        setParentId([...parentId, obj]);
      } else {
        console.log("post");
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/schemas/create/questiondefinition`,
          updatedQuestionData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success(response?.data?.message);
        setSavedQuestionData((prev) => {
          const newData = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data];
          return [...prev, ...newData];
        });

        const obj = { [level + 1]: response.data.data._id };
        setParentId([...parentId, obj]);
      }

      const updatedFolders = (folders) => {
        return folders.map((item) => {
          if (item.id === folderId) {
            const children = Array.from(
              { length: numberOfSubQuestions },
              (_, i) => ({
                id: `${folderId}-${i + 1}`,
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
    } catch (error) {
      console.error("Error creating questions:", error);
      toast.error("Failed to save the question data.");
    } finally {
      setSavingStatus((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  const handleFolderClick = async (folderId) => {
    console.log(folderId);
    const currentQuestionInfo =
      savedQuestionData?.filter((item) =>
        item.questionsName.startsWith(folderId)
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
        [folderId]: response?.data?.data?.subQuestions || []
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
                    id: `${folderId}-${i + 1}`,
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

  const renderFolder = (folder, level = 0, isLastChild = false, parentFolderId = null) => {
    const folderId = folder.id;
    const isSaving = savingStatus[folderId] || false;
    const isDeleting = deletingStatus[folderId] || false;
    const folderStyle = `relative ml-${level * 4} mt-3`;
    const color = level % 2 === 0 ? "bg-[#f4f4f4]" : "bg-[#fafafa]";

    console.log("folderId", folderId);

    const handleMarkChange = (inputBoxName, inputValue) => {
      if (inputBoxName.includes("maxMarks")) {
        if (inputValue > remainingMarks) {
          toast.error("Max Marks cannot be greater than remaining marks");
          setError(true);
          return;
        }
      } else if (inputBoxName.includes("marksDifference")) {
        if (inputValue > remainingMarks) {
          toast.error(
            "Marks Difference cannot be greater than remaining marks"
          );
          setError(true);
          return;
        }
      }
      setCurrentQuesNo(folderId);
      formRefs.current[inputBoxName] = inputValue;
      setError(false);
    };

    let currentQ = [];
    let currentSQ = [];

    if (savedQuestionData && savedQuestionData.length > 0) {
      currentQ = savedQuestionData.filter(
        (item) => parseInt(item.questionsName) === folderId
      );
    }

    if (level > 0 && parentFolderId) {
      const parentSubQuestions = subQuestionMap[parentFolderId] || [];
      currentSQ = parentSubQuestions.filter(
        (item) => item.questionsName === String(folderId)
      );
    }

    console.log("Level:", level);
    console.log("FolderId:", folderId);
    console.log("ParentFolderId:", parentFolderId);
    console.log("currentQ:", currentQ);
    console.log("currentSQ:", currentSQ);

    const displayData = level > 0 && currentSQ.length > 0 ? currentSQ : currentQ;

    return (
      <div
        className={`${folderStyle} p-4 ${color} rounded shadow dark:bg-navy-900 dark:text-white`}
        key={`${folder.id}-${displayData[0]?._id || 'new'}`}
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
                key={`${folderId}-maxMarks-${displayData[0]?._id || 'new'}`}
                onChange={(e) => {
                  handleMarkChange(`${folder.id}-maxMarks`, e.target.value);
                }}
                type="text"
                placeholder="Max"
                className="w-full rounded border border-gray-300 px-2 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                defaultValue={displayData[0]?.maxMarks || ""}
              />
            </div>

            <div className="w-20">
              <input
                key={`${folderId}-minMarks-${displayData[0]?._id || 'new'}`}
                onChange={(e) => {
                  handleMarkChange(`${folder.id}-minMarks`, e.target.value);
                }}
                type="text"
                placeholder="Min"
                defaultValue={displayData[0]?.minMarks ?? ""}
                className="w-full rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div className="w-20">
              <input
                key={`${folderId}-bonusMarks-${displayData[0]?._id || 'new'}`}
                onChange={(e) => {
                  handleMarkChange(`${folder.id}-bonusMarks`, e.target.value);
                }}
                type="text"
                placeholder="Bonus"
                className="w-full rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
                defaultValue={displayData[0]?.bonusMarks ?? ""}
              />
            </div>

            <div className="w-40">
              <input
                key={`${folderId}-marksDifference-${displayData[0]?._id || 'new'}`}
                onChange={(e) => {
                  handleMarkChange(
                    `${folder.id}-marksDifference`,
                    e.target.value
                  );
                }}
                type="text"
                placeholder="Marks Difference"
                defaultValue={displayData[0]?.marksDifference || ""}
                className="w-full rounded border border-gray-300 py-1 text-center focus:border-none focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-500 dark:border-gray-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div className="flex w-28 items-center justify-center gap-2">
              <input
                key={`${folderId}-isSubQuestion-${displayData[0]?._id || 'new'}`}
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
                    level
                  )
                }
              >
                {isSaving
                  ? "Saving..."
                  : displayData[0]?.marksDifference
                  ? "Update"
                  : "Save"}
              </button>
            </div>

            <div className="w-20">
              <button
                className="font-md w-20 rounded-lg border-2 border-gray-900 bg-red-600 px-2 py-1.5 text-white hover:bg-red-700 disabled:bg-gray-400"
                disabled={isDeleting}
                onClick={() => handleDeleteQuestion(folder, level, parentFolderId)}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {folder.showInputs && (
            <div className="ml-12 mt-4 flex items-center gap-4">
              <label className="ml-2 text-sm text-gray-700 dark:text-white">
                No. of Sub-Questions:
              </label>
              <input
                key={`${folderId}-numberOfSubQuestions-${displayData[0]?._id || 'new'}`}
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
                key={`${folderId}-compulsorySubQuestions-${displayData[0]?._id || 'new'}`}
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
          renderFolder(child, level + 1, index === folder?.children?.length - 1, level === 0 ? folder.id : parentFolderId)
        )}
      </div>
    );
  };

  return (
    <div
      className="max-h-[75vh] min-w-[1000px] space-y-4 overflow-x-auto overflow-y-scroll rounded-lg 
    border border-gray-300 p-4 dark:border-gray-700 dark:bg-navy-700"
    >
      <div className="flex justify-between">
        <span className="cursor-pointer rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700">
          Questions To Allot: {questionToAllot ? questionToAllot : 0}
        </span>
        <span className="cursor-pointer rounded-lg bg-green-600 p-2 text-white hover:bg-green-700">
          Marks To Allot: {remainingMarks ? remainingMarks : 0}
        </span>
        <span
          className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          onClick={handleFinalSubmit}
        >
          Submit
        </span>
      </div>
      {folders.map((folder) => renderFolder(folder))}
    </div>
  );
};

export default CreateSchemaStructure;