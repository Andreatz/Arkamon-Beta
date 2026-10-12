# Pubblicazione GitHub Pages

Arkamon viene compilato con Vite e pubblicato dal workflow `.github/workflows/deploy.yml`.

Il vecchio comando locale `npm run deploy` e la dipendenza `gh-pages` sono stati rimossi: compilavano con base `/` e pubblicavano su un branch separato, mentre questo progetto usa la base `/Arkamon-Beta/` e la sorgente GitHub Actions. La pubblicazione continua ad avvenire con un push su `main` o avviando il workflow **Deploy to GitHub Pages**. Una build locale o una PR aperta non pubblica automaticamente il gioco.

L'audit del 12 ottobre 2026 misura circa 3,733 GiB nella cartella pubblica, copiata integralmente in `dist`. Questo supera il limite documentato di 1 GB del sito Pages: il successo della compilazione non certifica che il pacchetto rientri nella quota. La riduzione del pacchetto e la distribuzione separata degli asset restano un lavoro dedicato; vedere [audit del progetto](project-audit-2026-10-12.md).

In **Settings → Pages → Build and deployment → Source**, selezionare **GitHub Actions**. L’API del repository deve riportare `build_type: workflow`.

Il workflow imposta `GITHUB_PAGES=true`, genera il sito in `dist/` con base `/Arkamon-Beta/` e carica esclusivamente quella cartella. Il file `public/.nojekyll`, copiato da Vite in `dist/.nojekyll`, conserva il risultato come sito statico.

Non selezionare la radice di `main` come sorgente di pubblicazione: contiene codice React/TypeScript e documentazione, non il gioco compilato. La build Jekyll automatica può interpretare i doppi delimitatori del JSX negli esempi Markdown come sintassi Liquid. Non è necessario alterare gli esempi di codice per pubblicare il gioco.

## Verificare la configurazione

```powershell
gh api repos/Andreatz/Arkamon-Beta/pages --jq .build_type
```

Il risultato atteso è `workflow`. Per ripristinare la sorgente corretta, con un account che può gestire GitHub Pages:

```powershell
gh api --method PUT repos/Andreatz/Arkamon-Beta/pages -f build_type=workflow
```

L’URL del gioco è `https://andreatz.github.io/Arkamon-Beta/`. Verificare il workflow **Deploy to GitHub Pages** e l’apertura effettiva del gioco; l’eventuale vecchio run **pages-build-deployment** fallito rimane nello storico.

La cartella `docs/ui-previews/` conserva anteprime grafiche autonome e pacchetti consultabili nel repository; il workflow del gioco pubblica `dist/`.

## Verifica dell’11 ottobre 2026

La sorgente Pages era `legacy`, con `main`/radice: il run automatico Jekyll falliva leggendo JSX in `ROADMAP.md`. È stata impostata su `workflow`, senza cambiare dominio o HTTPS.

Il [deploy Vite del commit incorporato da PR #43](https://github.com/Andreatz/Arkamon-Beta/actions/runs/38142851121) è riuscito. Il gioco è stato aperto nel browser sul dominio pubblico: risposta HTTP 200, titolo Arkamon, pulsante Nuova Partita visibile, nessun errore JavaScript o risposta HTTP di errore. Il [controllo CI della PR](https://github.com/Andreatz/Arkamon-Beta/actions/runs/38142702475) è passato.

Riferimenti ufficiali: [configurare la sorgente di pubblicazione](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [API GitHub Pages](https://docs.github.com/en/rest/pages/pages).
