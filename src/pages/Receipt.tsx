import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Receipt = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('receipt-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ["members-sorted"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
        queryClient.invalidateQueries({ queryKey: ["year-transactions"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        queryClient.invalidateQueries({ queryKey: ["members-sorted"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [pendingCreditAmount, setPendingCreditAmount] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const { data: members } = useQuery({
    queryKey: ["members-sorted"],
    queryFn: async () => {
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("active", true);
      
      if (membersError) throw membersError;

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

      return membersWithLastTransaction.sort((a, b) => {
        if (!a.last_transaction && !b.last_transaction) return a.name.localeCompare(b.name);
        if (!a.last_transaction) return 1;
        if (!b.last_transaction) return -1;
        return new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime();
      });
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
        .select("*, drinks(name)")
        .eq("member_id", selectedMember)
        .lt("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: yearTransactions } = useQuery({
    queryKey: ["year-transactions", selectedMember],
    enabled: !!selectedMember,
    queryFn: async () => {
      if (!selectedMember) return [];
      const yearStart = new Date(new Date().getFullYear(), 0, 1);

      const { data, error } = await supabase
        .from("transactions")
        .select("*, drinks(name)")
        .eq("member_id", selectedMember)
        .gte("created_at", yearStart.toISOString())
        .order("created_at", { ascending: false });

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

  const handleCreditClick = (amount: number) => {
    setPendingCreditAmount(amount);
    setShowCreditDialog(false);
    setShowConfirmDialog(true);
  };

  const confirmAddCredit = () => {
    if (pendingCreditAmount) {
      addCredit.mutate(pendingCreditAmount);
      setShowConfirmDialog(false);
      setPendingCreditAmount(null);
    }
  };

  const member = members?.find((m) => m.id === selectedMember);
  const todayTotal = transactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const previousTotal = allTransactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const yearTotal = yearTransactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;

  const creditAmounts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];

  // Helper function to group drinks by name
  const groupDrinksByName = (transactions: any[]) => {
    const grouped: { [key: string]: { count: number; total: number; name: string } } = {};
    
    transactions.forEach((transaction) => {
      const drinkName = transaction.drinks?.name || "Unknown";
      if (!grouped[drinkName]) {
        grouped[drinkName] = { count: 0, total: 0, name: drinkName };
      }
      grouped[drinkName].count += 1;
      grouped[drinkName].total += Number(transaction.price);
    });

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  };

  // Group transactions by week
  const getWeekTransactions = () => {
    if (!allTransactions) return [];
    const weeks: { [key: string]: any[] } = {};
    
    allTransactions.forEach((transaction) => {
      const date = new Date(transaction.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(transaction);
    });

    return Object.entries(weeks).map(([weekStart, transactions]) => ({
      weekStart: new Date(weekStart),
      transactions,
      groupedDrinks: groupDrinksByName(transactions),
      total: transactions.reduce((sum, t) => sum + Number(t.price), 0),
    }));
  };

  const weeklyData = getWeekTransactions();
  const displayedWeeklyData = showAllHistory ? weeklyData : weeklyData.slice(0, 5);
  const todayGroupedDrinks = groupDrinksByName(transactions || []);
  const yearGroupedDrinks = groupDrinksByName(yearTransactions || []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-8 text-2xl font-bold sm:text-3xl md:text-4xl">Kassabon</h1>

      {!selectedMember ? (
        <div>
          <h2 className="mb-6 text-xl font-semibold sm:text-2xl">Selecteer je naam:</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {members?.map((m) => (
              <Button
                key={m.id}
                variant="outline"
                className="h-20 whitespace-normal break-words px-2 text-lg font-medium active:scale-95 sm:h-24 sm:text-xl"
                onClick={() => setSelectedMember(m.id)}
              >
                {m.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-6">
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
                <span className="font-semibold">Totaal dit jaar:</span>
                <span className="text-lg font-bold">
                  €{yearTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Vandaag</TabsTrigger>
              <TabsTrigger value="history">Historie</TabsTrigger>
              <TabsTrigger value="year">Dit jaar</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              {todayGroupedDrinks.length > 0 ? (
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-3 text-lg font-semibold">Drankjes vandaag:</h3>
                  <div className="space-y-2">
                    {todayGroupedDrinks.map((drink) => (
                      <div key={drink.name} className="flex justify-between text-sm">
                        <span>{drink.count}x {drink.name}</span>
                        <span>€{drink.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-3 flex justify-between font-bold">
                    <span>Totaal:</span>
                    <span>€{todayTotal.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                  Nog geen drankjes vandaag
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {weeklyData.length > 0 ? (
                <>
                  {displayedWeeklyData.map((week, index) => (
                    <div key={index} className="rounded-lg border bg-card p-6">
                      <h3 className="mb-3 text-lg font-semibold">
                        Week van {week.weekStart.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                      </h3>
                      <div className="space-y-2">
                        {week.groupedDrinks.map((drink) => (
                          <div key={drink.name} className="flex justify-between text-sm">
                            <span>{drink.count}x {drink.name}</span>
                            <span>€{drink.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 border-t pt-2 flex justify-between font-semibold">
                        <span>Totaal week:</span>
                        <span>€{week.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {weeklyData.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllHistory(!showAllHistory)}
                    >
                      {showAllHistory ? 'Toon minder' : `Toon alle ${weeklyData.length} weken`}
                    </Button>
                  )}
                </>
              ) : (
                <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                  Geen eerdere transacties
                </div>
              )}
            </TabsContent>

            <TabsContent value="year" className="space-y-4">
              {yearGroupedDrinks.length > 0 ? (
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    Alle drankjes in {new Date().getFullYear()}
                  </h3>
                  <div className="space-y-2">
                    {yearGroupedDrinks.map((drink) => (
                      <div key={drink.name} className="flex justify-between text-sm">
                        <span>{drink.count}x {drink.name}</span>
                        <span>€{drink.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Totaal {new Date().getFullYear()}:</span>
                    <span>€{yearTotal.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                  Nog geen transacties dit jaar
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <Button
              size="lg"
              className="h-20 w-full text-xl font-semibold active:scale-95 sm:h-24 sm:text-2xl"
              onClick={() => setShowCreditDialog(true)}
            >
              Credit opwaarderen
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-16 w-full text-lg active:scale-95 sm:h-20 sm:text-xl"
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
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {creditAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="h-20 text-xl font-semibold active:scale-95 sm:h-24 sm:text-2xl"
                onClick={() => handleCreditClick(amount)}
              >
                €{amount}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Credit bevestigen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg">
              Weet je zeker dat je <span className="font-bold text-primary">€{pendingCreditAmount}</span> wilt toevoegen?
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Vergeet niet het contante geld aan Luc te geven!
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingCreditAmount(null);
              }}
            >
              Annuleren
            </Button>
            <Button onClick={confirmAddCredit}>
              Bevestigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receipt;
