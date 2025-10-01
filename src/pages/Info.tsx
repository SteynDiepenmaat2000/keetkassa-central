import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Shield, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Info = () => {
  const versionNumber = "1.0";
  const versionDate = "01-10-2025";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar hoofdmenu
        </Button>
      </Link>

      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          Informatie
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">KeetKassa</CardTitle>
            <CardDescription>Versie {versionNumber} - {versionDate}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Wat kun je met deze app?</h3>
              <p className="text-muted-foreground">
                Met KeetKassa kun je eenvoudig drankjes registreren op naam. Je kunt één drankje 
                toevoegen voor één persoon, of meerdere drankjes voor meerdere personen tegelijk. 
                Ook kun je kassabonnen bekijken en instellingen aanpassen zoals leden beheren, 
                drankjes toevoegen of aanpassen, en transacties inzien.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <AlertCircle className="h-5 w-5" />
              Klopt er iets niet?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground">
              Zie je een fout of werkt er iets niet zoals het hoort? Meld dit dan even bij Steyn Diepenmaat, 
              zodat het opgelost kan worden.
            </p>
            <p className="text-foreground">
              Is er iets misgegaan met een transactie (bijvoorbeeld een drankje per ongeluk dubbel 
              aangevinkt)? Laat dit ook weten, dan zetten we het weer goed in het systeem.
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-500">
              <Shield className="h-5 w-5" />
              Eerlijk handelen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">
              Wij gaan ervan uit dat iedereen met goede bedoelingen handelt en eerlijk zijn drankjes 
              registreert. Sjoemelen of bewust foute registraties aanmaken wordt niet geaccepteerd. 
              We bouwen op vertrouwen en eerlijkheid binnen onze keet!
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-500">
              <Shield className="h-5 w-5" />
              Credits: Hoe werkt het?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground">
              Met je credit account kun je drankjes kopen zonder elke keer contant geld te hoeven 
              betalen. Als je credit hebt, wordt dat automatisch gebruikt bij het afrekenen van je drankjes.
            </p>
            <p className="text-foreground">
              Je kunt credit krijgen door:
            </p>
            <ul className="list-disc list-inside text-foreground ml-2 space-y-1">
              <li>Geld overmaken naar de keet (wordt dan op je account gezet)</li>
              <li>Als er iets voor de keet is gekocht (zie hieronder)</li>
              <li>Als correctie door een admin wanneer er iets mis is gegaan</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-500">
              <AlertCircle className="h-5 w-5" />
              Inkopen voor de keet: Wisselgeld beleid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground">
              Heb je iets gekocht voor de keet? Super! Dit is hoe we het terugbetalen:
            </p>
            <p className="text-foreground font-medium">
              Omdat we alleen tientjes in contant hebben, betalen we kleine bedragen niet helemaal 
              contant terug.
            </p>
            <p className="text-foreground">
              <span className="font-semibold">Voorbeeld:</span> Je hebt voor €86,75 boodschappen gedaan. 
              Dan krijg je €80,- contant terug en wordt €6,75 op je credit account gezet.
            </p>
            <p className="text-foreground text-sm text-muted-foreground">
              Dit doen we om te voorkomen dat we met allemaal kleingeld moeten slepen. Je credit kun 
              je gewoon gebruiken voor drankjes!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Developer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground font-medium">
              Steyn Diepenmaat
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ontwikkeld voor en door de keet
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Info;
