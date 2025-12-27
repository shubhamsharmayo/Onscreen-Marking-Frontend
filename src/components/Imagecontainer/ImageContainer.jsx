import React, { useEffect, useRef, useState } from "react";
import { FiZoomIn, FiZoomOut } from "react-icons/fi";
import { LuPencilLine } from "react-icons/lu";
import { BiCommentAdd } from "react-icons/bi";
import { IoIosArrowDown } from "react-icons/io";
import { GrRedo, GrUndo } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import Tools from "./Tools";
import throttle from "lodash.throttle";
import { jwtDecode } from "jwt-decode";
import { getAllEvaluatorTasks } from "components/Helper/Evaluator/EvalRoute";
import socket from "../../services/socket/socket";
import {
  addComment,
  updateComment,
  deleteComment,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  addMark,
  updateMark,
  deleteMark,
} from "../../store/annotationSlice";
import {
  setCurrentIcon,
  setIsDraggingIcon,
  setRerender,
  setIcons,
} from "store/evaluatorSlice";
import { Rnd } from "react-rnd";
import { postMarkById } from "components/Helper/Evaluator/EvalRoute";
import { createIcon } from "components/Helper/Evaluator/EvalRoute";
import { getIconsByImageId } from "components/Helper/Evaluator/EvalRoute";
import { deleteIconByImageId } from "components/Helper/Evaluator/EvalRoute";
import html2canvas from "html2canvas";
import { submitImageById } from "components/Helper/Evaluator/EvalRoute";
import useAnnotationSync from "../../hook/useAnnotationSync";

const IconsData = [{ imgUrl: "/blank.jpg" },{imgUrl: "/not_attempt.png"}];

