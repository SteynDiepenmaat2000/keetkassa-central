import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, Trophy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Index = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('index-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ["top-drinkers"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        queryClient.invalidateQueries({ queryKey: ["top-drinkers"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const currentTime = new Date().toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentDate = new Date().toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const { data: topDrinkers } = useQuery({
    queryKey: ["top-drinkers"],
    queryFn: async () => {
      const yearStart = new Date(new Date().getFullYear(), 0, 1);

      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("id, name")
        .eq("active", true);

      if (membersError) throw membersError;

      const membersWithStats = await Promise.all(
        members.map(async (member) => {
          const { data: transactions, error: transError } = await supabase
            .from("transactions")
            .select("price")
            .eq("member_id", member.id)
            .gte("created_at", yearStart.toISOString());

          if (transError) throw transError;

          return {
            ...member,
            drinkCount: transactions?.length || 0,
            totalSpent: transactions?.reduce((sum, t) => sum + Number(t.price), 0) || 0,
          };
        })
      );

      return membersWithStats
        .filter((m) => m.drinkCount > 0)
        .sort((a, b) => b.drinkCount - a.drinkCount)
        .slice(0, 3);
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 flex items-start justify-between">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          KeetKassa
        </h1>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground md:text-3xl">
            {currentTime}
          </div>
          <div className="text-sm text-muted-foreground md:text-base">
            {currentDate}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5">
        <Link to="/add-drink" className="block">
          <Button
            size="lg"
            className="h-28 w-full whitespace-normal text-xl font-semibold transition-all active:scale-95 sm:h-32 md:h-36 md:text-2xl"
          >
            Drankje op naam toevoegen
          </Button>
        </Link>

        <Link to="/add-multiple" className="block">
          <Button
            size="lg"
            className="h-28 w-full whitespace-normal text-xl font-semibold transition-all active:scale-95 sm:h-32 md:h-36 md:text-2xl"
          >
            Meerdere drankjes op meerdere namen toevoegen
          </Button>
        </Link>

        <Link to="/receipt" className="block">
          <Button
            size="lg"
            className="h-28 w-full whitespace-normal text-xl font-semibold transition-all active:scale-95 sm:h-32 md:h-36 md:text-2xl"
          >
            Kassabon
          </Button>
        </Link>


        {topDrinkers && topDrinkers.length > 0 && (
          <div className="mt-16 animate-fade-in">
            <h2 className="mb-8 text-center text-xl font-bold text-foreground sm:text-2xl md:text-3xl animate-scale-in">
              🏆 Grootste zoeperds van't joar {new Date().getFullYear()}
            </h2>
            
            <div className="flex items-end justify-center gap-3 sm:gap-4 md:gap-8">
              {/* 2nd Place */}
              {topDrinkers[1] && (
                <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 md:h-20 md:w-20 transition-all hover:scale-110 hover:shadow-lg">
                    <Trophy className="h-8 w-8 text-slate-600 dark:text-slate-300 md:h-10 md:w-10 animate-bounce-subtle" />
                  </div>
                  <div className="w-24 rounded-t-lg bg-gradient-to-t from-slate-300 to-slate-200 p-4 text-center dark:from-slate-700 dark:to-slate-600 md:w-32 transition-all hover:shadow-xl">
                    <div className="mb-2 text-4xl font-bold text-slate-700 dark:text-slate-200">2</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 md:text-base">
                      {topDrinkers[1].name}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 md:text-sm">
                      {topDrinkers[1].drinkCount} drankjes
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      €{topDrinkers[1].totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-16 w-24 bg-slate-300 dark:bg-slate-700 md:h-20 md:w-32" />
                </div>
              )}

              {/* 1st Place */}
              {topDrinkers[0] && (
                <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "0s" }}>
                  <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg md:h-24 md:w-24 transition-all hover:scale-110 hover:shadow-2xl">
                    <Trophy className="h-10 w-10 text-yellow-900 md:h-12 md:w-12 animate-bounce-subtle" />
                  </div>
                  <div className="w-28 rounded-t-lg bg-gradient-to-t from-yellow-500 to-yellow-400 p-4 text-center shadow-lg md:w-36 transition-all hover:shadow-2xl hover:scale-105">
                    <div className="mb-2 text-5xl font-bold text-yellow-900">1</div>
                    <div className="text-base font-bold text-yellow-900 md:text-lg">
                      {topDrinkers[0].name}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-yellow-800 md:text-base">
                      {topDrinkers[0].drinkCount} drankjes
                    </div>
                    <div className="text-sm font-semibold text-yellow-800">
                      €{topDrinkers[0].totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-24 w-28 bg-yellow-500 shadow-lg md:h-28 md:w-36" />
                </div>
              )}

              {/* 3rd Place */}
              {topDrinkers[2] && (
                <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-700 dark:bg-amber-800 md:h-16 md:w-16 transition-all hover:scale-110 hover:shadow-lg">
                    <Trophy className="h-7 w-7 text-amber-200 md:h-8 md:w-8 animate-bounce-subtle" />
                  </div>
                  <div className="w-20 rounded-t-lg bg-gradient-to-t from-amber-800 to-amber-700 p-3 text-center dark:from-amber-900 dark:to-amber-800 md:w-28 transition-all hover:shadow-xl">
                    <div className="mb-2 text-3xl font-bold text-amber-100">3</div>
                    <div className="text-xs font-semibold text-amber-100 md:text-sm">
                      {topDrinkers[2].name}
                    </div>
                    <div className="mt-2 text-xs text-amber-200">
                      {topDrinkers[2].drinkCount} drankjes
                    </div>
                    <div className="text-xs text-amber-200">
                      €{topDrinkers[2].totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-12 w-20 bg-amber-800 dark:bg-amber-900 md:h-14 md:w-28" />
                </div>
              )}
            </div>
          </div>
        )}

        <Link to="/settings" className="mt-8 block">
          <Button
            size="lg"
            variant="ghost"
            className="mx-auto flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Instellingen
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
