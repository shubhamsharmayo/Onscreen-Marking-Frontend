import React from 'react';
import { motion } from "motion/react"

export default function MosLogo({ size = 64 }) {
    return (
        <React.Fragment>
            <motion.div
                className="relative"
                style={{ width: size, height: size }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
            >
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '100%', height: '100%' }}
                >

                    {/* Gradient Definition */}
                    <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    </defs>


                    {/* Outer Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="url(#logoGradient)"
                        strokeWidth="3"
                        fill="none"
                    />

                    {/* Inner Design - M O S initials stylized */}
                    <path
                        d="M 25 40 L 25 65 M 25 40 L 35 55 L 45 40 L 45 65"
                        stroke="url(#logoGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />

                     {/* O */}
                    <circle
                        cx="62"
                        cy="52.5"
                        r="10"
                        stroke="url(#logoGradient)"
                        strokeWidth="3"
                        fill="none"
                    />

                    {/* S */}
                    <path
                        d="M 82 45 Q 87 40 87 45 Q 87 50 82 50 Q 77 50 77 55 Q 77 60 82 60"
                        stroke="url(#logoGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                    />

                </svg>

            </motion.div>
        </React.Fragment>
    )
}
