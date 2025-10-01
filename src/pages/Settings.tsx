import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PURCHASE_CATEGORIES = [
  { id: "beer", label: "Bier" },
  { id: "soda", label: "Frisdrank" },
  { id: "wine", label: "Wijn" },
  { id: "snacks", label: "Chips/Voedsel" },
  { id: "gas", label: "Gasflessen" },
  { id: "general", label: "Algemene omkosten" },
];

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
  const [memberToDeactivate, setMemberToDeactivate] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  
  // Purchase form state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [purchaseDeposit, setPurchaseDeposit] = useState("");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [purchaseMemberId, setPurchaseMemberId] = useState<string | null>(null);
  
  // Database reset states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [userVerificationInput, setUserVerificationInput] = useState("");

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: inactiveMembers } = useQuery({
    queryKey: ["inactive-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("active", false)
        .order("name");
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

  const { data: purchases } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, members(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const checkPassword = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password }
      });

      if (error) throw error;

      if (data?.valid) {
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
        setPassword("");
        toast.success("Wachtwoord correct!");
      } else {
        toast.error("Onjuist wachtwoord");
        setPassword("");
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast.error("Fout bij wachtwoord verificatie");
      setPassword("");
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

  const deactivateMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("members")
        .update({ active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["inactive-members"] });
      setShowDeactivateDialog(false);
      setMemberToDeactivate(null);
      toast.success("Lid op inactief gezet!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const activateMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("members")
        .update({ active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["inactive-members"] });
      toast.success("Lid weer actief!");
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

  const addPurchase = useMutation({
    mutationFn: async () => {
      if (!purchaseMemberId || !selectedCategory) return;
      
      const pricePerUnit = parseFloat(purchasePricePerUnit);
      const quantity = parseInt(purchaseQuantity);
      const depositPerUnit = purchaseDeposit ? parseFloat(purchaseDeposit) : 0;
      const totalAmount = (pricePerUnit + depositPerUnit) * quantity;
      
      const categoryLabel = PURCHASE_CATEGORIES.find(c => c.id === selectedCategory)?.label || "";
      
      const { error } = await supabase.from("purchases").insert({
        member_id: purchaseMemberId,
        category: categoryLabel,
        price_per_unit: pricePerUnit,
        quantity,
        deposit_per_unit: depositPerUnit,
        total_amount: totalAmount,
        description: purchaseDescription,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      setShowPurchaseDialog(false);
      setSelectedCategory("");
      setPurchasePricePerUnit("");
      setPurchaseQuantity("");
      setPurchaseDeposit("");
      setPurchaseDescription("");
      setPurchaseMemberId(null);
      toast.success("Inkoop toegevoegd!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const settlePurchase = useMutation({
    mutationFn: async ({ id, method, memberId, amount }: any) => {
      const { error: purchaseError } = await supabase
        .from("purchases")
        .update({ settled: true })
        .eq("id", id);
      if (purchaseError) throw purchaseError;

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
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Inkoop verrekend!");
    },
    onError: () => toast.error("Er ging iets mis"),
  });

  const generateVerificationCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleResetDatabase = useMutation({
    mutationFn: async () => {
      // Delete all transactions
      const { error: transactionsError } = await supabase
        .from("transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (transactionsError) throw transactionsError;

      // Delete all purchases
      const { error: purchasesError } = await supabase
        .from("purchases")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (purchasesError) throw purchasesError;

      // Delete all expenses
      const { error: expensesError } = await supabase
        .from("expenses")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (expensesError) throw expensesError;

      // Reset all member credits to 0
      const { error: membersError } = await supabase
        .from("members")
        .update({ credit: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (membersError) throw membersError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Database gewist - alle transacties, inkopen en kosten zijn verwijderd");
      setShowResetDialog(false);
      setResetStep(1);
      setUserVerificationInput("");
    },
    onError: (error) => {
      toast.error("Fout bij wissen database: " + error.message);
    },
  });

  const handleResetClick = () => {
    if (resetStep === 1) {
      setResetStep(2);
    } else if (resetStep === 2) {
      const code = generateVerificationCode();
      setVerificationCode(code);
      setResetStep(3);
    } else if (resetStep === 3) {
      if (userVerificationInput === verificationCode) {
        handleResetDatabase.mutate();
      } else {
        toast.error("Verkeerde code - de ingevoerde code komt niet overeen");
      }
    }
  };

  const handleCancelReset = () => {
    setShowResetDialog(false);
    setResetStep(1);
    setUserVerificationInput("");
    setVerificationCode("");
  };

  const requiresPassword = () => {
    setShowPasswordDialog(true);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowPurchaseDialog(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">Instellingen</h1>

      {!isAuthenticated ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="mb-4 text-xl font-semibold">Toegang beveiligd</h2>
          <p className="mb-6 text-muted-foreground">Het instellingen menu is beveiligd met een wachtwoord.</p>
          <Button onClick={requiresPassword}>Wachtwoord invoeren</Button>
        </div>
      ) : (
        <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">Systeemmenu</TabsTrigger>
          <TabsTrigger value="purchases">Inkopen</TabsTrigger>
          <TabsTrigger value="expenses">Kosten</TabsTrigger>
          <TabsTrigger value="statistics">Statistieken</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          {!isAuthenticated ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="mb-4">Deze sectie is beveiligd met een wachtwoord.</p>
              <Button onClick={requiresPassword}>Wachtwoord invoeren</Button>
            </div>
          ) : (
            <>
              <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="members">Actief</TabsTrigger>
                <TabsTrigger value="inactive">Inactief</TabsTrigger>
                <TabsTrigger value="drinks">Drankjes</TabsTrigger>
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
                          onClick={() => {
                            setMemberToDeactivate(member.id);
                            setShowDeactivateDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="inactive" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Inactieve leden worden niet meer getoond bij het bestellen. 
                    Ze worden automatisch verwijderd aan het begin van het nieuwe jaar.
                  </p>
                </div>

                <div className="space-y-2">
                  {inactiveMembers && inactiveMembers.length > 0 ? (
                    inactiveMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-lg border bg-muted p-3 opacity-60">
                        <span>{member.name}</span>
                        <div className="flex items-center gap-3">
                          <span className={Number(member.credit) < 0 ? "text-destructive" : "text-success"}>
                            €{Number(member.credit).toFixed(2)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activateMember.mutate(member.id)}
                          >
                            Activeer
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                      Geen inactieve leden
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="drinks" className="space-y-4">
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
              </TabsContent>
            </Tabs>

            <div className="rounded-lg border border-destructive bg-card p-4 mt-8">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Gevaarzone</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wis alle transacties, inkopen en kosten uit de database. Deze actie kan niet ongedaan gemaakt worden.
              </p>
              <Button 
                variant="destructive"
                onClick={() => setShowResetDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Database Wissen
              </Button>
            </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Selecteer categorie</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PURCHASE_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="h-20 whitespace-normal break-words px-2 text-base active:scale-95"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Openstaande inkopen</h3>
            {purchases
              ?.filter((p: any) => !p.settled)
              .map((purchase: any) => (
                <div key={purchase.id} className="rounded-lg border bg-card p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{purchase.members?.name}</div>
                      <div className="text-sm">
                        {purchase.category} - {purchase.quantity} stuks
                      </div>
                      {purchase.description && (
                        <div className="text-sm text-muted-foreground">{purchase.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        €{Number(purchase.price_per_unit).toFixed(2)}/stuk
                        {purchase.deposit_per_unit > 0 && ` + €${Number(purchase.deposit_per_unit).toFixed(2)} statiegeld`}
                      </div>
                    </div>
                    <div className="text-lg font-bold">€{Number(purchase.total_amount).toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        settlePurchase.mutate({
                          id: purchase.id,
                          method: "credit",
                          memberId: purchase.member_id,
                          amount: purchase.total_amount,
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
                        const roundedAmount = Math.floor(Number(purchase.total_amount) / 10) * 10;
                        const creditAmount = Number(purchase.total_amount) - roundedAmount;
                        toast.info(
                          `Contant: €${roundedAmount}, Credit: €${creditAmount.toFixed(2)}`
                        );
                        settlePurchase.mutate({
                          id: purchase.id,
                          method: "cash",
                          memberId: purchase.member_id,
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
            <h3 className="font-semibold">Verrekende inkopen</h3>
            {purchases
              ?.filter((p: any) => p.settled)
              .map((purchase: any) => (
                <div key={purchase.id} className="rounded-lg border bg-muted p-3 opacity-60">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{purchase.members?.name}</div>
                      <div className="text-sm">
                        {purchase.category} - {purchase.quantity} stuks
                      </div>
                      {purchase.description && (
                        <div className="text-sm text-muted-foreground">{purchase.description}</div>
                      )}
                    </div>
                    <div className="text-lg font-bold">€{Number(purchase.total_amount).toFixed(2)}</div>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Vrije kosten toevoegen</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Gebruik dit voor kosten die niet onder de standaard inkoop categorieën vallen, zoals schoonmaak, reparaties, etc.
            </p>
            <div className="space-y-3">
              <Input
                placeholder="Beschrijving (bijv. schoonmaak, reparatie)"
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
                <option value="">Selecteer persoon die het bedrag voorgeschoten heeft</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
                {inactiveMembers && inactiveMembers.length > 0 && (
                  <optgroup label="Inactieve leden">
                    {inactiveMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                )}
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

        <TabsContent value="statistics" className="space-y-4">
          <iframe 
            src="/statistics" 
            className="w-full h-[calc(100vh-12rem)] rounded-lg border bg-card"
            title="Kassaoverzicht & Statistieken"
          />
        </TabsContent>
      </Tabs>
      )}

      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {PURCHASE_CATEGORIES.find(c => c.id === selectedCategory)?.label} inkoop
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              step="0.01"
              placeholder="Prijs per stuk (€)"
              value={purchasePricePerUnit}
              onChange={(e) => setPurchasePricePerUnit(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Aantal stuks"
              value={purchaseQuantity}
              onChange={(e) => setPurchaseQuantity(e.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Statiegeld per stuk (optioneel)"
              value={purchaseDeposit}
              onChange={(e) => setPurchaseDeposit(e.target.value)}
            />
            {selectedCategory === "general" && (
              <Input
                placeholder="Beschrijving"
                value={purchaseDescription}
                onChange={(e) => setPurchaseDescription(e.target.value)}
              />
            )}
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={purchaseMemberId || ""}
              onChange={(e) => setPurchaseMemberId(e.target.value)}
            >
              <option value="">Selecteer persoon die het bedrag voorgeschoten heeft</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {purchasePricePerUnit && purchaseQuantity && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="text-sm text-muted-foreground">Totaal bedrag</div>
                <div className="text-2xl font-bold">
                  €{(
                    (parseFloat(purchasePricePerUnit) + (purchaseDeposit ? parseFloat(purchaseDeposit) : 0)) *
                    parseInt(purchaseQuantity)
                  ).toFixed(2)}
                </div>
              </div>
            )}
            <Button className="w-full" onClick={() => addPurchase.mutate()}>
              Toevoegen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lid op inactief zetten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Weet je zeker dat je deze persoon uit de lijst wil halen?</p>
            <p className="text-sm text-muted-foreground">
              Het lid wordt op inactief gezet en wordt niet meer getoond bij het bestellen. 
              De gegevens blijven bewaard tot het nieuwe jaar voor de jaarrekening.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeactivateDialog(false);
                  setMemberToDeactivate(null);
                }}
              >
                Annuleren
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (memberToDeactivate) {
                    deactivateMember.mutate(memberToDeactivate);
                  }
                }}
              >
                Ja, op inactief zetten
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetStep === 1 && "Database wissen?"}
              {resetStep === 2 && "Weet je het zeker?"}
              {resetStep === 3 && "Verificatie vereist"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {resetStep === 1 && (
                  <p>Hiermee verwijder je alle data uit de database.</p>
                )}
                {resetStep === 2 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Dit zal permanent verwijderen:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Alle transacties (verkopen)</li>
                      <li>Alle inkopen</li>
                      <li>Alle kosten</li>
                      <li>Alle krediet saldi worden gereset naar €0</li>
                    </ul>
                    <p className="font-semibold text-destructive">Deze actie kan NIET ongedaan gemaakt worden!</p>
                  </div>
                )}
                {resetStep === 3 && (
                  <div className="space-y-3">
                    <p>Type de volgende code over om te bevestigen:</p>
                    <div className="p-3 bg-muted rounded-md text-center">
                      <code className="text-lg font-mono font-bold tracking-wider">
                        {verificationCode}
                      </code>
                    </div>
                    <Input
                      placeholder="Type de code hier"
                      value={userVerificationInput}
                      onChange={(e) => setUserVerificationInput(e.target.value.toUpperCase())}
                      className="font-mono text-center text-lg tracking-wider"
                      maxLength={8}
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReset}>
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetClick}
              className="bg-destructive hover:bg-destructive/90"
              disabled={resetStep === 3 && userVerificationInput !== verificationCode}
            >
              {resetStep === 3 ? "Wissen" : "Doorgaan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
