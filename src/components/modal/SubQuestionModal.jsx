import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const SubQuestionModal = ({ showImageModal, setShowImageModal, schemaId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [selectionType, setSelectionType] = useState(1); // 1 = whole, 2 = partial
  const [selectedPages, setSelectedPages] = useState({});

  const [selections, setSelections] = useState({});
  const [draftSelection, setDraftSelection] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  const imageRef = useRef(null);
  const containerRef = useRef(null);
const token = localStorage.getItem("token");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  /* ---------------- Image Dimensions ---------------- */
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const handleLoad = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    if (img.complete) handleLoad();
    else img.onload = handleLoad;

    return () => {
      if (img) img.onload = null;
    };
  }, [currentPage]);

  function convertPartialPageData(data) {
  const areas = {};

  data.forEach((page) => {
    if (page.type === "PARTIAL_PAGE") {
      areas[page.pageNumber] = page.coordinates.map(
        ({ x, y, width, height }) => ({
          x,
          y,
          width,
          height,
        })
      );
    }
  });

  return {
    coordination: {
      type: "PARTIAL_PAGE",
      areas,
    },
  };
}

  /* ---------------- Fetch Schema ---------------- */
  useEffect(() => {
    if (!schemaId || !showImageModal) return;

    const fetchSchemaPdf = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/schemas/get/schema/${schemaId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
       const data =  convertPartialPageData(res?.data?.supplementaryPages)

        console.log(data)
        setSelections(data);
        setTotalPages(res.data?.supplimentaryImageCount || 0);
        setCurrentPage(1);
        
        setSelectedPages({});
      } catch {
        toast.error("Failed to load supplementary PDF");
      }
    };

    fetchSchemaPdf();
  }, [schemaId, showImageModal]);

  /* ---------------- Whole Page Toggle (PRESERVED) ---------------- */
  const togglePageSelection = (page) => {
    setSelectedPages((prev) => ({
      ...prev,
      [page]: !prev[page],
    }));
  };
console.log(selectedPages)
  /* ---------------- Coordinate Helper ---------------- */
  const getClampedCoords = (e) => {
    const rect = imageRef.current.getBoundingClientRect();

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    return { x, y };
  };

  /* ---------------- Mouse Events (Partial Selection) ---------------- */
  const handleMouseDown = (e) => {
    if (selectionType !== 2) return;
    const { x, y } = getClampedCoords(e);
    setDragStart({ x, y });
    setDraftSelection(null);
  };

  const handleMouseMove = (e) => {
    if (!e.buttons || !dragStart) return;

    const { x, y } = getClampedCoords(e);

    setDraftSelection({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y),
    });
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

  /* ---------------- Cleanup on Page / Mode Change ---------------- */
  useEffect(() => {
    setDragStart(null);
    setDraftSelection(null);
    
  }, [currentPage, selectionType]);
  console.log(selections)


 const handleSubmit = async () => {
  try {
    const coordination =
      selectionType === 1
        ? {
            type: "WHOLE_PAGE",
            areas: Object.keys(selectedPages)
              .filter((page) => selectedPages[page])
              .map(Number),
          }
        : {
            type: "PARTIAL_PAGE",
            areas: selections,
          };

    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/schemas/getcoordinates/${schemaId}`,
      { coordination },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(response.data);
    toast.success("Coordinates submitted successfully");
  } catch (error) {
    console.error(error);
    toast.error("Failed to submit coordinates");
  }
};

  if (!showImageModal) return null;

  const imageUrl = `${
    process.env.REACT_APP_API_URL
  }/uploadedPdfs/extractedSupplimentaryPdfImages/${encodeURIComponent(
    schemaId
  )}/image_${currentPage}.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-11/12 max-w-3xl rounded bg-white p-4">
        <button
          className="absolute right-2 top-1 text-2xl"
          onClick={() => setShowImageModal(false)}
        >
          ×
        </button>

        <h2 className="mb-2 text-lg font-bold">Supplementary PDF</h2>

        {/* Selection Mode */}
        <div className="flex justify-center gap-3 mb-3">
          <button
            className={`rounded px-4 py-2 text-white ${
              selectionType === 1 ? "bg-indigo-800" : "bg-indigo-600"
            }`}
            onClick={() => {
              setSelectionType(1);
              setSelections({})
            }}
          >
            Whole Page
          </button>

          <button
            className={`rounded px-4 py-2 text-white ${
              selectionType === 2 ? "bg-indigo-800" : "bg-indigo-600"
            }`}
            onClick={() => setSelectionType(2)}
          >
            Partial Page
          </button>
        </div>

        {/* Fixed Container */}
        <div
          ref={containerRef}
          className="flex justify-center"
          style={{ height: "40rem", overflow: "hidden" }}
        >
          <div className="overflow-auto">
            <div
              className="relative"
              style={{
                width: dimensions.width,
                height: dimensions.height,
              }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: selectionType === 2 ? "crosshair" : "pointer",
                  display: "block",
                }}
                onClick={
                  selectionType === 1
                    ? () => togglePageSelection(currentPage)
                    : undefined
                }
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onError={() =>
                  toast.error(`Page ${currentPage} could not be loaded`)
                }
              />

              {/* Whole Page Highlight */}
              {selectedPages[currentPage] && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    border: "4px solid #16a34a",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Saved Partial Selections */}
              {selections[currentPage]?.map((sel, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: sel.x,
                    top: sel.y,
                    width: sel.width,
                    height: sel.height,
                    border: "2px solid #16a34a",
                    backgroundColor: "rgba(22, 163, 74, 0.25)",
                    pointerEvents: "none",
                  }}
                />
              ))}

              {/* Draft Selection */}
              {draftSelection && (
                <div
                  style={{
                    position: "absolute",
                    left: draftSelection.x,
                    top: draftSelection.y,
                    width: draftSelection.width,
                    height: draftSelection.height,
                    border: "2px solid #2563eb",
                    backgroundColor: "rgba(37, 99, 235, 0.25)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-3 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Previous
          </button>

          <span className="font-semibold">
            Page {currentPage} / {totalPages}
          </span>
          <span>
            <button onClick={handleSubmit}>Submit</button>
          </span>

          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubQuestionModal;
