import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const SubQuestionModal = ({ showImageModal, setShowImageModal, schemaId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfFolder, setPdfFolder] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState({});
  

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

        setPdfFolder(res.data?.supplementaryPdfPath || "");
        setTotalPages(res.data?.supplimentaryImageCount || 0);
        console.log(res.data)
        // ✅ reset state when schema changes
        setCurrentPage(1);
        setSelectedPages({});
      } catch (err) {
        toast.error("Failed to load supplementary PDF");
      }
    };

    fetchSchemaPdf();
  }, [schemaId, showImageModal]);

  const togglePageSelection = (page) => {
    setSelectedPages((prev) => ({
      ...prev,
      [page]: !prev[page],
    }));
  };

  const nextPage = () => {
    if (!totalPages) return;

    setCurrentPage((p) => (p < totalPages ? p + 1 : totalPages));
  };

  const prevPage = () => {
    if (!totalPages) return;

    setCurrentPage((p) => (p > 1 ? p - 1 : 1));
  };

  // ✅ Do not render modal if no PDF or no pages
  if (!showImageModal) return null;

  const imageUrl = `${
    process.env.REACT_APP_API_URL
  }/uploadedPdfs/extractedSupplimentaryPdfImages/${encodeURIComponent(
    schemaId
  )}/image_${currentPage}.png`;

  return (
    <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="relative w-11/12 max-w-3xl rounded bg-white p-4">
        <button
          className="absolute right-2 top-1 text-2xl"
          onClick={() => setShowImageModal(false)}
        >
          ×
        </button>

        <h2 className="mb-2 text-lg font-bold">Supplementary PDF</h2>

        <img
          src={imageUrl}
          onError={() => toast.error(`Page ${currentPage} could not be loaded`)}
          className={`h-[600px] w-full cursor-pointer rounded object-contain ${
            selectedPages[currentPage] ? "border-4 border-green-600" : ""
          }`}
          onClick={() => togglePageSelection(currentPage)}
        />

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={prevPage}
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Previous
          </button>

          <span className="font-semibold">
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={nextPage}
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
