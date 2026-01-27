// hooks/useAnnotationSocket.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAnnotationsAndCommentsAndMarks } from "../store/annotationSlice";
import socket from "../services/socket/socket";

const useAnnotationSync = (taskId, page, answerPdfId,taskdetails) => {
  const dispatch = useDispatch();
  console.log(taskdetails)

  useEffect(() => {
    if (!taskId || !page) return;

    const room = `task_${taskId}_page_${page}`;

    // Join the correct room
    socket.emit("join-AnnotationRoom", { taskId, page }); 
    console.log("Joined room:", room);
    // console.log({taskId,page,answerPdfId});

    socket.emit("load-page-data", { taskId, page, answerPdfId, userId:taskdetails });
    console.log({ taskId, page, answerPdfId, userId:taskdetails })
    // Load initial data
    socket.on("page-data-loaded", (data) => {
      // if (data.taskId === taskId && data.page === page) {
        console.log(data);
        dispatch(
          setAnnotationsAndCommentsAndMarks({
            annotationStore: data.annotations,
            commentStore: data.comments,
          })
        );
      // }
    });

    // Listen for updates (annotations + comments)
    // socket.on("annotations-updated", (data) => {
    //   // console.log(data)
    //   // if (data.taskId === taskId && data.page === page) {
    //     dispatch(
    //       setAnnotationsAndComments({
    //         annotationStore: data.annotations,
    //         commentStore: data.comments,
    //       })
    //     );
    //   // }
    // });

    return () => {
      socket.off("annotations-updated");
      socket.off("annotations-data");
    };
  }, [taskId, page, dispatch]);
};

export default useAnnotationSync;
