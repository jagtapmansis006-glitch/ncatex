import React, { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: string | number;
  duration?: number; // In seconds, default 1.5s
  className?: string;
}

// Standard easeOutExpo easing function
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function CountUp({ value, duration = 1.5, className = "" }: CountUpProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [hasAnimated, setHasAnimated] = useState(false);

  // Parse numeric target and suffix/prefix (e.g., "40+" -> 40, "+")
  const valueStr = String(value);
  const match = valueStr.match(/^([^0-9.]*)(\d+(?:\.\d+)?)(.*)$/);
  const prefix = match ? match[1] ?? "" : "";
  const targetNumber = match ? parseFloat(match[2] ?? "0") : 0;
  const suffix = match ? match[3] ?? "" : "";
  const isDecimal = match && (match[2] ?? "").includes(".");
  const decimalPlaces = isDecimal && match ? (match[2]?.split(".")[1]?.length ?? 1) : 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.disconnect();

          const startTime = performance.now();
          const durationMs = duration * 1000;

          const tick = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / durationMs);
            const easedProgress = easeOutExpo(progress);
            const currentNum = easedProgress * targetNumber;

            const formattedNum = isDecimal
              ? currentNum.toFixed(decimalPlaces)
              : Math.round(currentNum).toString();

            setDisplayValue(`${prefix}${formattedNum}${suffix}`);

            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              setDisplayValue(valueStr);
            }
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated, duration, targetNumber, prefix, suffix, isDecimal, decimalPlaces, valueStr]);

  return (
    <span
      ref={containerRef}
      className={`inline-block tabular-nums font-display ${className}`}
      style={{
        // Prevent layout shift/jitter by reserving proportional min-width
        minWidth: `${Math.max(1, valueStr.length)}ch`,
        textAlign: "inherit",
      }}
      aria-label={valueStr}
    >
      {hasAnimated ? displayValue : `${prefix}0${suffix}`}
    </span>
  );
}

export default CountUp;
