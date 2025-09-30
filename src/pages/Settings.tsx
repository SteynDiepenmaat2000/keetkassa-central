import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newDrinkName, setNewDrinkName] = useState("");
  const [newDrinkPrice, setNewDrinkPrice] = useState("");
  const [editingDrink, setEditingDrink] = useState<any>(null);
  const [newExpenseDescription, setNewExpenseDescription] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [selectedExpenseMember, setSelectedExpenseMember] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: drinks } = useQuery({
    queryKey: ["drinks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drinks").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, members(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const checkPassword = async () => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "admin_password")
      .single();

    if (data?.value === password) {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      toast.success("Wachtwoord correct!");
    } else {
      toast.error("Onjuist wachtwoord");
    }
  };

  const addMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("members").insert({ name: newMemberName });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setNewMemberName("");
      toast.success("Lid toegevoegd!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Lid verwijderd!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const addDrink = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("drinks")
        .insert({ name: newDrinkName, price: parseFloat(newDrinkPrice) });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      setNewDrinkName("");
      setNewDrinkPrice("");
      toast.success("Drankje toegevoegd!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const updateDrink = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase.from("drinks").update({ price }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      setEditingDrink(null);
      toast.success("Prijs aangepast!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const deleteDrink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drinks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Drankje verwijderd!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      if (!selectedExpenseMember) return;
      const { error } = await supabase.from("expenses").insert({
        member_id: selectedExpenseMember,
        description: newExpenseDescription,
        amount: parseFloat(newExpenseAmount),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setNewExpenseDescription("");
      setNewExpenseAmount("");
      setSelectedExpenseMember(null);
      toast.success("Kosten toegevoegd!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const settleExpense = useMutation({
    mutationFn: async ({ id, method, memberId, amount }: any) => {
      // Mark expense as settled
      const { error: expenseError } = await supabase
        .from("expenses")
        .update({ settled: true, payment_method: method })
        .eq("id", id);
      if (expenseError) throw expenseError;

      // If credit method, update member credit
      if (method === "credit") {
        const member = members?.find((m) => m.id === memberId);
        if (member) {
          const { error: creditError } = await supabase
            .from("members")
            .update({ credit: Number(member.credit) + amount })
            .eq("id", memberId);
          if (creditError) throw creditError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Kosten verrekend!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const requiresPassword = () => {
    setShowPasswordDialog(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">Instellingen</h1>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Leden</TabsTrigger>
          <TabsTrigger value="drinks">Drankjes</TabsTrigger>
          <TabsTrigger value="expenses">Kosten</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Nieuw lid toevoegen</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Naam"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <Button onClick={() => addMember.mutate()}>Toevoegen</Button>
            </div>
          </div>

          <div className="space-y-2">
            {members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                <span>{member.name}</span>
                <div className="flex items-center gap-3">
                  <span className={Number(member.credit) < 0 ? "text-destructive" : "text-success"}>
                    €{Number(member.credit).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMember.mutate(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drinks" className="space-y-4">
          {!isAuthenticated ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="mb-4">Deze sectie is beveiligd met een wachtwoord.</p>
              <Button onClick={requiresPassword}>Wachtwoord invoeren</Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-3 font-semibold">Nieuw drankje toevoegen</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Naam"
                    value={newDrinkName}
                    onChange={(e) => setNewDrinkName(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Prijs"
                    value={newDrinkPrice}
                    onChange={(e) => setNewDrinkPrice(e.target.value)}
                    className="w-32"
                  />
                  <Button onClick={() => addDrink.mutate()}>Toevoegen</Button>
                </div>
              </div>

              <div className="space-y-2">
                {drinks?.map((drink) => (
                  <div key={drink.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <span>{drink.name}</span>
                    <div className="flex items-center gap-2">
                      {editingDrink?.id === drink.id ? (
                        <>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24"
                            defaultValue={drink.price}
                            onChange={(e) =>
                              setEditingDrink({ ...editingDrink, price: e.target.value })
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              updateDrink.mutate({
                                id: drink.id,
                                price: parseFloat(editingDrink.price),
                              })
                            }
                          >
                            Opslaan
                          </Button>
                        </>
                      ) : (
                        <>
                          <span>€{Number(drink.price).toFixed(2)}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDrink(drink)}
                          >
                            Wijzig prijs
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDrink.mutate(drink.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Kosten toevoegen</h3>
            <div className="space-y-3">
              <Input
                placeholder="Beschrijving (bijv. kratten bier)"
                value={newExpenseDescription}
                onChange={(e) => setNewExpenseDescription(e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Bedrag"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedExpenseMember || ""}
                onChange={(e) => setSelectedExpenseMember(e.target.value)}
              >
                <option value="">Selecteer lid</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <Button className="w-full" onClick={() => addExpense.mutate()}>
                Toevoegen
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Openstaande kosten</h3>
            {expenses
              ?.filter((e) => !e.settled)
              .map((expense: any) => (
                <div key={expense.id} className="rounded-lg border bg-card p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{expense.members?.name}</div>
                      <div className="text-sm text-muted-foreground">{expense.description}</div>
                    </div>
                    <div className="text-lg font-bold">€{Number(expense.amount).toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        settleExpense.mutate({
                          id: expense.id,
                          method: "credit",
                          memberId: expense.member_id,
                          amount: expense.amount,
                        })
                      }
                    >
                      Verrekenen via credit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const roundedAmount = Math.floor(Number(expense.amount) / 10) * 10;
                        const creditAmount = Number(expense.amount) - roundedAmount;
                        toast.info(
                          `Contant: €${roundedAmount}, Credit: €${creditAmount.toFixed(2)}`
                        );
                        settleExpense.mutate({
                          id: expense.id,
                          method: "cash",
                          memberId: expense.member_id,
                          amount: creditAmount,
                        });
                      }}
                    >
                      Uitbetalen (contant + credit)
                    </Button>
                  </div>
                </div>
              ))}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Verrekende kosten</h3>
            {expenses
              ?.filter((e) => e.settled)
              .map((expense: any) => (
                <div key={expense.id} className="rounded-lg border bg-muted p-3 opacity-60">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{expense.members?.name}</div>
                      <div className="text-sm text-muted-foreground">{expense.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€{Number(expense.amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {expense.payment_method === "credit" ? "Via credit" : "Uitbetaald"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wachtwoord invoeren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Wachtwoord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkPassword()}
            />
            <Button className="w-full" onClick={checkPassword}>
              Bevestigen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
