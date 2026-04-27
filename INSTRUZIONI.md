# 🩹 Patch fix per "border-arka-border/50 does not exist"

## Cosa è successo

Il comando `npm audit fix --force` ha forzato l'aggiornamento di **Vite da v5 a v8**, che è un major change incompatibile. Il nuovo Vite 8 non riesce a caricare correttamente la configurazione di Tailwind, e di conseguenza Tailwind non riconosce i colori custom — da qui l'errore sulla classe `border-arka-border/50`.

⚠️ **Regola d'oro**: in un progetto JavaScript non eseguire mai `npm audit fix --force`. Le "vulnerabilità moderate" sono quasi sempre falsi positivi nelle dipendenze di sviluppo.

## Procedura per ripristinare

Da PowerShell, dentro la cartella `Arkamon`:

```powershell
# 1. Rimuovi node_modules e lockfile (lo stato corrotto)
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 2. Sostituisci i 3 file di questa patch:
#    - package.json (root)
#    - .npmrc       (root)
#    - src/index.css

# 3. Reinstalla con le versioni corrette
npm install

# 4. Avvia
npm run dev
```

Quando avvii dovresti vedere `VITE v5.4.14 ready`. Se vedi un Vite v8 o superiore, qualcosa è andato storto — ricontrolla che `package.json` sia stato sovrascritto correttamente.

## Cosa cambia nei file

### `package.json`
- Tutte le versioni sono **pinned** (numero esatto, niente `^`)
- Aggiunto blocco `overrides` che impedisce a npm di sostituire Vite/Tailwind con versioni incompatibili anche se una dipendenza transitiva le richiede
- Rimosso ESLint (era deprecato, non strettamente necessario per partire)

### `.npmrc` (nuovo)
- `save-exact=true`: ogni nuovo pacchetto verrà salvato con versione esatta
- `audit-level=high`: silenzia warning su vulnerabilità moderate (di solito falsi positivi in dev dependencies)

### `src/index.css`
- Rimosso `border-arka-border/50` → usato `border-arka-border` (la differenza di trasparenza al 50% era solo cosmetica). Se in futuro vorrai un bordo semi-trasparente, definisci un colore dedicato in `tailwind.config.js` invece di usare la sintassi `/N`.
