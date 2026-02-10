import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function StatCard({ label, value, color = "blue", icon: Icon }) {
  const styles = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 shadow-sm ${styles.bg} ${styles.border}`}
    >
      {Icon && (
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.bg}`}
        >
          <Icon className={`${styles.text}`} size={20} />
        </div>
      )}

      <div className="flex flex-col">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
          {label}
        </span>
        <span className={`text-xl font-bold ${styles.text}`}>{value}</span>
      </div>
    </motion.div>
  );
}

const colorMap = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
};
