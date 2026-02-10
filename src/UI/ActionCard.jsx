import { motion } from "motion/react";

export default function ActionCard({
  label,
  description,
  color = "blue",
  icon: Icon,
  onClick,
  disabled = false,
}) {
  const styles = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 shadow-sm
        ${styles.bg} ${styles.border}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      {Icon && (
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.bg}`}
        >
          <Icon className={`${styles.text}`} size={20} />
        </div>
      )}

      <div className="flex flex-col">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium ">
          {label}
        </span>
        <span className={`text-sm font-semibold ${styles.text}`}>
          {description}
        </span>
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
