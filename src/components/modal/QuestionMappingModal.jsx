// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// const QuestionMappingModal = ({
//   showImageModal,
//   setShowImageModal,
//   schemaId,
//   questionId,
// }) => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(0);

//   const [selectionType, setSelectionType] = useState(1); // 1 = whole, 2 = partial
//   const [selectedPages, setSelectedPages] = useState({}); // whole pages
//   const [selections, setSelections] = useState({}); // partial areas {page: [rects]}

//   const [draftSelection, setDraftSelection] = useState(null);
//   const [dragStart, setDragStart] = useState(null);

//   const imageRef = useRef(null);
//   const containerRef = useRef(null);
//   const token = localStorage.getItem("token");

//   const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

//   /* ---------------- Image Dimensions ---------------- */
//   useEffect(() => {
//     const img = imageRef.current;
//     if (!img) return;

//     const handleLoad = () => {
//       setDimensions({
//         width: img.naturalWidth,
//         height: img.naturalHeight,
//       });
//     };

//     if (img.complete) handleLoad();
//     else img.onload = handleLoad;

//     return () => {
//       if (img) img.onload = null;
//     };
//   }, [currentPage]);

//   /* ---------------- Fetch Schema Pages Count ---------------- */
//   // useEffect(() => {
//   //   if (!schemaId || !showImageModal) return;

//   //   const fetchSchema = async () => {
//   //     try {
//   //       const res = await axios.get(
//   //         `${process.env.REACT_APP_API_URL}/api/schemas/get/schema/${schemaId}`,
//   //         { headers: { Authorization: `Bearer ${token}` } }
//   //       );

//   //       setTotalPages(res.data?.supplimentaryImageCount || 0);
//   //       setCurrentPage(1);
//   //       setSelectedPages({});
//   //       setSelections({});
//   //     } catch {
//   //       toast.error("Failed to load supplementary PDF");
//   //     }
//   //   };

//   //   fetchSchema();
//   // }, [schemaId, showImageModal, token]);

//   useEffect(() => {
//     if (!schemaId || !showImageModal) return;

//     const fetchPageCount = async () => {
//       const res = await axios.get(
//         `${process.env.REACT_APP_API_URL}/api/schemas/get/answer-pdf-page-count/${schemaId}`
//       );
//       setTotalPages(res.data.totalPages);
//       setCurrentPage(1);
//     };

//     fetchPageCount();
//   }, [schemaId, showImageModal]);

//   /* ---------------- Whole Page Toggle ---------------- */
//   const togglePageSelection = (page) => {
//     setSelectedPages((prev) => ({
//       ...prev,
//       [page]: !prev[page],
//     }));
//   };

//   /* ---------------- Coordinate Helper ---------------- */
//   const getClampedCoords = (e) => {
//     const rect = imageRef.current.getBoundingClientRect();
//     let x = e.clientX - rect.left;
//     let y = e.clientY - rect.top;
//     x = Math.max(0, Math.min(x, rect.width));
//     y = Math.max(0, Math.min(y, rect.height));
//     return { x, y };
//   };

//   /* ---------------- Partial Selection Drawing ---------------- */
//   const handleMouseDown = (e) => {
//     if (selectionType !== 2) return;
//     const { x, y } = getClampedCoords(e);
//     setDragStart({ x, y });
//     setDraftSelection(null);
//   };

//   const handleMouseMove = (e) => {
//     if (!e.buttons || !dragStart) return;
//     const { x, y } = getClampedCoords(e);

//     setDraftSelection({
//       x: Math.min(dragStart.x, x),
//       y: Math.min(dragStart.y, y),
//       width: Math.abs(x - dragStart.x),
//       height: Math.abs(y - dragStart.y),
//     });
//   };

//   const handleMouseUp = () => {
//     if (!dragStart || !draftSelection) {
//       setDragStart(null);
//       return;
//     }

//     setSelections((prev) => ({
//       ...prev,
//       [currentPage]: [...(prev[currentPage] || []), draftSelection],
//     }));

//     setDragStart(null);
//     setDraftSelection(null);
//   };

//   const scaleToNaturalSize = (rect) => {
//     const img = imageRef.current;
//     if (!img) return rect;

//     const scaleX = img.naturalWidth / img.width;
//     const scaleY = img.naturalHeight / img.height;

//     return {
//       x: Math.round(rect.x * scaleX),
//       y: Math.round(rect.y * scaleY),
//       width: Math.round(rect.width * scaleX),
//       height: Math.round(rect.height * scaleY),
//     };
//   };

