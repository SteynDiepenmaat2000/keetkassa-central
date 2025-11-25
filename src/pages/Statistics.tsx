import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

const Statistics = () => {
  const navigate = useNavigate();

  // Get date ranges
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const lastWeekEnd = new Date(weekStart);
  lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

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

  const { data: creditTransactions } = useQuery({
    queryKey: ["credit-transactions-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*");
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

  const { data: drinks } = useQuery({
    queryKey: ["drinks-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drinks")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Filter transactions by period
  const thisWeekTransactions = transactions?.filter(
    (t) => new Date(t.created_at) >= weekStart
  );
  const lastWeekTransactions = transactions?.filter(
    (t) => new Date(t.created_at) >= lastWeekStart && new Date(t.created_at) < lastWeekEnd
  );
  const thisMonthTransactions = transactions?.filter(
    (t) => new Date(t.created_at) >= monthStart
  );
  const lastMonthTransactions = transactions?.filter(
    (t) => new Date(t.created_at) >= lastMonthStart && new Date(t.created_at) < monthStart
  );

  // Credit transactions by period
  const thisWeekCredits = creditTransactions?.filter(
    (c) => new Date(c.created_at) >= weekStart
  );
  const lastWeekCredits = creditTransactions?.filter(
    (c) => new Date(c.created_at) >= lastWeekStart && new Date(c.created_at) < lastWeekEnd
  );
  const thisMonthCredits = creditTransactions?.filter(
    (c) => new Date(c.created_at) >= monthStart
  );
  const lastMonthCredits = creditTransactions?.filter(
    (c) => new Date(c.created_at) >= lastMonthStart && new Date(c.created_at) < monthStart
  );

  // Calculate totals
  const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const totalCreditAdded = creditTransactions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const totalPurchases = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalCosts = totalPurchases + totalExpenses;
  
  // Estimated profit (assuming 50% markup on average)
  const estimatedProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

  // Weekly comparison
  const thisWeekRevenue = thisWeekTransactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const lastWeekRevenue = lastWeekTransactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const weeklyChange = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

  const thisWeekCreditAdded = thisWeekCredits?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const lastWeekCreditAdded = lastWeekCredits?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  // Monthly comparison
  const thisMonthRevenue = thisMonthTransactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const lastMonthRevenue = lastMonthTransactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
  const monthlyChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const thisMonthCreditAdded = thisMonthCredits?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const lastMonthCreditAdded = lastMonthCredits?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  // Sales statistics by drink
  const salesStats = transactions?.reduce((acc: any, transaction: any) => {
    const drinkName = transaction.drinks?.name || "Onbekend";
    if (!acc[drinkName]) {
      acc[drinkName] = {
        quantity: 0,
        totalRevenue: 0,
        weekCount: 0,
        monthCount: 0,
      };
    }
    acc[drinkName].quantity += 1;
    acc[drinkName].totalRevenue += Number(transaction.price);
    
    if (new Date(transaction.created_at) >= weekStart) {
      acc[drinkName].weekCount += 1;
    }
    if (new Date(transaction.created_at) >= monthStart) {
      acc[drinkName].monthCount += 1;
    }
    return acc;
  }, {});

  // Find trending drinks (most growth this week vs last week)
  const drinkTrends = Object.entries(salesStats || {}).map(([name, stats]: [string, any]) => {
    const lastWeekCount = lastWeekTransactions?.filter((t: any) => t.drinks?.name === name).length || 0;
    const thisWeekCount = stats.weekCount || 0;
    const growth = lastWeekCount > 0 ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 : 0;
    
    return {
      name,
      thisWeekCount,
      lastWeekCount,
      growth,
      totalQuantity: stats.quantity,
    };
  }).sort((a, b) => b.growth - a.growth);

  // Purchase statistics by category
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

  // Map drink names to categories (case insensitive matching)
  const getCategoryForDrink = (drinkName: string): string => {
    const name = drinkName.toLowerCase();
    if (name.includes('bier') || name.includes('beer')) return 'Bier';
    if (name.includes('cola') || name.includes('fris') || name.includes('sinas') || name.includes('sprite') || name.includes('fanta')) return 'Fris';
    if (name.includes('wijn') || name.includes('wine')) return 'Wijn';
    if (name.includes('shot') || name.includes('likeur') || name.includes('sterke drank')) return 'Sterke drank';
    return 'Overig';
  };

  // Calculate learned average cost per unit for each category from historical purchases
  const learnedCategoryAverages = Object.entries(purchaseStats || {}).reduce((acc: any, [category, stats]: [string, any]) => {
    acc[category] = stats.quantity > 0 ? stats.totalAmount / stats.quantity : 0;
    return acc;
  }, {});

  // Enhanced sales statistics with learned cost estimation per drink
  const enhancedSalesStats = Object.entries(salesStats || {}).map(([drinkName, stats]: [string, any]) => {
    const category = getCategoryForDrink(drinkName);
    const learnedCostPerUnit = learnedCategoryAverages[category] || 0;
    const estimatedTotalCost = stats.quantity * learnedCostPerUnit;
    const estimatedProfit = stats.totalRevenue - estimatedTotalCost;
    const estimatedMargin = stats.totalRevenue > 0 ? (estimatedProfit / stats.totalRevenue) * 100 : 0;
    
    return {
      drinkName,
      category,
      quantity: stats.quantity,
      totalRevenue: stats.totalRevenue,
      avgRevenuePerUnit: stats.totalRevenue / stats.quantity,
      learnedCostPerUnit,
      estimatedTotalCost,
      estimatedProfit,
      estimatedMargin,
      weekCount: stats.weekCount,
      monthCount: stats.monthCount,
    };
  });

  // Calculate total learned profit (sum of all individual drink profits)
  const totalLearnedProfit = enhancedSalesStats.reduce((sum, drink) => sum + drink.estimatedProfit, 0) - totalExpenses;
  const totalLearnedCosts = enhancedSalesStats.reduce((sum, drink) => sum + drink.estimatedTotalCost, 0);
  const learnedProfitMargin = totalRevenue > 0 ? (totalLearnedProfit / totalRevenue) * 100 : 0;

  // Calculate profit per category by matching sales to purchases
  const categoryProfitAnalysis = Object.entries(salesStats || {}).reduce((acc: any, [drinkName, stats]: [string, any]) => {
    const category = getCategoryForDrink(drinkName);
    if (!acc[category]) {
      acc[category] = {
        totalSold: 0,
        totalRevenue: 0,
        drinks: [],
      };
    }
    acc[category].totalSold += stats.quantity;
    acc[category].totalRevenue += stats.totalRevenue;
    acc[category].drinks.push({
      name: drinkName,
      quantity: stats.quantity,
      revenue: stats.totalRevenue,
    });
    return acc;
  }, {});

  // Combine with purchase data to calculate actual profit margins
  const profitByCategory = Object.keys(categoryProfitAnalysis).map((category) => {
    const salesData = categoryProfitAnalysis[category];
    const purchaseData = purchaseStats?.[category] || { quantity: 0, totalAmount: 0 };
    
    const totalCost = purchaseData.totalAmount;
    const totalRevenue = salesData.totalRevenue;
    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    // Calculate expected vs actual sales ratio
    const purchasedUnits = purchaseData.quantity;
    const soldUnits = salesData.totalSold;
    const salesRatio = purchasedUnits > 0 ? (soldUnits / purchasedUnits) * 100 : 0;
    
    return {
      category,
      totalCost,
      totalRevenue,
      profit,
      profitMargin,
      purchasedUnits,
      soldUnits,
      salesRatio,
      avgCostPerUnit: purchasedUnits > 0 ? totalCost / purchasedUnits : 0,
      avgRevenuePerUnit: soldUnits > 0 ? totalRevenue / soldUnits : 0,
    };
  });

  // Calculate overall profit based on actual purchases vs sales
  const totalActualCosts = profitByCategory.reduce((sum, cat) => sum + cat.totalCost, 0);
  const totalActualRevenue = profitByCategory.reduce((sum, cat) => sum + cat.totalRevenue, 0);
  const actualProfit = totalActualRevenue - totalActualCosts - totalExpenses;
  const actualProfitMargin = totalActualRevenue > 0 ? (actualProfit / totalActualRevenue) * 100 : 0;

  // Total drinks sold
  const totalDrinksSold = transactions?.length || 0;
  const thisWeekDrinksSold = thisWeekTransactions?.length || 0;
  const lastWeekDrinksSold = lastWeekTransactions?.length || 0;
  const thisMonthDrinksSold = thisMonthTransactions?.length || 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Button variant="ghost" onClick={() => navigate("/settings")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug
      </Button>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">Uitgebreide Statistieken</h1>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totaal Verkocht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDrinksSold}</div>
              <p className="text-xs text-muted-foreground mt-1">
                drankjes all-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totale Omzet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                uit verkopen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Geleerde Winst
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalLearnedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{totalLearnedProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                marge: {learnedProfitMargin.toFixed(1)}% (op basis van historische data)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credit Opgewaardeerd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">€{totalCreditAdded.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                totaal toegevoegd
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly vs Last Week */}
        <Card>
          <CardHeader>
            <CardTitle>Deze Week vs Vorige Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">Verkopen</h3>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Deze week</span>
                  <span className="font-bold">{thisWeekDrinksSold} drankjes (€{thisWeekRevenue.toFixed(2)})</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Vorige week</span>
                  <span className="font-bold">{lastWeekDrinksSold} drankjes (€{lastWeekRevenue.toFixed(2)})</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {weeklyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(weeklyChange).toFixed(1)}% {weeklyChange >= 0 ? 'groei' : 'daling'}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Credit Opwaarderingen</h3>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Deze week</span>
                  <span className="font-bold">€{thisWeekCreditAdded.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Vorige week</span>
                  <span className="font-bold">€{lastWeekCreditAdded.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly vs Last Month */}
        <Card>
          <CardHeader>
            <CardTitle>Deze Maand vs Vorige Maand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">Verkopen</h3>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Deze maand</span>
                  <span className="font-bold">{thisMonthDrinksSold} drankjes (€{thisMonthRevenue.toFixed(2)})</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Vorige maand</span>
                  <span className="font-bold">{lastMonthTransactions?.length || 0} drankjes (€{lastMonthRevenue.toFixed(2)})</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(monthlyChange).toFixed(1)}% {monthlyChange >= 0 ? 'groei' : 'daling'}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Credit Opwaarderingen</h3>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Deze maand</span>
                  <span className="font-bold">€{thisMonthCreditAdded.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Vorige maand</span>
                  <span className="font-bold">€{lastMonthCreditAdded.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trending Drinks */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Trending Drankjes</CardTitle>
          </CardHeader>
          <CardContent>
            {drinkTrends && drinkTrends.length > 0 ? (
              <div className="space-y-2">
                {drinkTrends.slice(0, 5).map((drink) => (
                  <div key={drink.name} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="flex-1">
                      <div className="font-semibold">{drink.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Deze week: {drink.thisWeekCount} | Vorige week: {drink.lastWeekCount}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-sm font-bold ${drink.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {drink.growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {Math.abs(drink.growth).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {drink.totalQuantity} totaal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
                Nog geen data beschikbaar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learned Profit Analysis per Drink */}
        <Card>
          <CardHeader>
            <CardTitle>Geleerde Winstanalyse per Drankje</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gebaseerd op historische inkoop- en verkoopdata per categorie
            </p>
          </CardHeader>
          <CardContent>
            {enhancedSalesStats.length > 0 ? (
              <div className="space-y-2">
                {enhancedSalesStats
                  .sort((a, b) => b.estimatedProfit - a.estimatedProfit)
                  .map((drink) => (
                    <div key={drink.drinkName} className="rounded-lg border bg-card p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold">{drink.drinkName}</div>
                          <div className="text-xs text-muted-foreground">{drink.category}</div>
                        </div>
                        <div className={`text-lg font-bold ${drink.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{drink.estimatedProfit.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded bg-muted p-2">
                          <div className="text-muted-foreground">Verkocht</div>
                          <div className="font-semibold">{drink.quantity}x</div>
                        </div>
                        <div className="rounded bg-muted p-2">
                          <div className="text-muted-foreground">Inkoopprijs</div>
                          <div className="font-semibold">€{drink.learnedCostPerUnit.toFixed(2)}</div>
                        </div>
                        <div className="rounded bg-muted p-2">
                          <div className="text-muted-foreground">Verkoopprijs</div>
                          <div className="font-semibold">€{drink.avgRevenuePerUnit.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                        <span>Marge per stuk: €{((drink.avgRevenuePerUnit - drink.learnedCostPerUnit)).toFixed(2)}</span>
                        <span className={`font-bold ${drink.estimatedMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {drink.estimatedMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
                Nog geen verkoopdata beschikbaar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Averages Learned */}
        <Card>
          <CardHeader>
            <CardTitle>Geleerde Gemiddelden per Categorie</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Deze gemiddelde inkoopprijzen worden gebruikt voor winstberekening
            </p>
          </CardHeader>
          <CardContent>
            {Object.keys(learnedCategoryAverages).length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(learnedCategoryAverages).map(([category, avgCost]: [string, any]) => (
                  <div key={category} className="rounded-lg border bg-card p-3">
                    <div className="font-semibold">{category}</div>
                    <div className="text-2xl font-bold text-primary">€{avgCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">gemiddelde inkoopprijs per stuk</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
                Nog geen inkoopdata om van te leren
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Analysis by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Directe Koppeling: Inkopen vs Verkopen</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Vergelijking tussen wat daadwerkelijk is ingekocht en verkocht
            </p>
          </CardHeader>
          <CardContent>
            {profitByCategory.length > 0 ? (
              <div className="space-y-4">
                {profitByCategory.map((cat) => (
                  <div key={cat.category} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{cat.category}</h3>
                      <span className={`text-xl font-bold ${cat.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{cat.profit.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded bg-muted p-2">
                        <div className="text-muted-foreground">Ingekocht</div>
                        <div className="font-semibold">{cat.purchasedUnits} stuks (€{cat.totalCost.toFixed(2)})</div>
                        <div className="text-xs text-muted-foreground">Ø €{cat.avgCostPerUnit.toFixed(2)}/stuk</div>
                      </div>
                      
                      <div className="rounded bg-muted p-2">
                        <div className="text-muted-foreground">Verkocht</div>
                        <div className="font-semibold">{cat.soldUnits} stuks (€{cat.totalRevenue.toFixed(2)})</div>
                        <div className="text-xs text-muted-foreground">Ø €{cat.avgRevenuePerUnit.toFixed(2)}/stuk</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Winstmarge</span>
                      <span className={`font-bold ${cat.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cat.profitMargin.toFixed(1)}%
                      </span>
                    </div>

                    {cat.salesRatio > 100 && (
                      <div className="rounded bg-yellow-100 dark:bg-yellow-900/20 p-2 text-sm">
                        <span className="font-semibold text-yellow-800 dark:text-yellow-200">⚠️ Mogelijk niet alles gestreept:</span>
                        <span className="text-yellow-700 dark:text-yellow-300 ml-1">
                          {cat.soldUnits} verkocht vs {cat.purchasedUnits} ingekocht ({cat.salesRatio.toFixed(0)}%)
                        </span>
                      </div>
                    )}
                    
                    {cat.salesRatio < 80 && cat.purchasedUnits > 0 && (
                      <div className="rounded bg-blue-100 dark:bg-blue-900/20 p-2 text-sm">
                        <span className="font-semibold text-blue-800 dark:text-blue-200">ℹ️ Lage verkoop ratio:</span>
                        <span className="text-blue-700 dark:text-blue-300 ml-1">
                          Slechts {cat.salesRatio.toFixed(0)}% verkocht van voorraad
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
                Nog geen data beschikbaar voor directe koppeling
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financieel Overzicht (Geleerd Model)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Berekend op basis van historische inkoop gemiddelden
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="font-medium">Totale inkomsten (verkopen)</span>
              <span className="text-lg font-bold text-green-600">
                €{totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="font-medium">Geschatte kosten (o.b.v. geleerde prijzen)</span>
              <span className="text-lg font-bold text-red-600">
                -€{totalLearnedCosts.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="font-medium">Overige kosten</span>
              <span className="text-lg font-bold text-red-600">
                -€{totalExpenses.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-card p-4">
              <span className="text-lg font-bold">Geleerde Netto Winst</span>
              <span className={`text-2xl font-bold ${totalLearnedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{totalLearnedProfit.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground text-center pt-2">
              💡 Dit model wordt nauwkeuriger naarmate er meer inkoop- en verkoopdata beschikbaar is
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
            <CardTitle>Verkopen per Drankje (All-Time)</CardTitle>
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
                        <div className="text-xs text-muted-foreground">
                          €{(stats.totalRevenue / stats.quantity).toFixed(2)}/stuk
                        </div>
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