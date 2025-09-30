import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const Index = () => {
  const currentTime = new Date().toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentDate = new Date().toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 flex items-start justify-between">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          KeetKassa
        </h1>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground md:text-3xl">
            {currentTime}
          </div>
          <div className="text-sm text-muted-foreground md:text-base">
            {currentDate}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4">
        <Link to="/add-drink" className="block">
          <Button
            size="lg"
            className="h-24 w-full text-xl font-semibold transition-all hover:scale-[1.02] md:h-32 md:text-2xl"
          >
            Drankje op naam toevoegen
          </Button>
        </Link>

        <Link to="/add-multiple" className="block">
          <Button
            size="lg"
            className="h-24 w-full text-xl font-semibold transition-all hover:scale-[1.02] md:h-32 md:text-2xl"
          >
            Meerdere drankjes op meerdere namen toevoegen
          </Button>
        </Link>

        <Link to="/receipt" className="block">
          <Button
            size="lg"
            className="h-24 w-full text-xl font-semibold transition-all hover:scale-[1.02] md:h-32 md:text-2xl"
          >
            Kassabon
          </Button>
        </Link>

        <Link to="/settings" className="mt-8 block">
          <Button
            size="lg"
            variant="ghost"
            className="mx-auto flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Instellingen
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