//   const removeSelection = (page, index) => {
//     setSelections((prev) => {
//       const updated = [...(prev[page] || [])];
//       updated.splice(index, 1);
//       return { ...prev, [page]: updated };
//     });
//   };

//   /* ---------------- Submit ---------------- */
//   const handleSubmit = () => {
//     const wholePages = Object.keys(selectedPages)
//       .filter((p) => selectedPages[p])
//       .map(Number);

//     const formattedPartialAreas = Object.keys(selections).reduce(
//       (acc, page) => {
//         if (selections[page]?.length) {
//           acc[page] = selections[page].map(scaleToNaturalSize);
//         }
//         return acc;
//       },
//       {}
//     );

//     if (
//       wholePages.length === 0 &&
//       Object.keys(formattedPartialAreas).length === 0
//     ) {
//       toast.error("Please select at least one whole or partial page");
//       return;
//     }

//     const coordinatePayload = {
//       wholePages, // ✅ can be empty or filled
//       partialAreas: formattedPartialAreas, // ✅ can be empty or filled
//     };

//     setShowImageModal(false);

//     window.dispatchEvent(
//       new CustomEvent("questionCoordinatesSelected", {
//         detail: { questionKey: questionId, coordinatePayload },
//       })
//     );
//   };

//   if (!showImageModal) return null;

//   const imageUrl = `${process.env.REACT_APP_API_URL}/uploadedPdfs/extractedAnswerPdfImages/${schemaId}/image_${currentPage}.png`;

//   return (
//     <div className="bg-black/40 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
//       <div className="relative w-11/12 max-w-4xl rounded bg-white p-4">
//         <button
//           className="absolute right-2 top-1 text-2xl"
//           onClick={() => setShowImageModal(false)}
//         >
//           ×
//         </button>

//         <h2 className="mb-3 text-lg font-bold">Question Pages Mapping</h2>

//         <div className="mb-3 flex justify-center gap-3">
//           <button
//             className={`rounded px-4 py-2 text-white ${
//               selectionType === 1 ? "bg-indigo-800" : "bg-indigo-600"
//             }`}
//             onClick={() => setSelectionType(1)}
//           >
//             Whole Page
//           </button>
//           <button
//             className={`rounded px-4 py-2 text-white ${
//               selectionType === 2 ? "bg-indigo-800" : "bg-indigo-600"
//             }`}
//             onClick={() => setSelectionType(2)}
//           >
//             Partial Area
//           </button>
//         </div>

//         <div
//           ref={containerRef}
//           className="flex justify-center"
//           style={{ height: "40rem", overflow: "hidden" }}
//         >
//           <div className="overflow-auto">
//             <div
//               className="relative"
//               style={{
//                 width: dimensions.width,
//                 height: dimensions.height,
//               }}
//             >
//               <img
//                 ref={imageRef}
//                 src={imageUrl}
//                 alt=""
//                 draggable={false}
//                 onLoad={() => {
//                   const img = imageRef.current;
//                   if (img) {
//                     setDimensions({
//                       width: img.naturalWidth,
//                       height: img.naturalHeight,
//                     });
//                   }
//                 }}
//                 style={{
//                   width: dimensions.width,
//                   height: dimensions.height,
//                   display: "block",
//                   cursor: selectionType === 2 ? "crosshair" : "pointer",
//                 }}
//                 onClick={
//                   selectionType === 1
//                     ? () => togglePageSelection(currentPage)
//                     : undefined
//                 }
//                 onMouseDown={handleMouseDown}
//                 onMouseMove={handleMouseMove}
//                 onMouseUp={handleMouseUp}
//               />

//               {selectedPages[currentPage] && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     inset: 0,
//                     border: "4px solid #2563eb",
//                     pointerEvents: "none",
//                   }}
//                 />
//               )}

//               {selections[currentPage]?.map((sel, i) => (
//                 <div
//                   key={i}
//                   style={{
//                     position: "absolute",
//                     left: sel.x,
//                     top: sel.y,
//                     width: sel.width,
//                     height: sel.height,
//                     border: "2px solid #16a34a",
//                     backgroundColor: "rgba(22,163,74,0.25)",
//                   }}
//                 >
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       removeSelection(currentPage, i);
//                     }}
//                     style={{
//                       position: "absolute",
//                       top: "-10px",
//                       right: "-10px",
//                       width: "20px",
//                       height: "20px",
//                       borderRadius: "50%",
//                       background: "#dc2626",
//                       color: "#fff",
//                       border: "none",
//                       cursor: "pointer",
//                     }}
//                   >
//                     ×
//                   </button>
//                 </div>
//               ))}

