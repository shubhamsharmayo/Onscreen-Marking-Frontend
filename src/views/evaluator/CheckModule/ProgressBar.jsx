const ProgressBar = ({ value = 0, max = 100, min = 0 }) => {
  const percentage =
    max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  const barColor = value > min ? "#16a34a" : "#dc2626";

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.bar,
          width: `${percentage}%`,
          backgroundColor: barColor,
        }}
      >
        <span style={styles.text}>
          {value} / {max}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;

const styles = {
  container: {
    width: "300px",
    height: "20px",
    backgroundColor: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  bar: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "width 0.3s ease, background-color 0.3s ease",
  },
  text: {
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  },
};
