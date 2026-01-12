// store/syncMiddleware.js
import socket from "../services/socket/socket";
import { markAnnotationsSynced, markCommentsSynced } from "./annotationSlice";

const syncMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  const annotationActionTypes = [
    "annotation/addAnnotation",
    "annotation/updateAnnotation",
    "annotation/deleteAnnotation",
  ];

  const commentActionTypes = [
    "annotation/addComment",
    "annotation/updateComment",
    "annotation/deleteComment",
  ];

  const state = store.getState().annotation;

  // ---------- ANNOTATIONS ----------
  if (annotationActionTypes.includes(action.type)) {
    // Handle add / update
    if (action.type !== "annotation/deleteAnnotation") {
      const unsyncedAnnotations = state.annotationStore.filter(
        (a) => !a.synced
      );
      unsyncedAnnotations.forEach((a) => socket.emit("add-annotation", a));

      if (unsyncedAnnotations.length)
        store.dispatch(
          markAnnotationsSynced({ ids: unsyncedAnnotations.map((a) => a.id) })
        );
    }

    // Handle delete
    if (action.type === "annotation/deleteAnnotation") {
      const deletedData = action.payload; // same as your reducer uses
      // you can also send metadata (taskId, page) if required by backend
      socket.emit("delete-annotation", {
        taskId: deletedData.taskId,
        answerPdfId: deletedData.answerPdfId,
        page: deletedData.page,
        questionName:deletedData.question,
        allottedMarks:deletedData.mark,
        annotationIds: [deletedData.id],
        userId:deletedData.userId,
        parentQuestionId:deletedData.parentQuestionId
      });
      console.log(deletedData);
    }
  }

  // ---------- COMMENTS ----------
  if (commentActionTypes.includes(action.type)) {
    if (action.type !== "annotation/deleteComment") {
      const unsyncedComments = state.commentStore.filter((c) => !c.synced);
      unsyncedComments.forEach((c) => socket.emit("add-comment", c));

      if (unsyncedComments.length)
        store.dispatch(
          markCommentsSynced({ ids: unsyncedComments.map((c) => c.id) })
        );
    }

    if (action.type === "annotation/deleteComment") {
      const deletedData = action.payload;
      socket.emit("delete-comment", {
         taskId: deletedData.taskId,
        answerPdfId: deletedData.answerPdfId,
        page: deletedData.page,
        commentIds : [deletedData.id],
        userId:deletedData.userId
      });
      console.log(`🗑️ Sent delete-comment for id: ${deletedData}`);
    }
  }

  return result;
};

export default syncMiddleware;
