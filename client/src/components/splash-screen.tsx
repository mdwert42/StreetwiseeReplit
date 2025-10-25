import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number; // milliseconds
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 300);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img 
        src="/splash-screen.jpg" 
        alt="StreetWyze Loading" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
