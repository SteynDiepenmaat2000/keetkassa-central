import { Beer } from "lucide-react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"beer" | "text">("beer");

  useEffect(() => {
    const beerTimer = setTimeout(() => {
      setPhase("text");
    }, 1000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(beerTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative">
        {/* Beer bottle animation */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            phase === "beer"
              ? "scale-100 opacity-100"
              : "scale-150 opacity-0"
          }`}
        >
          <Beer className="h-32 w-32 text-primary animate-pulse" />
        </div>

        {/* KeetKassa text animation */}
        <div
          className={`transition-all duration-500 ${
            phase === "text"
              ? "scale-100 opacity-100"
              : "scale-50 opacity-0"
          }`}
        >
          <h1 className="text-5xl font-bold text-foreground whitespace-nowrap">
            KeetKassa
          </h1>
        </div>
      </div>
    </div>
  );
};
