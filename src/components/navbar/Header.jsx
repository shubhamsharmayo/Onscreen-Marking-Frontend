import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from "motion/react";
import MosLogo from '../MosLogo';
import { LogOut, Menu, Moon, Settings2, Sun, User } from 'lucide-react';
import { useTheme } from 'context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUserDetails } from 'services/common';
import { logout } from 'store/authSlice';

export default function Header({ onToggleSidebar, currentPage }) {
    
    const { theme, toggleTheme } = useTheme();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [userDetails, setUserDetails] = useState("");
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await getUserDetails(token);
            setUserDetails(response.data);
          } catch (error) {
            console.log(error);
          }
        };
        fetchData();
    }, [authState.isAuthenticated, navigate]);

    const handleLogout = async () => {
        try {
        // Convert system time to IST
        const istLogoutTime = new Date(
            new Date().getTime() + 5.5 * 60 * 60 * 1000
        )
            .toISOString()
            .replace("Z", "+05:30");

        await axios.post(
            `${process.env.REACT_APP_API_URL}/api/auth/logout`,
            {
            logoutTime: istLogoutTime,
            },
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );
        } catch (error) {
        console.error("Logout API failed:", error);
        } finally {
        dispatch(logout());
        localStorage.removeItem("token");
        navigate("/auth/sign-in");
        }
    };

    const userAvatarUrl = "https://images.unsplash.com/photo-1729824186589-6bda2448f987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB1c2VyJTIwYXZhdGFyfGVufDF8fHx8MTc3MDA5MDE4N3ww&ixlib=rb-4.1.0&q=80&w=1080";

    return (
        <header className=" sticky top-0 z-40 h-16 md:h-20 w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <div className="h-full w-full px-4 md:px-6 flex items-center">
                {/* Left Section */}
                <div className="w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Sidebar Toggle */}
                        <motion.button
                            onClick={onToggleSidebar}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Menu size={24} className="text-slate-700 dark:text-slate-300" />
                        </motion.button>

                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <MosLogo size={40} />
                            <div className="hidden sm:block">
                            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                                MOS
                            </h1>
                            <p className="text-xs text-slate-600 dark:text-slate-400 -mt-1">Mark On Screen</p>
                            </div>
                        </div>
                    </div>

                    {/* Center Section - Page Title */}
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="hidden md:block"
                    >
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            {currentPage}
                        </h2>
                    </motion.div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Theme Toggle */}
                        {/* <motion.button
                            onClick={toggleTheme}
                            className="relative p-2 md:p-3 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 hover:shadow-lg transition-shadow"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AnimatePresence mode="wait">
                                {theme === 'light' ? (
                                    <motion.div
                                        key="sun"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Sun size={20} className="text-amber-600" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="moon"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Moon size={20} className="text-blue-400" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button> */}

                        {/* User Profile */}
                        <div className="relative" ref={menuRef}>
                            <motion.button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 md:gap-3 p-2 md:px-4 md:py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                            <div className="relative">
                                <img
                                    src={userAvatarUrl}
                                    alt="User Avatar"
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-blue-500"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {userDetails?.name || "Sarah John"}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {userDetails?.email || "sarah@mos.com"}
                                </p>
                            </div>
                            </motion.button>

                            {/* User Dropdown Menu */}
                            <AnimatePresence>
                                {showUserMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                                    >
                                    {/* User Info */}
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                                        <div className="flex items-center gap-3">
                                        <img
                                            src={userAvatarUrl}
                                            alt="User Avatar"
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                            {userDetails?.name || "Sarah John"}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {userDetails?.email || "sarah@mos.com"}
                                            </p>
                                        </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        {/* <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
                                            <User size={18} className="text-slate-600 dark:text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Account
                                            </span>
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
                                            <Settings2 size={18} className="text-slate-600 dark:text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Settings
                                            </span>
                                        </button> */}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                        >
                                            <LogOut size={18} className="text-red-600" />
                                            <span className="text-sm font-medium text-red-600">
                                                Logout
                                            </span>
                                        </button>
                                    </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
