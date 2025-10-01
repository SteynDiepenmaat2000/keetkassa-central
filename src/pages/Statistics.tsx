import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const Statistics = () => {
  const navigate = useNavigate();

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, drinks(name, price), members(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: purchases } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Calculate purchase statistics by category
  const purchaseStats = purchases?.reduce((acc: any, purchase) => {
    if (!acc[purchase.category]) {
      acc[purchase.category] = {
        quantity: 0,
        totalAmount: 0,
      };
    }
    acc[purchase.category].quantity += purchase.quantity;
    acc[purchase.category].totalAmount += Number(purchase.total_amount);
    return acc;
  }, {});

  // Calculate sales statistics by drink
  const salesStats = transactions?.reduce((acc: any, transaction: any) => {
    const drinkName = transaction.drinks?.name || "Onbekend";
    if (!acc[drinkName]) {
      acc[drinkName] = {
        quantity: 0,
        totalRevenue: 0,
      };
    }
    acc[drinkName].quantity += 1;
    acc[drinkName].totalRevenue += Number(transaction.price);
    return acc;
  }, {});

  // Calculate financial overview
  const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const totalPurchases = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalCosts = totalPurchases + totalExpenses;
  const balance = totalRevenue - totalCosts;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">Kassaoverzicht & Statistieken</h1>

      <div className="space-y-6">
        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financieel Overzicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="font-medium">Totale inkomsten (verkopen)</span>
              <span className="text-lg font-bold text-green-600">
                €{totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="font-medium">Totale inkopen</span>
              <span className="text-lg font-bold text-red-600">
                -€{totalPurchases.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="font-medium">Overige kosten</span>
              <span className="text-lg font-bold text-red-600">
                -€{totalExpenses.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-card p-4">
              <span className="text-lg font-bold">Balans</span>
              <span className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{balance.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Inkopen per Categorie</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseStats && Object.keys(purchaseStats).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(purchaseStats).map(([category, stats]: [string, any]) => (
                  <div key={category} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div>
                      <div className="font-semibold">{category}</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.quantity} stuks
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€{stats.totalAmount.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
                Nog geen inkopen geregistreerd
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Verkopen per Drankje</CardTitle>
          </CardHeader>
          <CardContent>
            {salesStats && Object.keys(salesStats).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(salesStats)
                  .sort(([, a]: any, [, b]: any) => b.quantity - a.quantity)
                  .map(([drink, stats]: [string, any]) => (
                    <div key={drink} className="flex items-center justify-between rounded-lg border bg-card p-3">
                      <div>
                        <div className="font-semibold">{drink}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.quantity} verkocht
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">€{stats.totalRevenue.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
                Nog geen verkopen geregistreerd
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
