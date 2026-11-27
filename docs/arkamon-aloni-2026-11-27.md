# Aloni di schermo nelle animazioni degli Arkamon · 27 novembre 2026

L'utente ha segnalato aloni verdi, blu o magenta rimasti dallo scontorno, evidenti per esempio su Xesar. Su fondo scuro il bagliore degli effetti sembra luce, ma su fondi chiari, compresi gli sfondi di battaglia, diventa una patina olivastra o verde-azzurra.

## Causa

Fulmini, fiamme, energia e polvere luminosa erano girati sopra lo schermo verde. Lo scontorno di base (`build-arkamon-idle.py` senza opzioni di pulizia) tiene il bagliore come colore semitrasparente già mescolato allo schermo. Il convertitore ha da tempo un'opzione apposita, `--screen-fringe-cleanup`, che però è facoltativa ed era attiva solo su 16 clip.

## Individuazione

`python3 scripts/arkamon-glow-halo.py scan` misura su un campione di pagine la quota di pixel semitrasparenti, lontani dal corpo, con la tinta dello schermo e una patina scura. Il risultato è in `arkamon-glow-halo-scan.json` (misurato prima della correzione). La misura segnala anche specie con colori propri vicini allo schermo (galassia di Oniros, fumi grigi, acqua, foglie), quindi i candidati sono stati scelti a vista: solo specie su schermo verde, senza verde proprio e con un alone evidente.

## Correzione

`python3 scripts/arkamon-fringe-reconvert.py <id>:<azioni> …` riconverte le azioni dal video originale (`animation-source/raw`) con `--screen-fringe-cleanup` e `--reuse-normalization`, quindi con la stessa geometria, la stessa scala e gli stessi tempi di prima. Sostituisce solo atlas, poster e metadati di quelle azioni. Le pagine si rigenerano con `node scripts/build-arkamon-pages.mjs --species <id> --actions <azioni>`. Le vecchie pagine vengono rimosse.

Clip riconvertite:

| Specie | Azioni |
|---|---|
| 9 Felyss | attack, ko |
| 10 Felyss | ko |
| 17 Clastoom | attack |
| 23 Sparkly | idle, attack, hit, victory |
| 46 Spectron | victory, ko (anche `--dominance`, per la foschia verde-azzurra) |
| 74 Impise | attack |
| 75 Impise | attack, victory |
| 85 Psycroak | ko |
| 92 Pyrodil | attack |
| 101 Xesar | attack, ko, hit |
| 102 Xesar | attack, ko |
| 103 Boomrock | attack, ko |
| 111 Cinderon | attack |
| 112 Cinderon | attack, victory |
| 113 Cinderon | ko |
| 148 Geomit | attack |
| 152 Banshoof | victory |
| 180 Sulphurix | ko |
| 181 Sulphurix | attack |
| 183 Steambull | attack |
| 184 Sparfly | attack, ko |

La dimensione dei fotogrammi, la cornice e il numero di pagine restano invariati.

## Limiti

- Le specie su schermo blu o magenta sono quelle con verde proprio (Grooty, Beestrix, Leafrex, …). L'opzione del convertitore vale solo per il verde; i loro aloni azzurrini o violacei restano da trattare a mano.
- `arkamon-glow-halo.py fix` (luce sommata: colore premoltiplicato invariato, opacità ridotta) è disponibile per casi singoli, ma va controllato a vista: sui fumi e sulle nebulose proprie della creatura sbianca i colori.
- In una build con i media separati le pagine nuove si vedono solo dopo aver aggiornato la revisione dei media (`scripts/pin-media-release.mjs`).
