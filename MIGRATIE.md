# Data Migratie van Supabase naar SQLite

## ⚠️ LET OP: Data Migratie Vereist!

Je huidige data zit nog in Supabase. Volg deze stappen om alles over te zetten naar de lokale SQLite database.

---

## 🔄 Automatische Migratie Script (Aanbevolen)

### Stap 1: Export data uit Supabase

Ga naar je Supabase dashboard:

1. **Members**: Database → Tables → members → Export → CSV
2. **Drinks**: Database → Tables → drinks → Export → CSV
3. **Transactions**: Database → Tables → transactions → Export → CSV
4. **Expenses**: Database → Tables → expenses → Export → CSV
5. **Purchases**: Database → Tables → purchases → Export → CSV
6. **Credit Transactions**: Database → Tables → credit_transactions → Export → CSV
7. **Settings**: Database → Tables → settings → Export → CSV

Sla alle CSV files op in een `migration/` folder in je project.

### Stap 2: Run migratie script

```bash
# Maak een migratie script
npm run migrate
```

Dit script leest de CSV files en importeert ze in SQLite.

---

## 📝 Handmatige Migratie (Alternatief)

Als je maar weinig data hebt, kun je het handmatig invoeren via de Settings pagina.

---

## ✅ Verificatie

Na migratie, check of alles goed is gegaan:

1. Start de app: `npm run electron:start`
2. Ga naar Settings
3. Controleer of alle leden, drankjes en transacties er zijn
4. Test een drankje toevoegen
5. Check een kassabon

---

## 🔒 Oude Supabase Database

Na succesvolle migratie kun je:
- De Supabase database pauzeren (bespaart kosten)
- Of volledig verwijderen als je zeker bent

**Bewaar wel eerst een backup!**

---

## 📊 Data Mapping

```
Supabase UUID → SQLite TEXT
PostgreSQL NUMERIC → SQLite REAL
PostgreSQL BOOLEAN → SQLite INTEGER (0/1)
PostgreSQL TIMESTAMP → SQLite TEXT (ISO8601)
```

---

## 🆘 Hulp Nodig?

Contact Steyn als je vast loopt bij de migratie!
