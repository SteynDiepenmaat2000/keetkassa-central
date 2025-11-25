import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const AddDrink = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('add-drink-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ["members-sorted"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        queryClient.invalidateQueries({ queryKey: ["members-sorted"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: members } = useQuery({
    queryKey: ["members-sorted"],
    queryFn: async () => {
      // Get all active members with their latest transaction
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("active", true);
      
      if (membersError) throw membersError;

      // Get latest transaction for each member
      const membersWithLastTransaction = await Promise.all(
        membersData.map(async (member) => {
          const { data: lastTransaction } = await supabase
            .from("transactions")
            .select("created_at")
            .eq("member_id", member.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...member,
            last_transaction: lastTransaction?.created_at || null,
          };
        })
      );

      // Sort by last transaction (most recent first), then by name
      return membersWithLastTransaction.sort((a, b) => {
        if (!a.last_transaction && !b.last_transaction) return a.name.localeCompare(b.name);
        if (!a.last_transaction) return 1;
        if (!b.last_transaction) return -1;
        return new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime();
      });
    },
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
