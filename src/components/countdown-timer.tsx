
"use client";

import { useState, useEffect } from 'react';

const calculateTimeLeft = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);

  const difference = lastDayOfMonth.getTime() - now.getTime();

  let timeLeft = {
    "Days": 0,
    "Hours": 0,
    "Minutes": 0,
    "Seconds": 0,
  };

  if (difference > 0) {
    timeLeft = {
      "Days": Math.floor(difference / (1000 * 60 * 60 * 24)),
      "Hours": Math.floor((difference / (1000 * 60 * 60)) % 24),
      "Minutes": Math.floor((difference / 1000 / 60) % 60),
      "Seconds": Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ "Days": 0, "Hours": 0, "Minutes": 0, "Seconds": 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateTimer = () => setTimeLeft(calculateTimeLeft());
    updateTimer(); // Initial call

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) {
    return null;
  }

  // Correct order for display
  const displayOrder: Array<keyof typeof timeLeft> = ["Days", "Hours", "Minutes", "Seconds"];

  const timerComponents = displayOrder.map((interval) => {
    const value = timeLeft[interval];
    return (
      <div key={interval} className="flex flex-col items-center">
        <span className="text-4xl md:text-6xl font-bold font-headline text-primary tracking-wider">
          {String(value).padStart(2, '0')}
        </span>
        <span className="text-sm md:text-base font-medium uppercase text-muted-foreground">
          {interval}
        </span>
      </div>
    );
  });

  return (
    <div className="flex justify-center gap-4 md:gap-8">
      {timerComponents.length ? timerComponents : <span>The draw is over!</span>}
    </div>
  );
}
