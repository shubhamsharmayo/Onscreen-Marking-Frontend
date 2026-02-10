import NotFoundOuter from "layouts/NotFound/Admin/NotFoundOuter";
import { Routes, Route } from "react-router-dom";
import SignIn from "views/auth/SignIn";
import { motion } from "motion/react";
import { TeacherIllustration } from "components/TeacherIllustration";

export default function Auth() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 p-4 md:p-8">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 opacity-30"
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

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left section - Illustration */}
          <motion.div
            className="hidden h-[600px] items-center justify-center lg:flex"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <TeacherIllustration />
          </motion.div>

          {/* Right section - Login form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full"
          >
            <Routes>
              <Route path={`/sign-in`} element={<SignIn />} />
              <Route path="*" element={<NotFoundOuter />} />
            </Routes>
          </motion.div>
        </div>
        {/* <main className="mx-auto min-h-screen">
          <div className="relative flex h-full items-center justify-center">
            <div className="flex w-full flex-col items-center justify-center bg-indigo-50">
            </div>
          </div>
        </main> */}
      </div>
    </div>
  );
}
