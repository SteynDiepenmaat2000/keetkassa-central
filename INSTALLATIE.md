# KeetKassa - Electron Desktop App Installatie

## ✅ Wat is er veranderd?

Je KeetKassa is nu een **standalone desktop applicatie** die volledig lokaal draait op Ubuntu. Alle data wordt opgeslagen in een lokale SQLite database - **geen internet nodig**!

---

## 📋 Vereisten

1. **Node.js** (versie 18 of hoger)
2. **Docker** (voor better-sqlite3 compilatie)
3. **Git** (om project te klonen)

---

## 🚀 Installatie Stappen

### 1. Clone het project
```bash
git clone <jouw-git-url>
cd keetkassa
```

### 2. Installeer dependencies
```bash
npm install
```

### 3. Start de development versie
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2 (nieuwe terminal): Start Electron
npm run electron:start
```

De app opent nu automatisch! 🎉

---

## 📦 Production Build maken

Om een installeerbare `.AppImage` of `.deb` te maken:

```bash
# Bouw de app
npm run electron:build
```

De installer staat dan in de `release/` folder.

### Installeren op Ubuntu:
```bash
# Voor AppImage
chmod +x release/KeetKassa-*.AppImage
./release/KeetKassa-*.AppImage

# Voor .deb
sudo dpkg -i release/KeetKassa-*.deb
```

---

## 📂 Waar staat mijn data?

De SQLite database wordt opgeslagen in:
```
~/.config/keetkassa/keetkassa.db
```

### Backup maken:
```bash
cp ~/.config/keetkassa/keetkassa.db ~/keetkassa-backup-$(date +%Y%m%d).db
```

---

## 🔧 Troubleshooting

### "better-sqlite3" build errors
```bash
npm install --build-from-source
```

### Electron start niet
Zorg dat poort 8080 vrij is:
```bash
lsof -i :8080
# Kill het proces dat 8080 gebruikt
```

### Database reset nodig?
```bash
rm ~/.config/keetkassa/keetkassa.db
# Start app opnieuw - nieuwe lege database wordt aangemaakt
```

---

## 🎯 Volgende Stappen

1. **Test de app** in development mode
2. **Migreer je huidige data** (zie MIGRATIE.md)
3. **Maak een production build**
4. **Installeer op de kassa computer**

---

## ⚠️ Belangrijke Notes

- De app in de browser preview werkt NIET meer (geen Supabase)
- Je MOET Electron gebruiken voor de lokale database
- Data is lokaal - **maak regelmatig backups**!
- Admin wachtwoord werkt nu lokaal (geen cloud verificatie)

---

## 📞 Support

Problemen? Contact Steyn Diepenmaat.
