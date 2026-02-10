import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar/Sidebar";
import Footer from "components/footer/Footer";
import routes from "routes.js";
import NotFound from "layouts/NotFound/Admin/NotFound";
import Header from "components/navbar/Header";
import ThemeProvider from "context/ThemeContext";
import { AnimatePresence, motion } from "motion/react";

export default function Admin(props) {
  const { ...rest } = props;
  const location = useLocation();
  const [open, setOpen] = React.useState(true);
  const [currentRoute, setCurrentRoute] = React.useState("Dashboard");

  React.useEffect(() => {
    window.addEventListener("resize", () =>
      window.innerWidth < 1200 ? setOpen(false) : setOpen(true)
    );
  }, []);

  React.useEffect(() => {
    getActiveRoute(routes);
  }, [location.pathname]);

  const getActiveRoute = (routes) => {
    let activeRoute = "Dashboard";
    for (let i = 0; i < routes.length; i++) {
      if (
        window.location.href.indexOf(
          routes[i].layout + "/" + routes[i].path
        ) !== -1
      ) {
        setCurrentRoute(routes[i].name);
      }
    }
    return activeRoute;
  };

  const getActiveNavbar = (routes) => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (
        window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
      ) {
        return routes[i].secondary;
      }
    }
    return activeNavbar;
  };

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = "ltr";

  return (
    <ThemeProvider>
      <div className="dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 transition-colors duration-300">
        {/* Animated background */}
        <motion.div
          className="fixed inset-0 opacity-20 dark:opacity-10"
          animate={{
            background: [
              "radial-gradient(circle at 0% 0%, rgba(99, 179, 237, 0.3), transparent 50%)",
              "radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.3), transparent 50%)",
              "radial-gradient(circle at 0% 100%, rgba(52, 211, 153, 0.3), transparent 50%)",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Header */}
        <Header
          onToggleSidebar={() => setOpen((prev) => !prev)}
          currentPage={currentRoute}
        />

        {/* Main content area */}
        <div className="relative flex">
          {/* Sidebar */}
          <Sidebar open={open} onClose={() => setOpen(false)} />

          {/* Content */}
          <main className="relative z-10 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                // key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Routes>
                  {getRoutes(routes)}
                  <Route
                    path="/"
                    element={<Navigate to="/admin/default" replace />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
            <div className="h-27 fixed bottom-0 right-0 p-3">
              <Footer />
            </div>
          </main>
        </div>

        {/* <div className="flex h-full w-full">
          <Sidebar open={open} onClose={() => setOpen(false)} />
          <div className="h-full w-full bg-lightPrimary dark:!bg-navy-900 ">
            <main
              className={`mx-[12px] h-full flex-none transition-all md:pr-2 xl:ml-[280px] `}
            >
              <div className="">
                <Navbar
                  onOpenSidenav={() => setOpen(true)}
                  logoText={"Horizon UI Tailwind React"}
                  brandText={currentRoute}
                  secondary={getActiveNavbar(routes)}
                  {...rest}
                />
                <div className="h-[calc(100vh-172px)] overflow-y-auto pt-5">
                  <Routes>
                    {getRoutes(routes)}
                    <Route
                      path="/"
                      element={<Navigate to="/admin/default" replace />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <div className="h-27 p-3">
                  <Footer />
                </div>
              </div>
            </main>
          </div>
        </div> */}
      </div>
    </ThemeProvider>
  );
}
