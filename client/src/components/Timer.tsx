import React from 'react';

interface Props {
  timeRemaining: number;
  drawTime: number;
}

const Timer: React.FC<Props> = ({ timeRemaining, drawTime }) => {
  const pct = drawTime > 0 ? (timeRemaining / drawTime) * 100 : 0;
  const strokeColor = pct > 50 ? '#00E5A0' : pct > 25 ? '#FFD700' : '#FF6B6B';
  const circumference = 2 * Math.PI * 34;
  const progress = drawTime > 0 ? Math.max(0, Math.min(timeRemaining / drawTime, 1)) : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="timer-container">
      <svg
        className={`timer-svg ${timeRemaining < 10 ? 'animate-shake' : ''}`}
        width="80"
        height="80"
        viewBox="0 0 80 80"
        role="img"
        aria-label={`${timeRemaining} seconds remaining`}
      >
        <circle cx="40" cy="40" r="34" stroke="#333" strokeWidth="8" fill="none" />
        <circle
          className="timer-progress"
          cx="40"
          cy="40"
          r="34"
          stroke={strokeColor}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
        <text
          x="40"
          y="46"
          textAnchor="middle"
          fontFamily="Fredoka One"
          fontSize="22"
          fill={strokeColor}
        >
          {timeRemaining}
        </text>
      </svg>
    </div>
  );
};

export default Timer;
