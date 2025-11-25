import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AddDrink = () => {
  const navigate = useNavigate();

  const { data: members } = useQuery({
    queryKey: ["members-sorted"],
    queryFn: async () => {
      const [membersData, transactions] = await Promise.all([
        db.getMembers(true),
        db.getTransactions(1000),
      ]);

      // Get last transaction for each member
      const memberLastTransaction = new Map<string, string>();
      transactions.forEach((t) => {
        if (!memberLastTransaction.has(t.member_id)) {
          memberLastTransaction.set(t.member_id, t.created_at);
        }
      });

      // Add last transaction to members
      const membersWithLastTransaction = membersData.map((member) => ({
        ...member,
        last_transaction: memberLastTransaction.get(member.id) || null,
      }));

      // Sort by last transaction (most recent first), then by name
      return membersWithLastTransaction.sort((a, b) => {
        if (!a.last_transaction && !b.last_transaction) return a.name.localeCompare(b.name);
        if (!a.last_transaction) return 1;
        if (!b.last_transaction) return -1;
        return new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime();
      });
    },
    refetchInterval: 5000, // Poll for updates
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
        Selecteer je naam
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {members?.map((member) => (
          <Button
            key={member.id}
            className="h-20 whitespace-normal break-words px-2 text-lg font-medium active:scale-95 sm:h-24 sm:text-xl"
            onClick={() => navigate(`/add-drink/${member.id}`)}
          >
            {member.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AddDrink;
