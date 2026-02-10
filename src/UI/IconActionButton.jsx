import { motion } from "motion/react";

export default function IconActionButton({
  icon: Icon,
  color = "yellow",
  tooltip,
  onClick,
}) {
  const styles = colorMap[color] || colorMap.yellow;

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={tooltip}
      className={`flex cursor-pointer items-center justify-center rounded-lg p-2 ${styles.bg}`}
    >
      <Icon className={styles.text} size={18} />
    </motion.div>
  );
}

const colorMap = {
  yellow: {
    bg: "hover:bg-yellow-100 dark:hover:bg-yellow-900",
    text: "text-yellow-600",
  },
  blue: {
    bg: "hover:bg-blue-100 dark:hover:bg-blue-900",
    text: "text-blue-600",
  },
  red: {
    bg: "hover:bg-red-100 dark:hover:bg-red-900",
    text: "text-red-600",
  },
};
