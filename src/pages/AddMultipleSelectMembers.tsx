import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AddMultipleSelectMembers = () => {
  const navigate = useNavigate();
  const { drinkId } = useParams();
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const { data: drink } = useQuery({
    queryKey: ["drink", drinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drinks")
        .select("*")
        .eq("id", drinkId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members-sorted"],
    queryFn: async () => {
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*");
      
      if (membersError) throw membersError;

      const membersWithLastTransaction = await Promise.all(
        membersData.map(async (member) => {
          const { data: lastTransaction } = await supabase
            .from("transactions")
            .select("created_at")
            .eq("member_id", member.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...member,
            last_transaction: lastTransaction?.created_at || null,
          };
        })
      );

      return membersWithLastTransaction.sort((a, b) => {
        if (!a.last_transaction && !b.last_transaction) return a.name.localeCompare(b.name);
        if (!a.last_transaction) return 1;
        if (!b.last_transaction) return -1;
        return new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime();
      });
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
      if (!drink || selectedMembers.size === 0) return;

      const transactions = Array.from(selectedMembers).map((memberId) => ({
        member_id: memberId,
        drink_id: drink.id,
        price: drink.price,
      }));

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactions);

      if (transactionError) throw transactionError;

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
        onClick={() => navigate("/add-multiple")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-4 text-2xl font-bold md:text-3xl">
        Selecteer de namen
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Drankje: <span className="font-semibold text-foreground">{drink?.name} (€{Number(drink?.price).toFixed(2)})</span>
        {selectedMembers.size > 0 && (
          <span className="ml-4 text-primary">
            {selectedMembers.size} geselecteerd
          </span>
        )}
      </p>

      <div className="space-y-4">
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

        {selectedMembers.size > 0 && (
          <Button
            size="lg"
            className="h-20 w-full text-xl font-semibold"
            onClick={() => addTransactions.mutate()}
          >
            Bevestigen ({selectedMembers.size} drankjes)
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddMultipleSelectMembers;
