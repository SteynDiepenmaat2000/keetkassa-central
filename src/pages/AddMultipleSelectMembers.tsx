import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/database";
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
      if (!drinkId) return null;
      return db.getDrink(drinkId);
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members-sorted"],
    queryFn: async () => {
      const [membersData, transactions] = await Promise.all([
        db.getMembers(true),
        db.getTransactions(1000),
      ]);

      const memberLastTransaction = new Map<string, string>();
      transactions.forEach((t) => {
        if (!memberLastTransaction.has(t.member_id)) {
          memberLastTransaction.set(t.member_id, t.created_at);
        }
      });

      const membersWithLastTransaction = membersData.map((member) => ({
        ...member,
        last_transaction: memberLastTransaction.get(member.id) || null,
      }));

      return membersWithLastTransaction.sort((a, b) => {
        if (!a.last_transaction && !b.last_transaction) return a.name.localeCompare(b.name);
        if (!a.last_transaction) return 1;
        if (!b.last_transaction) return -1;
        return new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime();
      });
    },
  });

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(memberId)) {
        newSelected.delete(memberId);
      } else {
        newSelected.add(memberId);
      }
      return newSelected;
    });
  };

  const addTransactions = useMutation({
    mutationFn: async () => {
      if (!drink || selectedMembers.size === 0) return;

      for (const memberId of selectedMembers) {
        await db.createTransaction({
          member_id: memberId,
          drink_id: drink.id,
          price: drink.price,
        });
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

      <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
        Selecteer de namen
      </h1>
      <p className="mb-8 text-xl text-muted-foreground sm:text-2xl">
        Drankje: <span className="font-semibold text-foreground">{drink?.name} (€{Number(drink?.price).toFixed(2)})</span>
        {selectedMembers.size > 0 && (
          <span className="ml-4 block text-primary sm:inline sm:ml-6">
            {selectedMembers.size} geselecteerd
          </span>
        )}
      </p>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {members?.map((member) => {
            const isSelected = selectedMembers.has(member.id);
            return (
              <Button
                key={member.id}
                variant={isSelected ? "default" : "outline"}
                className="h-20 whitespace-normal break-words px-2 text-lg font-medium touch-manipulation transition-all active:scale-95 sm:h-24 sm:text-xl"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMember(member.id);
                }}
              >
                {member.name}
              </Button>
            );
          })}
        </div>

        {selectedMembers.size > 0 && (
          <Button
            size="lg"
            className="h-24 w-full text-2xl font-semibold active:scale-95 sm:h-28"
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
