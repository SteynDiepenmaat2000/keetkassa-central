import { Beer } from "lucide-react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"beer" | "text">("beer");
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const beerTimer = setTimeout(() => {
      setPhase("text");
    }, 1000);

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(beerTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-background transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Beer bottle animation */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              phase === "beer"
                ? "scale-100 opacity-100"
                : "scale-150 opacity-0"
            }`}
          >
            <Beer className="h-32 w-32 text-primary animate-bounce-subtle" />
          </div>

          {/* KeetKassa text animation */}
          <div
            className={`transition-all duration-500 ${
              phase === "text"
                ? "scale-100 opacity-100"
                : "scale-50 opacity-0"
            }`}
          >
            <h1 className="text-5xl font-bold text-foreground whitespace-nowrap animate-scale-in">
              KeetKassa
            </h1>
          </div>
        </div>
      </div>

      {/* Footer with developer and version info */}
      <div className="pb-8 text-center animate-fade-in">
        <p className="text-sm text-muted-foreground">Steyn Diepenmaat</p>
        <p className="text-xs text-muted-foreground">Versienummer: 1.0</p>
      </div>
    </div>
  );
};