//               {draftSelection && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     left: draftSelection.x,
//                     top: draftSelection.y,
//                     width: draftSelection.width,
//                     height: draftSelection.height,
//                     border: "2px solid #2563eb",
//                     backgroundColor: "rgba(37,99,235,0.25)",
//                     pointerEvents: "none",
//                   }}
//                 />
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="mt-3 flex items-center justify-between">
//           <button
//             onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//             className="rounded bg-indigo-600 px-4 py-2 text-white"
//           >
//             Previous
//           </button>
//           <span className="font-semibold">
//             Page {currentPage} / {totalPages}
//           </span>
//           <button
//             onClick={handleSubmit}
//             className="rounded bg-green-600 px-4 py-2 text-white"
//           >
//             Submit
//           </button>
//           <button
//             onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//             className="rounded bg-indigo-600 px-4 py-2 text-white"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QuestionMappingModal;

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const QuestionMappingModal = ({
  showImageModal,
  setShowImageModal,
  schemaId,
  questionId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [selectionType, setSelectionType] = useState(1);
  const [selectedPages, setSelectedPages] = useState({});
  const [selections, setSelections] = useState({});

  const [draftSelection, setDraftSelection] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const storageKey = `questionMapping_${schemaId}_${questionId}`;

  /* ---------------- Image Dimensions ---------------- */
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const onLoad = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.complete ? onLoad() : (img.onload = onLoad);
    return () => (img.onload = null);
  }, [currentPage]);

  useEffect(() => {
    if (!showImageModal) return;

    // Avoid saving empty state over existing data
    const hasData =
      Object.keys(selectedPages).length > 0 ||
      Object.keys(selections).length > 0;

    if (!hasData) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({ selectedPages, selections, currentPage, selectionType })
    );
  }, [
    selectedPages,
    selections,
    currentPage,
    selectionType,
    showImageModal,
    storageKey,
  ]);

  useEffect(() => {
    if (!showImageModal) return;

    const dataToSave = {
      selectedPages,
      selections,
      currentPage,
      selectionType,
    };

    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [
    selectedPages,
    selections,
    currentPage,
    selectionType,
    showImageModal,
    storageKey,
  ]);

  /* ---------------- Fetch Page Count ---------------- */
  useEffect(() => {
    if (!schemaId || !showImageModal) return;

    axios
      .get(
        `${process.env.REACT_APP_API_URL}/api/schemas/get/answer-pdf-page-count/${schemaId}`
      )
      .then((res) => {
        setTotalPages(res.data.totalPages);

        const saved = localStorage.getItem(storageKey);
        if (!saved) setCurrentPage(1); // ✅ don’t override restored page
      })
      .catch(() => toast.error("Failed to load pages"));
  }, [schemaId, showImageModal, storageKey]);

  /* ---------------- Helpers ---------------- */
  const getPercentCoords = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;

    x = Math.max(0, Math.min(x, 1));
    y = Math.max(0, Math.min(y, 1));

    return { x, y };
  };

  /* ---------------- AUTO SCROLL (X + Y) ---------------- */
  const autoScrollWhileDragging = (e) => {
    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    const threshold = 40;
    const speed = 20;

    if (e.clientY < bounds.top + threshold) container.scrollTop -= speed;
    else if (e.clientY > bounds.bottom - threshold)
      container.scrollTop += speed;

    if (e.clientX < bounds.left + threshold) container.scrollLeft -= speed;
    else if (e.clientX > bounds.right - threshold)
      container.scrollLeft += speed;
  };

  /* ---------------- Whole Page Toggle ---------------- */
  const toggleWholePage = () => {
    if (selectionType !== 1) return;

    setSelectedPages((prev) => ({
      ...prev,
      [currentPage]: !prev[currentPage],
    }));
  };

  /* ---------------- Partial Selection ---------------- */
  const handleMouseDown = (e) => {
    if (selectionType !== 2) return;

    const start = getPercentCoords(e);
    setDragStart(start);
    setDraftSelection(null);
  };

  const handleMouseMove = (e) => {
    if (!e.buttons || !dragStart) return;

    autoScrollWhileDragging(e);

    const curr = getPercentCoords(e);

    const draft = {
      x: Math.min(dragStart.x, curr.x),
      y: Math.min(dragStart.y, curr.y),
      width: Math.abs(curr.x - dragStart.x),
      height: Math.abs(curr.y - dragStart.y),
    };

    setDraftSelection(draft);
  };

  const handleMouseUp = () => {
    if (!dragStart || !draftSelection) {
      setDragStart(null);
      return;
    }

    setSelections((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), draftSelection],
    }));

    setDragStart(null);
    setDraftSelection(null);
  };

  /* ---------------- Scale to Natural ---------------- */
  const scaleToNaturalSize = (rect) => ({
    x: Math.round(rect.x * dimensions.width),
    y: Math.round(rect.y * dimensions.height),
    width: Math.round(rect.width * dimensions.width),
    height: Math.round(rect.height * dimensions.height),
  });

  const removeSelection = (page, index) => {
    setSelections((prev) => {
      const updated = [...(prev[page] || [])];
      updated.splice(index, 1);
      return { ...prev, [page]: updated };
    });
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = () => {
    const wholePages = Object.keys(selectedPages)
      .filter((p) => selectedPages[p])
      .map(Number);

    const formattedPartialAreas = Object.keys(selections).reduce(
      (acc, page) => {
        if (selections[page]?.length) {
          acc[page] = selections[page].map(scaleToNaturalSize);
        }
        return acc;
      },
      {}
    );

    if (
      wholePages.length === 0 &&
      Object.keys(formattedPartialAreas).length === 0
    ) {
      toast.error("Please select at least one whole or partial page");
      return;
    }
    localStorage.removeItem(storageKey);
    setShowImageModal(false);

    window.dispatchEvent(
      new CustomEvent("questionCoordinatesSelected", {
        detail: {
          questionKey: questionId,
          coordinatePayload: {
            wholePages,
            partialAreas: formattedPartialAreas,
          },
        },
      })
    );
  };

  if (!showImageModal) return null;

  const imageUrl = `${process.env.REACT_APP_API_URL}/uploadedPdfs/extractedAnswerPdfImages/${schemaId}/image_${currentPage}.png`;

  return (
    <div className="bg-black/60 fixed inset-0 z-50 pt-4 backdrop-blur-sm">
      <div className="flex h-full flex-col bg-white">
        {/* Controls */}
        <div className="mt-16 flex justify-around gap-3 border-b p-3">
          <h2 className="text-black ml-96 text-center  text-lg font-bold">
            Question Pages Mapping
          </h2>
          <button
            onClick={() => setSelectionType(1)}
            className={`rounded px-4 py-2 text-white ${
              selectionType === 1 ? "bg-indigo-800" : "bg-indigo-600"
            }`}
          >
            Whole Page
          </button>
          <button
            onClick={() => setSelectionType(2)}
            className={`rounded px-4 py-2 text-white ${
              selectionType === 2 ? "bg-indigo-800" : "bg-indigo-600"
            }`}
          >
            Partial Area
          </button>
          <button
            onClick={() => setShowImageModal(false)}
            className="text-black text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Image Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100 p-4"
        >
          <div className="relative mx-auto w-fit">
            <img
              ref={imageRef}
              src={imageUrl}
              draggable={false}
              onClick={toggleWholePage}
              style={{
                maxHeight: "calc(100vh - 260px)",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                cursor: selectionType === 2 ? "crosshair" : "pointer",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />

            {selectedPages[currentPage] && selectionType === 1 && (
              <div className="pointer-events-none absolute inset-0 border-4 border-blue-600" />
            )}

            {draftSelection && (
              <div
                className="pointer-events-none absolute border-2 border-blue-600 bg-blue-600/20"
                style={{
                  left: `${draftSelection.x * 100}%`,
                  top: `${draftSelection.y * 100}%`,
                  width: `${draftSelection.width * 100}%`,
                  height: `${draftSelection.height * 100}%`,
                }}
              />
            )}

            {selections[currentPage]?.map((sel, i) => (
              <div
                key={i}
                className="absolute border-2 border-green-600 bg-green-600/20"
                style={{
                  left: `${sel.x * 100}%`,
                  top: `${sel.y * 100}%`,
                  width: `${sel.width * 100}%`,
                  height: `${sel.height * 100}%`,
                }}
              >
                <button
                  onClick={() => removeSelection(currentPage, i)}
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="ml-96 rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Previous
          </button>

          <span className="font-semibold">
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={handleSubmit}
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            Submit
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionMappingModal;
