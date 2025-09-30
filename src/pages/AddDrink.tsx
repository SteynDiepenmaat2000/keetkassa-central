import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AddDrink = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);

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

  const addTransaction = useMutation({
    mutationFn: async () => {
      if (!selectedMember || !selectedDrink) return;

      const member = members?.find((m) => m.id === selectedMember);
      const drink = drinks?.find((d) => d.id === selectedDrink);

      if (!member || !drink) return;

      // Add transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          member_id: member.id,
          drink_id: drink.id,
          price: drink.price,
        });

      if (transactionError) throw transactionError;

      // Update member credit
      const { error: updateError } = await supabase
        .from("members")
        .update({ credit: Number(member.credit) - Number(drink.price) })
        .eq("id", member.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Drankje toegevoegd!");
      setSelectedMember(null);
      setSelectedDrink(null);
      navigate("/");
    },
    onError: () => {
      toast.error("Er ging iets mis");
    },
  });

  const handleConfirm = () => {
    if (!selectedMember || !selectedDrink) {
      toast.error("Selecteer een naam en een drankje");
      return;
    }
    addTransaction.mutate();
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
        Drankje op naam toevoegen
      </h1>

      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Selecteer je naam:</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {members?.map((member) => (
              <Button
                key={member.id}
                variant={selectedMember === member.id ? "default" : "outline"}
                className="h-16 text-base font-medium"
                onClick={() => setSelectedMember(member.id)}
              >
                {member.name}
              </Button>
            ))}
          </div>
        </div>

        {selectedMember && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Selecteer je drankje:</h2>
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
        )}

        {selectedMember && selectedDrink && (
          <Button
            size="lg"
            className="h-20 w-full text-xl font-semibold"
            onClick={handleConfirm}
          >
            Bevestigen
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddDrink;
