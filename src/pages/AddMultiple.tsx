import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AddMultiple = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: drinks } = useQuery({
    queryKey: ["drinks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drinks")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const addTransactions = useMutation({
    mutationFn: async () => {
      if (!selectedDrink || selectedMembers.size === 0) return;

      const drink = drinks?.find((d) => d.id === selectedDrink);
      if (!drink) return;

      // Add transactions for all selected members
      const transactions = Array.from(selectedMembers).map((memberId) => ({
        member_id: memberId,
        drink_id: drink.id,
        price: drink.price,
      }));

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactions);

      if (transactionError) throw transactionError;

      // Update credit for all members
      for (const memberId of selectedMembers) {
        const member = members?.find((m) => m.id === memberId);
        if (member) {
          const { error: updateError } = await supabase
            .from("members")
            .update({ credit: Number(member.credit) - Number(drink.price) })
            .eq("id", member.id);

          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${selectedMembers.size} drankjes toegevoegd!`);
      setSelectedDrink(null);
      setSelectedMembers(new Set());
      navigate("/");
    },
    onError: () => {
      toast.error("Er ging iets mis");
    },
  });

  const handleConfirm = () => {
    if (!selectedDrink || selectedMembers.size === 0) {
      toast.error("Selecteer een drankje en minimaal één naam");
      return;
    }
    addTransactions.mutate();
  };

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

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">
        Meerdere drankjes op meerdere namen toevoegen
      </h1>

      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Selecteer het drankje:</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {drinks?.map((drink) => (
              <Button
                key={drink.id}
                variant={selectedDrink === drink.id ? "secondary" : "outline"}
                className="h-20 flex-col text-base font-medium"
                onClick={() => setSelectedDrink(drink.id)}
              >
                <span>{drink.name}</span>
                <span className="text-sm text-muted-foreground">
                  €{Number(drink.price).toFixed(2)}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {selectedDrink && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              Selecteer de namen ({selectedMembers.size} geselecteerd):
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {members?.map((member) => (
                <Button
                  key={member.id}
                  variant={selectedMembers.has(member.id) ? "default" : "outline"}
                  className="h-16 text-base font-medium"
                  onClick={() => toggleMember(member.id)}
                >
                  {member.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedDrink && selectedMembers.size > 0 && (
          <Button
            size="lg"
            className="h-20 w-full text-xl font-semibold"
            onClick={handleConfirm}
          >
            Bevestigen ({selectedMembers.size} drankjes)
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddMultiple;
