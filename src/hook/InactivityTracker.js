import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

const INACTIVITY_TIME = 5*60*1000 ;

export default function useInactivityLogout(logoutCallback) {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      logoutCallback();
    }, INACTIVITY_TIME);
  };

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    // start timer immediately
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
      clearTimeout(timerRef.current);
    };
  }, []);
}
