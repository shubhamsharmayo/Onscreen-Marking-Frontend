import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useDispatch } from "react-redux";
import { login } from "../../store/authSlice";
import ForgotPassword from "./ForgotPassword";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import logo from "./omr_logo.png";
import MosLogo from "components/MosLogo";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

export function SignIn() {
  const [otp, setOtp] = useState(false);
  const [user, setUser] = useState({
    email: "",
    password: "",
    type: "",
    otp: "",
  });
  const [currentStep, setCurrentStep] = useState("email");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verify, setVerify] = useState(false);

  const navigate = useNavigate();

  const [otpdata, setOtpsdata] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    setUser({
      email: "",
      password: "",
      type: "",
    });
  }, [otp]);

  const handleSubmitEmailPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (localStorage.getItem("token")) localStorage.removeItem("token");
    const updatedUser = { ...user, type: "password" };
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/signin`,
        updatedUser
      );
      toast.success("Logged in successfully!");
      dispatch(login(response.data));
      navigate("/admin");
    } catch (error) {
      toast.error(error?.response?.data?.message);
      // console.log(error?.response?.data?.message);
      setUser({
        email: user.email,
        password: user.password,
        type: user.type,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOtpPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updatedUser = { ...user, type: "otp" };
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/signin`,
        updatedUser
      );
      toast.success(response?.data?.message);
      localStorage.setItem("userId", response?.data?.userId);
    } catch (error) {
      toast.error(error?.response?.data?.message);
      setUser({
        email: "",
        password: "",
        type: "",
        otp: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendForgotOtp = async () => {
    if (!user.email) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/send-otp`,
        { email: user.email }
      );

      toast.success(res.data.message || "OTP sent successfully");
      setOtp(true); // show OTP input
      setCurrentStep("otp");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotOtp = async () => {
    const otpValue = otpdata.join("");

    if (otpValue.length !== 6) {
      toast.error("Enter valid 6-digit OTP");
      return;
    }

    try {
      setVerify(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`,
        {
          email: user.email,
          otp: otpValue,
        }
      );

      toast.success(res.data.message || "OTP verified successfully");
      setOpen(true); // open reset password modal
    } catch (error) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setVerify(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
        {
          email: user.email,
          password: newPassword,
          confirmPassword,
        }
      );

      toast.success(res.data.message || "Password reset successfully");

      // cleanup + redirect
      setOpen(false);
      setForgotPassword(false);
      setOtp(false);
      setUser({ email: "", password: "", otp: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle input changes
  const handleChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otpdata];
      newOtp[index] = value;
      setOtpsdata(newOtp);
      setUser({ ...user, otp: otpdata.join("") });
    }
  };

  // Helper function to handle navigation between input fields
  const handleKeyUp = (e, index) => {
    if (e?.key === "Backspace" && !otpdata[index] && index > 0) {
      e?.target.previousElementSibling?.focus();
    } else if (e?.key !== "Backspace" && index < 5) {
      e?.target.nextElementSibling?.focus();
    }
  };

  const verifyOTP = async () => {
    setVerify(true);
    const userId = localStorage.getItem("userId");

    if (otpdata?.some((digit) => digit === "")) {
      toast.error("Please fill all OTP fields");
      setVerify(false);
      return;
    }

    const otpString = otpdata?.join(""); // Combine individual OTP values into a string

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/verify`,
        { userId, otp: otpString }
      );
      toast.success(response?.data?.message);
      if (localStorage.getItem("token")) localStorage.removeItem("token");
      localStorage.setItem("token", response?.data?.token);
      if (!forgotPassword) {
        navigate("/admin");
      } else {
        setOpen(!open);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setVerify(false);
    }
  };

  // const updatePassword = async () => {
  //   setLoading(true);
  //   const userId = localStorage.getItem("userId");

  //   if (newPassword.length < 8) {
  //     toast.error("Password must be at least 8 characters");
  //     return;
  //   }

  //   if (!newPassword || !confirmPassword) {
  //     toast.error("Please enter new password and confirm password");
  //     return;
  //   }

  //   if (newPassword !== confirmPassword) {
  //     toast.error("Passwords do not match");
  //     return;
  //   }

  //   try {
  //     const response = await axios.put(
  //       `${process.env.REACT_APP_API_URL}/api/auth/forgotpassword`,
  //       { userId, newPassword }
  //     );
  //     toast.success(response?.data?.message);
  //     if (localStorage.getItem("token")) localStorage.removeItem("token");
  //     localStorage.setItem("token", response?.data?.token);
  //   } catch (error) {
  //     toast.error(error?.response?.data?.message);
  //     console.log(error);
  //   } finally {
  //     setLoading(false);
  //     setForgotPassword(false);
  //     setOpen(false);
  //     setConfirmPassword("");
  //     setNewPassword("");
  //     setUser({
  //       email: "",
  //       password: "",
  //       type: "",
  //       otp: "",
  //     });
  //   }
  // };

  return (
    <>
      {/* Glassmorphism card */}
      <div className="relative rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-xl md:p-12">
        {forgotPassword ? (
          <>
            {/* Back button */}
            {currentStep !== "success" && (
              <motion.button
                onClick={() => {
                  setForgotPassword(false);
                  // setOtp(false);
                  setCurrentStep("email");
                  setOtpsdata(["", "", "", "", "", ""]);
                }}
                className="text-slate-600 hover:text-slate-900 mb-6 flex items-center gap-2 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Login</span>
              </motion.button>
            )}

            {/* Logo */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <MosLogo />
            </motion.div>

            {/* Progress steps */}
            {currentStep !== "success" && (
              <div className="mb-8 flex justify-center">
                <div className="flex items-center gap-3">
                  {["email", "send otp", "otp"].map((step, index) => {
                    const stepIndex = ["email", "otp", "reset"].indexOf(
                      currentStep
                    );
                    const isActive = stepIndex >= index;

                    return (
                      <div key={step} className="flex items-center gap-3">
                        <motion.div
                          className={`h-3 w-3 rounded-full transition-all duration-300 ${
                            isActive
                              ? "scale-125 bg-gradient-to-r from-blue-500 to-purple-500"
                              : "bg-slate-300"
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: isActive ? 1.25 : 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        />
                        {index < 2 && (
                          <div
                            className={`h-0.5 w-12 transition-all duration-300 ${
                              stepIndex > index
                                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                : "bg-slate-300"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Logo */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <MosLogo />
            </motion.div>

            {/* Title */}
            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-transparent mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-3xl font-semibold md:text-4xl">
                Welcome Back
              </h1>
              <p className="text-slate-600">Sign in to continue your journey</p>
            </motion.div>
          </>
        )}

        <div className="max-w-xl lg:max-w-3xl">
          <h1 className="animate-bounceCustom text-center font-poppins text-2xl font-bold text-indigo-600 sm:text-3xl md:text-3xl">
            {forgotPassword ? (
              "Forgot Password"
            ) : (
              <div>{/* Hello, <br /> Welcome Back */}</div>
            )}
          </h1>
          {forgotPassword ? (
            <p className="mt-4 leading-relaxed text-gray-700">
              Enter your registered email to receive OTP
            </p>
          ) : (
            <p className="mt-4 text-center leading-relaxed text-gray-700">
              Enter your email address and password.{" "}
              {/* or OTP to access the admin
              panel. */}
            </p>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Login */}
            {currentStep === "email" && (
              <form className="space-y-6" onSubmit={handleSubmitEmailPassword}>
                {/* Email input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    htmlFor="email"
                    className="text-slate-700 mb-2 block text-sm font-medium"
                  >
                    Email ID
                  </label>

                  <div className="relative">
                    <div className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transform">
                      <Mail size={20} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={user.email}
                      required
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      className={`border-slate-200 focus:border-blue-400focus:bg-white w-full rounded-2xl border-2 bg-white/60 py-4 pl-12 pr-4 outline-none backdrop-blur-sm transition-all duration-300 focus:shadow-lg`}
                      placeholder="you@example.com"
                    />
                  </div>
                </motion.div>
                {/* Password input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label
                    htmlFor="password"
                    className="text-slate-700 mb-2 block text-sm font-medium"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <div className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transform">
                      <Lock size={20} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={user.password}
                      required
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                      className={`border-slate-200 w-full rounded-2xl border-2 bg-white/60 py-4 pl-12 pr-12 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg`}
                      placeholder="••••••••"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 absolute right-4 top-1/2 -translate-y-1/2 transform transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                  </div>
                </motion.div>

                {/* Forgot password link */}
                <motion.div
                  className="flex justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(true);
                      // setOtp(true);
                      setCurrentStep("send otp");
                      setOtpsdata(["", "", "", "", "", ""]);
                    }}
                    className="text-sm font-medium text-blue-600 transition-colors hover:text-purple-600"
                  >
                    Forgot Password?
                  </button>
                </motion.div>

                {/* Login button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </form>
            )}

            {/* Step 2: Send OTP */}
            {currentStep === "send otp" && (
              <form className="space-y-6" onSubmit={handleSubmitOtpPassword}>
                <div className="space-y-6">
                  <label
                    htmlFor="email"
                    className="text-slate-700 mb-2 block text-sm font-medium"
                  >
                    Registered Email ID
                  </label>
                  <div className="relative">
                    <div className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transform">
                      <Mail size={20} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      onChange={(e) =>
                        setUser({ ...user, email: e?.target?.value })
                      }
                      value={user?.email}
                      className="border-slate-200 w-full rounded-2xl border-2 bg-white/60 py-4 pl-12 pr-4 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                      placeholder="you@example.com"
                    />
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => {
                      if (forgotPassword) {
                        sendForgotOtp();
                      } else {
                        handleSubmitOtpPassword();
                      }
                      setCurrentStep("otp");
                    }}
                    disabled={loading}
                    className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        Sending OTP...
                      </span>
                    ) : (
                      "Send OTP"
                    )}
                  </motion.button>
                </div>

                {/* <div className="col-span-6">
                  <label
                    htmlFor="otp"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    OTP
                  </label>

                  <div className="flex gap-1 sm:gap-2">
                    {otpdata?.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        className="bg-transparent focus:ring-sky-500 focus:border-sky-500 w-10 rounded-md border border-gray-500 px-2 py-2 text-center text-sm transition duration-300 placeholder:text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 sm:w-12"
                        value={digit}
                        onChange={(e) => handleChange(e.target.value, index)}
                        onKeyUp={(e) => handleKeyUp(e, index)}
                      />
                    ))}
                  </div>
                </div> */}

                {/* <div className="col-span-6 items-center gap-2 sm:justify-between">
                  <button
                    className={`hover:bg-transparent hover:bg-bulue-700 inline-block h-10 rounded-md border border-indigo-600 bg-indigo-600 text-sm font-medium text-white transition hover:bg-indigo-700 hover:text-white ${
                      forgotPassword || otp ? "w-full" : "sm:w-2/3"
                    } `}
                    onClick={forgotPassword ? verifyForgotOtp : verifyOTP}
                    type="button"
                    disabled={verify}
                  >
                    {verify ? (
                      <div
                        className={`flex h-full w-full items-center justify-center ${
                          verify ? "bg-indigo-400" : "bg-indigo-600"
                        }`}
                      >
                        <svg
                          className="mr-2 h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Verifying...
                      </div>
                    ) : forgotPassword ? (
                      "Verify OTP"
                    ) : (
                      "Login with OTP"
                    )}
                  </button>

                  {forgotPassword ? null : (
                    <p className="mt-2 flex justify-center text-sm text-gray-500">
                      <button
                        onClick={() => {setOtp(!otp); setCurrentStep("email");}}
                        className="mt-5 text-indigo-600"
                        cursor="pointer"
                        disabled={verify}
                      >
                        Password based login
                      </button>
                    </p>
                  )}
                </div> */}
              </form>
            )}

            {/* Step 3: OTP Verification */}
            {currentStep === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 text-center">
                  <h1 className="text-transparent mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-3xl font-semibold md:text-4xl">
                    Verify OTP
                  </h1>
                  <p className="text-slate-600">
                    We've sent a 6-digit code to
                    <br />
                    {/* <span className="font-medium text-slate-700">{email}</span> */}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* OTP Input */}
                  <div>
                    <label className="text-slate-700 mb-4 block text-center text-sm font-medium">
                      Enter OTP
                    </label>
                    <div className="flex justify-center gap-2 md:gap-3">
                      {otpdata.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(e.target.value, index)}
                          onKeyUp={(e) => handleKeyUp(e, index)}
                          className="border-slate-200 h-14 w-12 rounded-2xl border-2 bg-white/60 text-center text-xl font-semibold outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg md:h-16 md:w-14"
                        />
                      ))}
                    </div>
                    {/* {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-sm text-red-500 text-center"
                      >
                        {error}
                      </motion.p>
                    )} */}
                  </div>

                  <motion.button
                    type="button"
                    onClick={forgotPassword ? verifyForgotOtp : verifyOTP}
                    disabled={loading}
                    className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        Verifying OTP...
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </motion.button>

                  {forgotPassword ? null : (
                    <p className="text-sm font-medium text-blue-600 transition-colors hover:text-purple-600">
                      <button
                        onClick={() => {
                          setOtp(!otp);
                          setCurrentStep("email");
                        }}
                        className="mt-5 text-indigo-600"
                        cursor="pointer"
                        disabled={verify}
                      >
                        Password based login
                      </button>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
    // <div className="flex h-screen w-full items-center justify-center">
    //   <main className="m-5 animate-fadeIn rounded-3xl border-gray-200 bg-white px-8 pb-8 font-poppins shadow-2xl sm:px-12 2xl:w-4/12">
    //     <div className="logo flex justify-center">
    //       <img src={logo} alt="" width={120} />
    //     </div>

    //     {/* Modal */}
    //     <ForgotPassword
    //       open={open}
    //       setOpen={setOpen}
    //       newPassword={newPassword}
    //       confirmPassword={confirmPassword}
    //       setNewPassword={setNewPassword}
    //       setConfirmPassword={setConfirmPassword}
    //       updatePassword={resetPassword}
    //     />
    //   </main>
    // </div>
  );
}

export default SignIn;
