import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TimeCircleProps {
  timeRemaining: number;
  period: number;
  size?: number;
  strokeWidth?: number;
}

const TimeCircle: React.FC<TimeCircleProps> = ({
  timeRemaining,
  period,
  size = 36,
  strokeWidth = 3,
}) => {
  const [progress, setProgress] = useState(timeRemaining / period);

  useEffect(() => {
    setProgress(timeRemaining / period);
  }, [timeRemaining, period]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (progress > 0.6) return "#4CAF50";
    if (progress > 0.3) return "#FFC107";
    return "#F44336";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#333333"
          strokeWidth={strokeWidth}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
        {timeRemaining}
      </div>
    </div>
  );
};

export default TimeCircle;
