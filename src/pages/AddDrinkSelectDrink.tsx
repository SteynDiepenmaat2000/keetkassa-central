import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AddDrinkSelectDrink = () => {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const queryClient = useQueryClient();
  const [selectedDrinkGroup, setSelectedDrinkGroup] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [showSizeDialog, setShowSizeDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: member } = useQuery({
    queryKey: ["member", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      return db.getMember(memberId);
    },
  });

  const { data: drinks } = useQuery({
    queryKey: ["drinks"],
    queryFn: () => db.getDrinks(),
  });

  const addTransaction = useMutation({
    mutationFn: async (drinkId: string) => {
      const drink = drinks?.find((d) => d.id === drinkId);
      if (!member || !drink) return;

      await db.createTransaction({
        member_id: member.id,
        drink_id: drink.id,
        price: drink.price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Drankje toegevoegd!");
      navigate("/");
    },
    onError: () => {
      toast.error("Er ging iets mis");
    },
  });

  // Group drinks by base name (removing size indicators)
  const groupDrinksByName = () => {
    if (!drinks) return {};
    
    const groups: Record<string, any[]> = {};
    
    drinks.forEach(drink => {
      let baseName = drink.name
        .replace(/\s*(klein|small|groot|large)\s*/gi, '')
        .trim();
      
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(drink);
    });
    
    return groups;
  };

  const drinkGroups = groupDrinksByName();

  const handleDrinkGroupSelect = (groupName: string) => {
    const group = drinkGroups[groupName];
    
    if (group.length === 1) {
      setSelectedDrink(group[0].id);
      setShowConfirmDialog(true);
    } else {
      setSelectedDrinkGroup(groupName);
      setShowSizeDialog(true);
    }
  };

  const handleSizeSelect = (drinkId: string) => {
    setSelectedDrink(drinkId);
    setShowSizeDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (selectedDrink) {
      addTransaction.mutate(selectedDrink);
    }
    setShowConfirmDialog(false);
    setSelectedDrink(null);
    setSelectedDrinkGroup(null);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setShowSizeDialog(false);
    setSelectedDrink(null);
    setSelectedDrinkGroup(null);
  };

  const selectedDrinkData = drinks?.find((d) => d.id === selectedDrink);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/add-drink")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
        Selecteer je drankje
      </h1>
      <p className="mb-8 text-xl text-muted-foreground sm:text-2xl">
        Voor: <span className="font-semibold text-foreground">{member?.name}</span>
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Object.entries(drinkGroups).map(([groupName, groupDrinks]) => {
          return (
            <Button
              key={groupName}
              className="h-24 flex-col gap-1 whitespace-normal break-words px-2 text-lg font-medium active:scale-95 sm:h-28 sm:text-xl"
              onClick={() => handleDrinkGroupSelect(groupName)}
            >
              <span className="leading-tight">{groupName}</span>
              {groupDrinks.length > 1 && (
                <span className="text-xs opacity-70">
                  {groupDrinks.length} opties
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <AlertDialog open={showSizeDialog} onOpenChange={setShowSizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kies formaat voor {selectedDrinkGroup}</AlertDialogTitle>
            <AlertDialogDescription>
              Selecteer de gewenste grootte voor <strong>{member?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-4">
            {selectedDrinkGroup && drinkGroups[selectedDrinkGroup]?.map((drink) => (
              <Button
                key={drink.id}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => handleSizeSelect(drink.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">{drink.name}</span>
                  <span className="text-lg font-bold">€{Number(drink.price).toFixed(2)}</span>
                </div>
                {drink.volume_ml && (
                  <span className="text-xl font-semibold text-foreground">{drink.volume_ml}ml</span>
                )}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Annuleren
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drankje bevestigen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{selectedDrinkData?.name}</strong> (€
              {selectedDrinkData ? Number(selectedDrinkData.price).toFixed(2) : "0.00"})
              wilt toevoegen voor <strong>{member?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Bevestigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddDrinkSelectDrink;
