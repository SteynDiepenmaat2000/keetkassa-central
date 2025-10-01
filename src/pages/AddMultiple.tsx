import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const AddMultiple = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('add-multiple-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drinks' }, () => {
        queryClient.invalidateQueries({ queryKey: ["drinks"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: drinks } = useQuery({
    queryKey: ["drinks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drinks")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
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

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">
        Selecteer het drankje
      </h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {drinks?.map((drink) => (
          <Button
            key={drink.id}
            className="h-20 flex-col text-base font-medium"
            onClick={() => navigate(`/add-multiple/${drink.id}`)}
          >
            <span>{drink.name}</span>
            <span className="text-sm opacity-80">
              €{Number(drink.price).toFixed(2)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AddMultiple;
