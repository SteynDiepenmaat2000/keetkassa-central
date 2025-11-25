import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AddMultiple = () => {
  const navigate = useNavigate();

  const { data: drinks } = useQuery({
    queryKey: ["drinks"],
    queryFn: () => db.getDrinks(),
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-8 text-2xl font-bold sm:text-3xl md:text-4xl">
        Selecteer het drankje
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {drinks?.map((drink) => (
          <Button
            key={drink.id}
            className="h-24 flex-col gap-1 whitespace-normal break-words px-2 text-lg font-medium active:scale-95 sm:h-28 sm:text-xl"
            onClick={() => navigate(`/add-multiple/${drink.id}`)}
          >
            <span className="leading-tight">{drink.name}</span>
            <span className="text-base opacity-90 sm:text-lg">
              €{Number(drink.price).toFixed(2)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AddMultiple;
