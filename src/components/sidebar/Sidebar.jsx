import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  ClipboardList,
  Database,
  FileText,
  GraduationCap,
  LayoutDashboard,
  UserPlus,
  Users,
} from "lucide-react";
import { getUserDetails } from "services/common";
import { Link, useLocation } from "react-router-dom";
import routes from "routes";

export default function Sidebar({ open, onClose }) {
  const [currentRoutes, setCurrentRoutes] = useState([]);
  const token = localStorage.getItem("token");
  let location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getUserDetails(token);

        let filteredRoutes = [];
        if (data?.role === "admin") {
          // console.log(data?.role);
          filteredRoutes = routes.filter(
            (route) =>
              data?.permissions?.includes(route?.name) &&
              !route?.hidden &&
              route?.layout === "/admin"
          );
        } else if (data?.role === "evaluator" || data?.role === "moderator") {
          filteredRoutes = routes.filter(
            (route) =>
              data?.permissions?.includes(route?.name) &&
              !route?.hidden &&
              route?.layout === "/evaluator"
          );
        } else if (data?.role === "reviewer") {
          filteredRoutes = routes.filter(
            (route) =>
              data?.permissions?.includes(route?.name) &&
              !route?.hidden &&
              route?.layout === "/reviewer"
          );
        } else if (data?.role === "principal") {
          filteredRoutes = routes.filter(
            (route) =>
              data?.permissions?.includes(route?.name) &&
              !route?.hidden &&
              route?.layout === "/principal"
          );
        }
        setCurrentRoutes(filteredRoutes);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUser();
  }, [token]);
  console.log("CurrentRoutes", currentRoutes);

  // useEffect(() => {
  //     const fetchUser = async () => {
  //         try {
  //         const { data } = await getUserDetails(token);

  //         let filteredRoutes = [];

  //         if (data?.role && Array.isArray(data?.permissions)) {
  //             filteredRoutes = routes.filter(
  //             (route) =>
  //                 data.permissions.includes(route.name) &&
  //                 !route.hidden &&
  //                 route.layout === `/${data.role}`
  //             );
  //         }

  //         // ✅ FALLBACK: if API gives nothing
  //         if (!filteredRoutes.length) {
  //             filteredRoutes = getFallbackRoutes("/admin"); // default
  //         }

  //         setCurrentRoutes(filteredRoutes);
  //         } catch (error) {
  //         console.error("API failed, loading fallback routes");

  //         // ✅ API FAIL FALLBACK
  //         setCurrentRoutes(getFallbackRoutes("/admin"));
  //         }
  //     };

  //     fetchUser();
  // }, [token]);

  const activeRoute = (routeName) => {
    return location.pathname.includes(routeName);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-black/50 fixed inset-0 z-30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: open ? 280 : 90,
          // x: open ? 0 : -280,
          x: 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className=" dark:bg-slate-900 border-slate-200 dark:border-slate-700 fixed bottom-0 left-0 top-16 z-30 overflow-hidden border-r bg-white md:top-20 lg:relative lg:top-0 lg:z-20"
      >
        <div className="h-[91vh] space-y-2 overflow-y-auto overflow-x-hidden p-4">
          {currentRoutes.map((item, index) => {
            const isActive = activeRoute(item.path);
            // console.log("RouteItem: ", item);
            return (
              <Link
                key={item.id}
                to={item.layout + "/" + item.path}
                // onClick={() => onPageChange(item.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 text-white shadow-lg"
                    : "text-slate-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-500"
                }`}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={{
                    rotate: isActive ? [0, 10, -10, 0] : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isActive ? Infinity : 0,
                    repeatDelay: 3,
                  }}
                >
                  {item.icon}
                </motion.div>
                <span
                  className={`
                                whitespace-nowrap font-medium
                                transition-all duration-300
                                ${
                                  open
                                    ? "ml-0 opacity-100"
                                    : "w-0 overflow-hidden opacity-0"
                                }
                            `}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.aside>
    </>
  );
}
