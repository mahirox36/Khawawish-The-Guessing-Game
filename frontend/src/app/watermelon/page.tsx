"use client";

import { useEffect, useState } from "react";

export default function SmoothCounter() {
  const [displayValue, setDisplayValue] = useState(0);
  const [targetValue, setTargetValue] = useState(0);
  const [PPS, setPPS] = useState(20); // Points Per Second

  useEffect(() => {
    // Every second, increase target by 10
    const mainInterval = setInterval(() => {
      setTargetValue((prev) => prev + PPS);
    }, 1000);

    return () => clearInterval(mainInterval);
  }, [PPS]);

  useEffect(() => {
    if (displayValue === targetValue) return;

    const stepTime = 1000 / PPS; // spread across 1 second (10 steps)

    let current = displayValue;
    const stepInterval = setInterval(() => {
      current++;
      setDisplayValue(current);

      if (current >= targetValue) clearInterval(stepInterval);
    }, stepTime);

    return () => clearInterval(stepInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);

  return (
    <div className="text-4xl font-bold">
      <input
        type="number"
        onChange={(e) => setPPS(Number(e.target.value) || 20)}
        value={PPS}
      />
      {displayValue}
    </div>
  );
}