const preprocessImage = (canvas) => {
  const context = canvas.getContext("2d");

  // Convert the image to grayscale (preprocessing step)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg; // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};
const ImageContainer = (props) => {
  const [scale, setScale] = useState(1); // Initial zoom level
  const [icons, setIcons] = useState([]); // State for placed icons
  // const [isDraggingIcon, setIsDraggingIcon] = useState(false); // Track if an icon is being dragged
  // const [currentIcon, setCurrentIcon] = useState(null); // Store the currently selected icon
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Track mouse position for preview
  const [iconModal, setIconModal] = useState(false);
  const [draggedIconIndex, setDraggedIconIndex] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false); // Drawing mode toggle
  const [drawing, setDrawing] = useState([]); // Store strokes
  const evaluatorState = useSelector((state) => state.evaluator);
  const [scalePercent, setScalePercent] = useState(100);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [canvasStates, setCanvasStates] = useState({});
  const [currentImage, setCurrentImage] = useState(null);
  const [startDrawing, setStartDrawing] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [mouseBasePos, setMouseBasePos] = useState({ x: 0, y: 0 });
  const [mouseUp, setMouseUp] = useState(false);
  const [selectedColor, setSelectedColor] = useState("red");
  const [isCursorInside, setIsCursorInside] = useState(false);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(10);
  const [comments, setcomments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef(null);
  const currentIndex = evaluatorState.currentIndex;
  const currentQuestionNo = evaluatorState.currentQuestion;
  const baseImageUrl = evaluatorState.baseImageUrl;
  const currentIcon = evaluatorState.currentIcon;
  const isDraggingIcon = evaluatorState.isDraggingIcon;
  const currentMarkDetails = evaluatorState.currentMarkDetails;
  const currentAnswerImageId = evaluatorState.currentAnswerPdfImageId;
  const currentQuestionDefinitionId =
    evaluatorState?.currentQuestionDefinitionId;
  const currentAnswerPdfId = evaluatorState.currentAnswerPdfId;
  const canvasRef = useRef(null);
  const iconRefs = useRef([]);
  const dispatch = useDispatch();
  const commentStore = useSelector((state) => state.annotation.commentStore);
  const iconsStore = useSelector((state) => state.annotation.annotationStore);
  const marksStore = useSelector((state) => state.annotation.marksStore);
  // const icons = evaluatorState.icons;
  // console.log(currentMarkDetails);
  // console.log(props.id)
  const imgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);
  const imageWrapperRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  console.log(currentAnswerPdfId);
  useAnnotationSync(
    props.id,
    currentIndex,
    currentAnswerPdfId,
    props.taskdetails?.userId
  );
  // const [annotations, setAnnotations] = useState([]);
  const debounceTimers = useRef({});

  useEffect(() => {
    const img = imageRef.current;
    if (img && img.complete) {
      setImageDimensions({ width: img.width, height: img.height });
    } else if (img) {
      img.onload = () =>
        setImageDimensions({ width: img.width, height: img.height });
    }
  }, [currentIndex]);

  // console.log(currentIndex)

  // useEffect(()=>{
  //   const canvas = canvasRef.current;
  //   const ctx = canvas.getContext("2d");

  //   // Clear the canvas
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);

  //   // Load the saved state for the current index
  //   if (canvasStates[canvasStates.length-1]) {
  //     const img = new Image();
  //     img.src = canvasStates[currentIndex];
  //     img.onload = () => {
  //       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  //     };
  //   }
  // },[isDrawing])
  // console.log(canvasStates)

  const imageSrc = `${process.env.REACT_APP_API_URL}\\${baseImageUrl}\\image_${currentIndex}.png`;

  console.log(commentStore);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // If image already loaded from cache
    if (img.complete) {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    } else {
      // Wait for image to load
      img.onload = () => {
        setDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
    }

    // Cleanup (avoid memory leaks)
    return () => {
      if (img) img.onload = null;
    };
  }, [imageSrc]); // re-run if the image changes

  // console.log(dimensions);

  const handleAddComments = (e) => {
    const sheetRect = e.currentTarget.getBoundingClientRect();
    const newAnnotation = {
      id: Date.now(),
      page: currentIndex,
      x: e.clientX - sheetRect.left,
      y: e.clientY - sheetRect.top,
      width: 150,
      height: 60,
      text: "",
      taskId: props.id,
      answerPdfId: currentAnswerPdfId,
      userId: props.taskdetails?.userId,
    };
    // const updated = [newAnnotation];
    // setAnnotations(updated);
    dispatch(addComment(newAnnotation));
  };
  // console.log(commentStore);

  const handleDragStop = (id, x, y) => {
    const commentToUpdate = commentStore.find((a) => a.id === id);
    if (!commentToUpdate) return; // Safety check

    const updatedComment = {
      ...commentToUpdate,
      x,
      y,
      synced: false, // mark as unsynced
    };

    dispatch(updateComment(updatedComment));
  };
  const handleCommentChange = (id, e) => {
    const text = e.target.value;

    // Update immediately in the store (instant UI update)
    const updatedComment = {
      ...commentStore.find((c) => c.id === id),
      text,
      synced: false,
    };
    dispatch(updateComment(updatedComment));

    // Only debounce if the key pressed is Backspace
    if (e.nativeEvent.inputType === "deleteContentBackward") {
      if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);

      debounceTimers.current[id] = setTimeout(() => {
        const commentToUpdate = commentStore.find((c) => c.id === id);
        if (!commentToUpdate) return;
        const updated = { ...commentToUpdate, text, synced: false };
        dispatch(updateComment(updated));
      }, 500);
    }
  }; // 500ms after user stops typing };

  // console.log(comments);

  useEffect(() => {
    const fetchAllIcons = async () => {
      const icons = await getIconsByImageId(
        currentAnswerImageId,
        currentQuestionDefinitionId
      );

      if (Array.isArray(icons)) setIcons(icons);
    };
    if (currentQuestionDefinitionId && currentAnswerImageId) {
      fetchAllIcons();
    }
  }, [
    currentQuestionDefinitionId,
    currentAnswerImageId,
    evaluatorState.rerender,
  ]);
  // Handle clicks outside of selected icon

  // Handle double-click outside of the specific image container
  useEffect(() => {
    const handleOutsideDoubleClick = (event) => {
      if (selectedIcon !== null) {
        const selectedIconRef = iconRefs.current[selectedIcon];
        if (selectedIconRef && !selectedIconRef.contains(event.target)) {
          setSelectedIcon(null); // Deselect icon if clicked outside
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideDoubleClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideDoubleClick); // Cleanup on unmount
    };
  }, [selectedIcon]);

  // Load the canvas state when the image changes
  useEffect(() => {
    const loadCanvasState = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Load the saved state for the current index
      if (canvasStates[currentIndex]) {
        const img = new Image();
        img.src = canvasStates[currentIndex];
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
      }
    };

    // Save the current canvas state before changing the index
    if (currentImage !== null) {
      saveCanvasState();
    }

    setCurrentImage(currentIndex); // Track the currently displayed image
    loadCanvasState();
  }, [currentIndex]);

  // Function to update canvas size when image is scaled
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const imageElement = document.querySelector('img[alt="Viewer"]');
      const imageWidth = imageElement ? imageElement.width : 0;
      const imageHeight = imageElement ? imageElement.height : 0;

      // Scale the canvas size based on the scale factor
      const scaledWidth = imageWidth;
      const scaledHeight = imageHeight;

      setCanvasSize({ width: scaledWidth, height: scaledHeight });

      // Update canvas width and height
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
    }
  }, [isDrawing]); // Run effect every time scale changes
  // Draw on the canvas
  useEffect(() => {
    if (startDrawing) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Clear the canvas for redraw
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.lineJoin = "round"; // Smooth line joins

      let prevX = null;
      let prevY = null;

      // Iterate through the drawing array
      drawing.forEach(({ x, y, mode, strokeWidth, color }) => {
        if (mode === "start") {
          // Update previous coordinates for the start of a new stroke
          prevX = x;
          prevY = y;
        }
        if (mode === "draw") {
          context.beginPath();
          context.lineWidth = strokeWidth || currentStrokeWidth; // Use strokeWidth or default to currentStrokeWidth
          context.strokeStyle = color || selectedColor; // Use color or default to selectedColor

          context.moveTo(prevX, prevY); // Start from the previous point
          context.lineTo(x, y); // Draw to the current point
          context.stroke(); // Render the line
          context.closePath();

          // Update previous coordinates
          prevX = x;
          prevY = y;
        }
      });
    }
  }, [drawing, scale, startDrawing, currentStrokeWidth, selectedColor]);

  useEffect(() => {
    setScalePercent(Math.floor(scale * 100));
  }, [scale]);

  // Close the dragging icon when right-clicked
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("contextmenu", handleRightClick); // Right-click handler
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  const handleIconDoubleClick = (icon) => {
    const index = iconsStore.findIndex((index) => index === icon);
    setSelectedIcon(index);
  };

  const handleIconSingleClick = (icon) => {
    const index = iconsStore.findIndex((index) => index === icon);
    console.log(index);
    setSelectedIcon(index);
  };
  // Update cursor position
  const handleBaseMouseMove = throttle((event) => {
    setMouseBasePos({ x: event.clientX, y: event.clientY });
  }, 4); // Update every ~16ms (60FPS)

  useEffect(() => {
    const container = containerRef.current;

    if (container) {
      container.addEventListener("mousemove", handleBaseMouseMove);
      return () =>
        container.removeEventListener("mousemove", handleBaseMouseMove); // Cleanup
    }
  }, []);

  // Save the canvas state as a base64 string
  const saveCanvasState = () => {
    const canvas = canvasRef.current;

    // Get the canvas image as PNG data URL
    const dataURL = canvas.toDataURL("image/png");

    // Optionally, store the canvas state
    setCanvasStates((prevStates) => ({
      ...prevStates,
      [currentImage]: dataURL, // Save the canvas state for the current image
    }));
  };

  const handleDeleteIcon = async (index, icon) => {
    if (icon?.id) {
      console.log(icon);
      // const res = await deleteIconByImageId(icon?._id, currentAnswerPdfId);
      dispatch(deleteAnnotation(icon));
      // setIcons((prevIcons) => prevIcons.filter((_, i) => i !== index)); // Remove the icon
      setSelectedIcon(null); // Reset selected icon
    } else {
      dispatch(deleteAnnotation(icon));
      // setIcons((prevIcons) => prevIcons.filter((_, i) => i !== index)); // Remove the icon
      setSelectedIcon(null);
    }

    dispatch(setRerender());
  };
  // Zoom in and out with smooth transition
  const zoomIn = () => setScale((prevScale) => prevScale + 0.1);
  const zoomOut = () => setScale((prevScale) => prevScale - 0.1);
  // Start drawing when the mouse is pressed down

  const handleCanvasMouseDown = (e) => {
    setStartDrawing(true); // Set flag for drawing
    setMouseUp(false); // Reset mouse up state

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setDrawing((prev) => [
      ...prev,
      {
        x,
        y,
        mode: "start",
        strokeWidth: currentStrokeWidth, // Include current stroke width
        color: selectedColor,
      },
      // Add starting point to differentiate new drawing
    ]);
  };
  // const handleResizeStart = (index, e) => {
  //   e.preventDefault();
  //   e.stopPropagation();

  //   const initialX = e.clientX;
  //   const initialY = e.clientY;
  //   const initialWidth = +icons[index].width;
  //   const initialHeight = +icons[index].height;

  //   const handleMouseMove = (moveEvent) => {
  //     const deltaX = moveEvent.clientX - initialX;
  //     const deltaY = moveEvent.clientY - initialY;

  //     setIcons((prevIcons) =>
  //       prevIcons.map((icon, i) =>
  //         i === index
  //           ? {
  //               ...icon,
  //               width: Math.max(20, initialWidth + deltaX), // Minimum size constraint
  //               height: Math.max(20, initialHeight + deltaY),
  //             }
  //           : icon
  //       )
  //     );
  //   };

  //   const handleMouseUp = () => {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //     document.removeEventListener("mouseup", handleMouseUp);
  //   };

  //   document.addEventListener("mousemove", handleMouseMove);
  //   document.addEventListener("mouseup", handleMouseUp);
  // };

  // Stop drawing when the mouse is released
  const handleCanvasMouseUp = () => {
    setStartDrawing(false);
    setMouseUp(true);
    // setIsDrawing(false);
  };

  // Track mouse movement for dragging icons
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollOffsetX = containerRef.current.scrollLeft;
      const scrollOffsetY = containerRef.current.scrollTop;

      if (isDraggingIcon && draggedIconIndex !== null) {
        const updatedIcons = {
          x: (e.clientX - containerRect.left) / scale, // Adjust for scaling
          y: (e.clientY - containerRect.top) / scale,
        };
        // updatedIcons[draggedIconIndex] = {
        //   ...updatedIcons[draggedIconIndex],
        //   x: (e.clientX - containerRect.left + scrollOffsetX) / scale, // Adjust for scaling
        //   y: (e.clientY - containerRect.top + scrollOffsetY) / scale, // Adjust for scaling
        // };
        // setIcons(updatedIcons);
        dispatch(updateAnnotation(updatedIcons));
      } else if (isDraggingIcon) {
        setMousePos({
          x: (e.clientX - containerRect.left) / scale, // Adjust for scaling
          y: (e.clientY - containerRect.top) / scale, // Adjust for scaling
        });
      } else if (isDrawing && startDrawing) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        setDrawing((prev) => [
          ...prev,
          {
            x,
            y,
            mode: "draw",
            color: selectedColor, // Store the current color
            strokeWidth: currentStrokeWidth,
          },
        ]);
      }
    }
  };

  // Handle icon selection
  const handleIconClick = (iconUrl) => {
    setIsDraggingIcon(true); // Enable dragging mode
    dispatch(setCurrentIcon(iconUrl));
    // setCurrentIcon(iconUrl); // Set the selected icon
    setIconModal(false); // Close the icon modal
  };

  // Handle dropping the icon on the image
  const handleImageClick = async (e) => {
    if (containerRef.current && currentIcon) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const scrollOffsetX = containerRef.current.scrollLeft;
      const scrollOffsetY = containerRef.current.scrollTop;
      const currentTimeStamp = new Date().toLocaleString();
      setTimeout(() => {
        dispatch(setRerender());
      }, 1000);

      if (currentIcon !== "/blank.jpg" && currentIcon !== "/not_attempt.png") {
        const iconBody = {
          answerPdfImageId: currentAnswerImageId,
          questionDefinitionId: currentQuestionDefinitionId,
          iconUrl: currentIcon,
          question: currentQuestionNo,
          timeStamps: currentTimeStamp,
          page: currentIndex,
          x: (e.clientX - containerRect.left) / scale,
          y: (e.clientY - containerRect.top) / scale,
          width: 150,
          height: 80,
          mark: currentMarkDetails.allottedMarks,
          taskId: props.id,
          answerPdfId: currentAnswerPdfId,
          id: currentTimeStamp,
          userId: props.taskdetails?.userId,
        };
        const totalMarksBody = {
          ...currentMarkDetails,
          id: currentTimeStamp,
          // allottedMarks: currentMarkDetails.totalAllocatedMarks,
          taskId: props.id,
          page: currentIndex,
          question: currentQuestionNo,
          userId: props.taskdetails?.userId,
          // timeStamps: currentTimeStamp,
        };
        console.log(totalMarksBody);
        // const response = await postMarkById(totalMarksBody);
        // socket.emit("get-marks", iconBody)
        socket.emit("add-marks", totalMarksBody);
        dispatch(addMark(totalMarksBody));
        // const res = await createIcon(iconBody);
        dispatch(addAnnotation(iconBody));
        // console.log({ ...res });
        // setIcons([
        //   ...icons,
        //   { ...res },

        // ]);
      } else {
        const iconBody = {
          answerPdfImageId: currentAnswerImageId,
          questionDefinitionId: currentMarkDetails?.questionDefinitionId,
          iconUrl: currentIcon,
          question: currentQuestionNo,
          timeStamps: currentTimeStamp,
          page: currentIndex,
          x: (e.clientX - containerRect.left) / scale,
          y: (e.clientY - containerRect.top) / scale,
          width: 150,
          height: 80,
          taskId: props.id,
          answerPdfId: currentAnswerPdfId,
          id: currentTimeStamp,
          userId: props.taskdetails?.userId,
        };

        // const res = await createIcon(iconBody);
        dispatch(addAnnotation(iconBody));
        // setIcons([
        //   ...icons,
        //   { ...res },

        // ]);
      }
      // setCurrentIcon(null);
      dispatch(setCurrentIcon(null));
      dispatch(setRerender());
      setIsDraggingIcon(false);
    }
  };

  // Start dragging an existing icon
  const handleIconDragStart = (index, e) => {
    setDraggedIconIndex(index);
    setIsDraggingIcon(true);
    e.preventDefault(); // Prevent default to avoid text selection
  };

  // Stop dragging an icon
  const handleMouseUp = () => {
    setIsDraggingIcon(false);
    setDraggedIconIndex(null);
  };

  // Handle right-click to stop dragging and hide icon
  const handleRightClick = (e) => {
    e.preventDefault(); // Prevent default context menu
    setIsDraggingIcon(false);
    setDraggedIconIndex(null);
  };

  const IconModal = IconsData.map((item, index) => (
    <img
      key={index}
      onClick={() => handleIconClick(item.imgUrl)}
      src={item.imgUrl}
      width={100}
      height={100}
      className="md h-[60px] w-full cursor-pointer rounded p-2 shadow hover:bg-white"
      alt="icon"
    />
  ));

  const handleZoomValueClick = () => {};
  const ZoomModal = Array.from({ length: 12 }, (_, index) => {
    const zoomValue = 40 + index * 10;
    return (
      <li
        key={index}
        onClick={() => handleZoomValueClick(zoomValue)}
        className="hover:bg-gray-300 "
      >
        {zoomValue}%
      </li>
    );
  });
  const handleZoomMenu = () => {
    setIsZoomMenuOpen(!isZoomMenuOpen);
  };

  const handleDownload = async () => {
    if (!containerRef.current) return null;

    try {
      const imgElement = containerRef.current.querySelector("img");
      const rect = imgElement.getBoundingClientRect();
      // Temporarily adjust styles for capturing full content
      const container = containerRef.current;
      const originalStyle = container.style.cssText;

      // Expand the container to its full scrollable height and width
      // container.style.overflow = "visible";
      container.style.height = `${container.scrollHeight}px`;
      container.style.width = `${container.scrollWidth}px`;

      // Capture the entire container with html2canvas
      const canvas = await html2canvas(container, {
        useCORS: true, // For cross-origin images
        scale: 2, // Increase resolution for better quality
        x: rect.left - containerRef.current.getBoundingClientRect().left, // X offset relative to container
        y: rect.top - containerRef.current.getBoundingClientRect().top, // Y offset relative to container
        width: rect.width, // Width of the image
        height: rect.height, // Height of the image
      });

      // Revert the container's style after capture
      container.style.cssText = originalStyle;

      // // Get the dimensions of the image
      // const imgElement = containerRef.current.querySelector("img");
      // const rect = imgElement.getBoundingClientRect();

      // // Capture the div using html2canvas
      // const canvas = await html2canvas(containerRef.current, {
      //   useCORS: true, // For cross-origin images
      //   scale: 2, // Increase resolution
      //   // x: rect.left - containerRef.current.getBoundingClientRect().left, // X offset relative to container
      //   // y: rect.top - containerRef.current.getBoundingClientRect().top, // Y offset relative to container
      //   // width: rect.width, // Width of the image
      //   // height: rect.height, // Height of the image
      // });

      // Convert the canvas to a Blob (binary data)
      const dataUrl = canvas.toDataURL("image/png");

      //  // Trigger the download
      //  const link = document.createElement("a");
      //  link.href = dataUrl;
      //  link.download = "scaled_image_with_icons.png";
      //  link.click();
      //  return
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const obj = props.ImageObj;

      if (blob && obj) {
        const formData = new FormData();
        formData.append("image", blob, "captured_image.png");
        formData.append("imageName", obj.imageName);
        formData.append("bookletName", obj.bookletName);
        formData.append("subjectcode", obj.subjectCode);

        await submitImageById(formData);
      } else {
        console.error("Failed to capture the image");
      }
    } catch (error) {
      console.error("Failed to capture and download cropped image:", error);
      return null;
    }
  };
  console.log(commentStore);
  console.log(iconsStore);
  console.log(marksStore);
  return (
    <>
      <div style={{ height: "8%" }}>
        <Tools
          scalePercent={scalePercent}
          handleZoomMenu={handleZoomMenu}
          isZoomMenuOpen={isZoomMenuOpen}
          ZoomModal={ZoomModal}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          iconModal={iconModal}
          setIconModal={setIconModal}
          currentIcon={currentIcon}
          IconModal={IconModal}
          setSelectedColor={setSelectedColor}
          setCurrentStrokeWidth={setCurrentStrokeWidth}
          comments={comments}
          setcomments={setcomments}
        />
      </div>
      {/* Image Viewer Section */}
      <button
        onClick={handleDownload}
        id="download-png"
        style={{ display: "none" }}
      >
        Download Image
      </button>
      <div
        ref={containerRef}
        style={{
          border: "1px solid #ccc",
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          width: "100%",
          height: `92%`,
          cursor: isDrawing ? "url('/toolImg/Handwriting.cur'), auto" : "",
        }}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            transition: "transform 0.2s ease-in-out",
            // maxWidth: "none",
            display: "flex",
            justifyContent: "center",

            // width: "100%",
          }}
          id="image-container"
          onMouseEnter={() => {
            setIsCursorInside(true);
          }}
          onMouseLeave={() => {
            setIsCursorInside(false);
          }}
        >
          {/* Render the canvas for drawing */}

          <div
            className="flex justify-center "
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
            }}
            onDoubleClick={comments ? handleAddComments : null}
            onClick={handleImageClick} // Handle image click for dropping the icon
            onMouseMove={handleMouseMove} // Track mouse move for icon dragging preview
            onMouseDown={handleCanvasMouseDown} // Only draw when in drawing mode
            onMouseUp={handleCanvasMouseUp}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Viewer"
              className="block"
              crossOrigin="anonymous"
              onLoad={() => {
                setImageLoaded(true); // mark image as loaded
              }}
              // width={"70vw"}
            />
            <canvas
              // style={{ backgroundColor: "blue" }}
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className={`absolute top-0 z-10 pointer-events-${
                isDrawing ? "auto" : "none"
              }`}

              // style={{
              //   position: "absolute",
              //   top: 0,
              //   left: 0,
              //   pointerEvents: isDrawing ? "auto" : "none", // Only allow drawing in drawing mode
              // }}
            />

            {imageLoaded &&
              commentStore
                .filter((a) => a.taskId === props.id) // 👈 Only show comments for the current page
                .filter((a) => a.page === currentIndex)
                .map((a) => (
                  <Rnd
                    key={a.id}
                    position={{ x: a.x, y: a.y }}
                    size={{ width: a.width, height: a.height }}
                    bounds="parent"
                    onDragStop={(e, d) => handleDragStop(a.id, d.x, d.y)}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      const resizedComment = {
                        ...a,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        x: position.x,
                        y: position.y,
                        synced: false, // mark as unsynced for background sync
                      };

                      dispatch(updateComment(resizedComment));
                    }}
                  >
                    <div className="group relative h-full w-full">
                      {/* Close button */}
                      <button
                        onClick={() => {
                          dispatch(deleteComment(a));

                          // setAnnotations((prev) =>
                          //   prev.filter((item) => item.id !== a.id)
                          // )
                        }}
                        className="absolute -right-3 -top-3 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-red-500 text-white opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-red-600 group-hover:opacity-100"
                        title="Delete comment"
                      >
                        <span className="text-[12px] text-base font-bold leading-none">
                          ✖
                        </span>
                      </button>

                      {/* Comment box */}
                      <div className="h-full w-full overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
                        <textarea
                          className="comment-box bg-transparent h-full w-full resize-none border-none p-3 text-sm outline-none"
                          value={a.text}
                          onChange={(e) => handleCommentChange(a.id, e)}
                          placeholder="Write comment..."
                        />
                      </div>
                    </div>
                  </Rnd>
                ))}

            {/* Render all placed icons */}
            {imageLoaded &&
              iconsStore
                .filter((a) => a.page === currentIndex)
                .map((icon, index) => {
                  const isCheck = icon.iconUrl === "/check.png";
                  const checkClass = isCheck
                    ? "text-green-600 ring-2 ring-green-600"
                    : "text-red-600 ring-2 ring-red-600";
                  const blankClass =
                    icon.iconUrl === "/blank.jpg" ? "none" : "";

                  return (
                    <Rnd
                      key={icon.timeStamps}
                      size={{ width: icon.width, height: icon.height }}
                      position={{ x: icon.x, y: icon.y }}
                      bounds="parent"
                      onDragStop={(e, d) => {
                        const updated = {
                          ...icon,
                          x: d.x,
                          y: d.y,
                          synced: false,
                        };
                        // updated[index] = { ...updated[index], };
                        // console.log(icon);
                        // setIcons(updated);
                        dispatch(updateAnnotation(updated));
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        const updated = {
                          ...icon,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                        };
                        // updated[index] = {
                        //   ...updated[index],
                        //   width: ref.offsetWidth,
                        //   height: ref.offsetHeight,
                        //   x: position.x,
                        //   y: position.y,
                        // };
                        // setIcons(updated);
                        dispatch(updateAnnotation(updated));
                      }}
                      onClick={() => handleIconSingleClick(icon)}
                      onDoubleClick={() => handleIconDoubleClick(icon)}
                      className={`absolute z-10 rounded-lg p-2  ${
                        selectedIcon ===
                        iconsStore.findIndex((index) => index === icon)
                          ? "border-2 border-blue-500"
                          : ""
                      }`}
                      // style={{
                      //   transformOrigin: "top left",
                      // }}
                    >
                      <div className="relative h-full w-full">
                        {/* Delete Button */}
                        {selectedIcon ===
                          iconsStore.findIndex((index) => index === icon) && (
                          <button
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                            onClick={() => handleDeleteIcon(index, icon)}
                          >
                            ✖
                          </button>
                        )}

                        {/* Icon Image */}
                        <img
                          src={icon.iconUrl}
                          alt="icon"
                          className="mx-auto"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />

                        {/* Question & Marks */}
                        <div
                          className="mt-2 text-center text-xl font-semibold text-gray-700"
                          style={{ display: blankClass }}
                        >
                          <span className="mr-1">{`Q${icon.question}`}</span>→
                          <span
                            className={`ml-1 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-gray-50 p-1 font-extrabold ${checkClass}`}
                          >
                            {`${icon?.mark?icon?.mark:0}`}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <div className="text-md mt-1 text-center font-extrabold italic text-gray-700 opacity-75">
                          {icon.timeStamps || "No Timestamp"}
                        </div>
                      </div>
                    </Rnd>
                  );
                })}
          </div>
        </div>
        {/* Icon following the mouse while dragging */}
        {isDraggingIcon && currentIcon && (
          <div
            style={{
              position: "absolute",
              top: `${mousePos.y * scale}px`, // Adjust for scaling
              left: `${mousePos.x * scale}px`, // Adjust for scaling
              zIndex: 1000,
              pointerEvents: "none",
              transform: `scale(${scale})`, // Scale the preview
              transition: "transform 0.2s ease-in-out", // Smooth transition
            }}
          >
            <img src={currentIcon} alt="dragging-icon" width={40} height={40} />
          </div>
        )}

        {/* Display current question number at cursor */}
        {isCursorInside && (
          <div
            className={`z-1000 pointer-events-none fixed rounded bg-gray-100 p-2.5 text-sm shadow-md`}
            style={{
              left: `${mouseBasePos.x}px`,
              top: `${mouseBasePos.y + 5}px`, // Dynamic positioning
            }}
          >
            {`Q(${currentQuestionNo})`}
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ImageContainer);
