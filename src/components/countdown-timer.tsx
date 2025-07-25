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
    "روز": 0,
    "ساعت": 0,
    "دقیقه": 0,
    "ثانیه": 0,
  };

  if (difference > 0) {
    timeLeft = {
      "روز": Math.floor(difference / (1000 * 60 * 60 * 24)),
      "ساعت": Math.floor((difference / (1000 * 60 * 60)) % 24),
      "دقیقه": Math.floor((difference / 1000 / 60) % 60),
      "ثانیه": Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ "روز": 0, "ساعت": 0, "دقیقه": 0, "ثانیه": 0 });
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

  const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
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
      {timerComponents.length ? timerComponents : <span>قرعه‌کشی به پایان رسیده است!</span>}
    </div>
  );
}
