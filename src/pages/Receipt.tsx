import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Receipt = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);

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

  const { data: transactions } = useQuery({
    queryKey: ["transactions", selectedMember],
    enabled: !!selectedMember,
    queryFn: async () => {
      if (!selectedMember) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("transactions")
        .select("*, drinks(name, price)")
        .eq("member_id", selectedMember)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: allTransactions } = useQuery({
    queryKey: ["all-transactions", selectedMember],
    enabled: !!selectedMember,
    queryFn: async () => {
      if (!selectedMember) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("transactions")
        .select("price")
        .eq("member_id", selectedMember)
        .lt("created_at", today.toISOString());

      if (error) throw error;
      return data;
    },
  });

  const addCredit = useMutation({
    mutationFn: async (amount: number) => {
      if (!selectedMember) return;
      const member = members?.find((m) => m.id === selectedMember);
      if (!member) return;

      const { error } = await supabase
        .from("members")
        .update({ credit: Number(member.credit) + amount })
        .eq("id", member.id);

      if (error) throw error;
      return amount;
    },
    onSuccess: (amount) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(`€${amount} toegevoegd aan je credit!`, {
        description: "Vergeet niet het contante geld aan Luc te geven!",
        duration: 5000,
      });
      setShowCreditDialog(false);
    },
    onError: () => {
      toast.error("Er ging iets mis");
    },
  });

  const member = members?.find((m) => m.id === selectedMember);
  const todayTotal = transactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const previousTotal = allTransactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;

  const creditAmounts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">Kassabon</h1>

      {!selectedMember ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Selecteer je naam:</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {members?.map((m) => (
              <Button
                key={m.id}
                variant="outline"
                className="h-16 text-base font-medium"
                onClick={() => setSelectedMember(m.id)}
              >
                {m.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-lg border-2 bg-card p-6">
            <h2 className="mb-4 text-2xl font-bold">{member?.name}</h2>

            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Huidig credit:</span>
                <span
                  className={`text-lg font-bold ${
                    Number(member?.credit) < 0 ? "text-destructive" : "text-success"
                  }`}
                >
                  €{Number(member?.credit).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Kosten vandaag:</span>
                <span className="text-lg font-bold">
                  €{todayTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Kosten voorgaande weken:</span>
                <span className="text-lg font-bold">
                  €{previousTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {transactions && transactions.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold">Drankjes vandaag:</h3>
              <div className="space-y-2">
                {transactions.map((t) => (
                  <div key={t.id} className="flex justify-between text-sm">
                    <span>{t.drinks?.name}</span>
                    <span>€{Number(t.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              size="lg"
              className="h-16 w-full text-lg font-semibold"
              onClick={() => setShowCreditDialog(true)}
            >
              Credit opwaarderen
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-14 w-full"
              onClick={() => setSelectedMember(null)}
            >
              Andere naam selecteren
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Credit opwaarderen</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {creditAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="h-16 text-lg font-semibold"
                onClick={() => addCredit.mutate(amount)}
              >
                €{amount}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receipt;
