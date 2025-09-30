import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AddDrinkSelectDrink = () => {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const queryClient = useQueryClient();

  const { data: member } = useQuery({
    queryKey: ["member", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();
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
    mutationFn: async (drinkId: string) => {
      const drink = drinks?.find((d) => d.id === drinkId);
      if (!member || !drink) return;

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          member_id: member.id,
          drink_id: drink.id,
          price: drink.price,
        });

      if (transactionError) throw transactionError;

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
      navigate("/");
    },
    onError: () => {
      toast.error("Er ging iets mis");
    },
  });

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

      <h1 className="mb-4 text-2xl font-bold md:text-3xl">
        Selecteer je drankje
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Voor: <span className="font-semibold text-foreground">{member?.name}</span>
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {drinks?.map((drink) => (
          <Button
            key={drink.id}
            className="h-20 flex-col text-base font-medium"
            onClick={() => addTransaction.mutate(drink.id)}
          >
            <span>{drink.name}</span>
            <span className="text-sm opacity-80">
              €{Number(drink.price).toFixed(2)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AddDrinkSelectDrink;
