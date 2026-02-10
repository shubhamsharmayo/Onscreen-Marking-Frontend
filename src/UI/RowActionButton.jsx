import { motion } from "motion/react";

export default function RowActionButton({
  label,
  icon: Icon,
  color = "blue",
  onClick,
  loading = false,
  textColor = "gray-800", // 👈 NEW (default black)
}) {
  const styles = colorMap[color] || colorMap.blue;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={loading}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-sm
        ${styles.bg} ${styles.border} ${styles.hover}
        ${textColor}
        ${loading ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {Icon && <Icon size={16} className={textColor} />}
      {loading ? "Please wait..." : label}
    </motion.button>
  );
}

const colorMap = {
  purple: {
    bg: "bg-purple-200",
    border: "border-purple-400",
    hover: "hover:bg-purple-300",
  },
  blue: {
    bg: "bg-blue-200",
    border: "border-blue-400",
    hover: "hover:bg-blue-300",
  },
  red: {
    bg: "bg-red-200",
    border: "border-red-400",
    hover: "hover:bg-red-300",
  },
};
