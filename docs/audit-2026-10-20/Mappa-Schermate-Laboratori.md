# Arkamon — inventario operativo delle superfici UI

> Archivio del 20 ottobre 2026: **Mappa delle superfici ispezionate**. Origine nella cartella della sessione: `outputs/Mappa-Schermate-Laboratori.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Verifica statica del 20 ottobre 2026 sul checkout `C:\Users\andre\Documents\Codex\2026-10-19\https-github-com-andreatz-arkamon-beta\checkout`, commit `ea4dcab344cf4030757b4c9bb00f4890b4421be4`. Nessuna modifica al prodotto. Questo inventario ricostruisce dai sorgenti le superfici da visitare; **non dichiara che siano state visualizzate in browser in questa ripresa**. I precedenti screenshot non sono presenti nel filesystem corrente. Gli asset pubblici sono in ripristino: eventuali immagini mancanti prima della sua conclusione non dimostrano difetti del prodotto.

## Accessi e differenza tra anteprima e gioco

Sostituire `ORIGINE` con il server locale effettivamente avviato dal coordinatore. `src/App.tsx:55–85` riconosce soltanto i percorsi qui sotto; non esiste un hash pubblico per ogni scena della campagna. La navigazione normale dipende dallo stato di gioco. Prima di aprire una seconda scheda runtime, considerare `src/session/SessionGate.tsx:25–28`: una scheda senza proprietà di scrittura mostra la replica, non un secondo motore di gioco.

| Entrypoint | Superficie | Scopo della visita |
|---|---|---|
| `ORIGINE/` | Campagna, scena salvata o titolo | Flussi reali, geometria responsive, transizioni, input, persistenza locale |
| `ORIGINE/#ui-studio` | Editor UI completo | Copertura deterministica delle 47 viste elencate sotto |
| `ORIGINE/?uiStudioPreview=1` | Iframe interno dello Studio | Non è un deep link a una schermata scelta: parte da Titolo, viene comandato dall'editor |
| `ORIGINE/?view=broadcast` | Proiezione pubblica | Titolo/attesa, mappa, battaglia, dadi, strumenti presentati, pausa/replica |
| `ORIGINE/#battle-rules-lab` | Laboratorio moneta/status | Moneta iniziale, paralisi, sonno, veleno |
| `ORIGINE/#audio-lab` | Laboratorio audio | Mossa/evento, ascolto, sincronizzazione VFX, scelta candidato/conferma |
| `ORIGINE/#transition-lab` | Laboratorio transizioni | Ordinaria, evoluzione, ingresso battaglia |
| `ORIGINE/#vfx-lab` | Galleria VFX | Asset, filtri, confronto, lato A/B, ancoraggio, scala, sfondi |
| `ORIGINE/#dice-lab` | Laboratorio dadi | Risultati 1–6, tutti i risultati, 20 dadi, A/B, fallback |
| `ORIGINE/#deposit-lab` | Laboratorio deposito | Squadra/riserve campione, spostamento, selezione e reset |
| `ORIGINE/#arkamon-lab` | Laboratorio animazioni creature | Specie, frontale/retro, cinque azioni, sequenza, frame review |
| `Ctrl+Shift+A` o `Cmd+Shift+A` nel gioco | Pannello Admin/Regia | Abilita Admin se necessario, poi apre/chiude il pannello |
| Pulsante fisso `Partita` | Finestra strumenti giocatore | Menù, squadra, deposito, Arkadex, analisi, borsa, strumenti ausiliari |

La preview dello Studio è **fissa a 1920×1080**, usa fixture isolate, imposta `MotionConfig reducedMotion="always"`, imposta `SceneInputContext=true` e intercetta i comandi di gioco (`src/ui-studio/UiStudioPreview.tsx:43–71`, `src/ui-studio/UiDesignRuntime.tsx:282–300`). Certifica composizione delle fixture, non funzionamento, touch, ritorni, velocità della battaglia o responsive. Il motion personalizzato che legge `useGameMotionPreferences()` dipende invece dalla preferenza salvata/OS: non assumere che `MotionConfig` congeli ogni canvas/GIF.

## Le 25 basi dello Studio

In `ORIGINE/#ui-studio` usare il select con etichetta accessibile **Schermata da modificare**. Il valore del select è il codice nella prima colonna. La seconda colonna riproduce l'etichetta sorgente. Tutte le righe hanno stato attuale **da verificare visivamente**. Fonti: `src/ui-studio/types.ts:92–103`; montaggio `src/ui-studio/UiStudioPreview.tsx:24–37`.

| Valore | Etichetta | Percorso runtime reale / verifica funzionale successiva |
|---|---|---|
| `titolo` | Titolo | Avvio, nuova/ripresa partita, strumenti e gate iniziali |
| `laboratorio` | Laboratorio | Scelta starter e conferma per entrambi i giocatori |
| `mappa-principale` | Mappa principale | Località, viaggio, percorso raggiungibile, turno G1/G2 |
| `citta` | Città · Venezia | Mappa locale, nodo corrente, spostamenti e interazioni |
| `percorso` | Percorso 1 | Mappa locale, incontri, segreti e interazioni |
| `mappa-griglia` | Mappa a griglia | Celle, movimento, attività, interazione consumata/bloccata |
| `battaglia` | Battaglia | Turno A/B, mosse, Suprema, borsa, scambio, cattura/fuga ove consentite |
| `lega` | Lega | Squadre, progressione/candidatura, finale e vincitore secondo stato |
| `evoluzione` | Evoluzione | Prima/durante/dopo, continuità del compagno e ritorno |
| `menu` | Menù Partita | Riepilogo, progressione, squadra breve, accessi strumenti |
| `squadra` | Squadra | Selezione, analisi, borsa, riordino/scambio, annulla |
| `deposito` | Deposito | Box, filtri, ordinamento, slot squadra/box, spostamento e annulla |
| `arkadex` | Arkadex | Ricerca, tipo/scoperta, pagine, specie ignota/vista/ottenuta, esemplare |
| `analisi` | Analisi | Selettore esemplare, scheda, mosse, status/cure |
| `borsa` | Borsa | Categorie/oggetto, descrizione, quantità, bersaglio, effetto previsto/esito |
| `negozio` | Negozio · anteprima | In runtime si apre da interazione valida sul nodo; non da nav globale |
| `register` | Registro | Schede Registro del match, Diario, Cronache |
| `race` | Gara | Posizioni, progressione e accesso Lega |
| `recap` | Ripresa | Stato corrente e ultimi eventi |
| `journal` | Diario | Evento privato/giocatore, filtri e contenuto lungo |
| `backup` | Backup | Export/import, validazione, anteprima, ripristino/errori |
| `settings` | Impostazioni | Volumi, velocità, riduzione movimento, memoria grafica |
| `chronicles` | Cronache | Archivio battaglie, dettaglio log/dadi |
| `match` | Registro del match | Match, ordinamento/eventi, stato vuoto e lungo |
| `challenges` | Sfide | Seed, Fanta-Team Builder, preview, avvio, import/condivisione, risultati |

## Le 22 viste interne aggiuntive: totale Studio 47

Usare il select **Vista interna** dopo avere selezionato la base. Il suo `value` è soltanto il suffisso, ad esempio `mosse`, non `analisi:mosse`. L'editor compone internamente `base:suffisso` (`UiStudioEditor.tsx:403–404`). `default` è già compreso nelle 25 basi. Le città e i percorsi espliciti sono conteggiati come 16 stati aggiuntivi; `citta:Venezia` e `percorso:Percorso_1` ripetono la località delle rispettive basi ma costituiscono voci esplicite del selettore, quindi servono per verificare anche lo stato salvabile di vista.

| Base | Valori aggiuntivi / etichette | Numero |
|---|---|---:|
| `analisi` | `mosse` / Mosse; `status` / Status e cure | 2 |
| `arkadex` | `moves` / Mosse; `evolution` / Evoluzioni | 2 |
| `battaglia` | `dice` / Pannello lancio dadi; `bag` / Borsa in battaglia | 2 |
| `citta` | `Cagliari`, `Foggia`, `Milano`, `Napoli`, `Palermo`, `Piacenza`, `ReggioCalabria`, `Roma`, `Torino`, `Venezia` | 10 |
| `percorso` | `Percorso_1`, `Percorso_13`, `Percorso_14`, `Percorso_15`, `Percorso_2`, `Percorso_4` | 6 |

Fonte: `src/ui-studio/types.ts:105–111`, elenco mappe `src/data/localMaps.ts:21–37`. Per le mappe, verificare dopo il ripristino di `public` artwork intero, corrispondenza nodi/strade, segnalazione posizione e itinerario. Il numero di screenshot non sostituisce l'ispezione delle immagini: vedere le singole catture o contact sheet leggibili, conservando gli originali.

## Editor UI: superfici proprie

Oltre alle 47 anteprime, visitare le cinque schede dell'ispettore **Elemento**, **Schermata**, **Font**, **Menù**, **Progetto**; il catalogo media e l'import font/immagini; selezione elemento su canvas e albero; proprietà asset/testo/geometria/ordine/visibilità; livello aggiunto/duplicato; undo/redo; bozza/applicazione/esportazione/importazione; griglia e aggancio; chiusura con modifiche non applicate. Il canvas è una superficie di authoring: l'input seleziona l'elemento, non esegue l'azione della campagna. Non applicare una bozza durante un audit in sola lettura.

## Admin: tutte le 13 sezioni

`src/admin/AdminPanel.tsx:22–35`; larghezza iniziale 720, intervallo 360–1200 (`:39`). Verificare anche pannello ridotto/espanso e trascinamento della larghezza.

| Codice | Scheda visibile | Contenuti da aprire |
|---|---|---|
| `session` | Regia | Stato sessione, controlli, prontezza e recupero |
| `project` | Progetto visivo | Progetto presentazione e applicazione configurazione |
| `colors` | Colori | Palette, HP, feedback anteprima |
| `ui` | UI | Scala stage/font/pulsanti, opacità, ombre, raggi |
| `layout` | Layout | Scene/elementi, selezione, sposta/ridimensiona, reset/undo |
| `assets` | Asset | Sfondi e texture, selezione media |
| `sprites` | Sprite | Scala/posizione creature e anteprima |
| `vfx` | VFX | Mossa, asset, scala/ancora/feedback, accesso galleria |
| `presets` | Preset | Applicazione dei preset visivi incorporati e ritorno allo stile predefinito; non è un editor CRUD del catalogo |
| `json` | Import/Export | Serializzazione, validazione e messaggi di esito |
| `audience` | Pubblico | Stato servizio/votazione, QR e accessi previsti |
| `interactions` | Interazioni | Mappa/nodo, azione configurata, disponibilità |
| `league` | Lega | Gestione progressione/finale e controlli consentiti |

I link allo Studio e ai sette laboratori sono nel pannello (`AdminPanel.tsx:70–77`). Il pannello **Progetto visivo** gestisce invece acquisizione bozza, import/export del pacchetto, applicazione, scarto e ripristino precedente (`presentation/PresentationProjectPanel.tsx`). Tutti i controlli che salvano devono essere verificati su fixture/copia locale controllata, conservando l'originale.

## Overlay, dialoghi e stati che lo Studio non esaurisce

| Famiglia | Stati da provocare nel runtime | Fonte verificata |
|---|---|---|
| Sessione | Preparazione, replica senza controllo, trasmissione pubblica, recupero configurazione, recupero backup interrotto | `session/SessionGate.tsx:9–29` |
| Strumenti | Apri/chiudi Partita, cambia giocatore strumenti senza cambiare turno della campagna, navigazione cronologica e ritorno al controllo d'origine | `settings/PlayerTools.tsx:13–53`, `player-ui/PlayerUi.tsx:109–180` |
| Dati | Nessun compagno, box vuoto/pieno, nessun risultato filtro, inventario vuoto, denaro insufficiente, azione non consentita, testo lungo | Componenti `player-ui/*Screen.tsx` |
| Squadra/deposito | Selezione, scelta destinazione, scambio, impossibilità di spostare ultimo compagno utilizzabile, annulla, errore/esito | `player-ui/TeamScreen.tsx`, `DepositScreen.tsx` |
| Mappa locale | Scorciatoie Game Master e Interazioni del punto, nodo corrente/raggiungibile/bloccato, negozio valido | `scenes/LocalMapScene.tsx:16–36,137–154` |
| Battaglia iniziale | Moneta a parità, tiro status, chi inizia, passaggio turno/attesa ospite | `scenes/BattagliaScene.tsx:1508–1536` |
| Battaglia azioni | Dialogo Suprema, borsa/bersaglio, scambio, cattura/fuga dove consentite, log/dettaglio, VFX con bersaglio A/B | `scenes/BattagliaScene.tsx`, `components/battle/BattlePresentation.tsx` |
| Battaglia esito | Dadi → HP → KO → sostituzione, avversario esaurito, vittoria/sconfitta, aggiornamento livello/evoluzione | `battle/battleVisualSequence.ts:150–178`, `scenes/BattagliaScene.tsx:735–798` |
| Pubblico/ospite | QR, attesa voto, servizio non disponibile/retry, chiusura anticipata, fallback autorizzato, attesa comando ospite | `components/battle/BattleAudienceOverlay.tsx`, `audience/*`, `regia/BroadcastView.tsx` |
| Regia | Pausa e ripresa, proiezione strumento, sincronizzazione della replica | `regia/RegiaPause.tsx:25`, `PublicPresentationBridge.tsx` |
| Salvataggi | Scrittura fallita, riprova/scarta, avviso recupero, import non valido | `save/SaveFailureNotice.tsx:27`, `SaveRecoveryNotice.tsx`, `BackupPanel.tsx` |
| Sfide | Campagna preservata, strumenti bloccati, preview squadre, sfida attiva, abbandono/risultato, codice invalido | `challenges/ChallengePanel.tsx`, `ChallengeBanner.tsx:26` |
| Navigazione | Tab/Shift+Tab, frecce, Home/End, Invio, Escape, ritorno del focus, apertura dialogo annidato | `components/ui/GameDialog.tsx:11–34`, `components/rpg/SpatialNavigation.tsx:12–35` |

La tabella è una coda esplicita di prove, non una dichiarazione di esecuzione. Schermate del servizio remoto di voto/ospiti, dispositivi reali e persistenza autenticata richiedono una sessione dedicata con origine/configurazione disponibili.

## Matrice minima per la verifica grafica e funzionale

1. **1920×1080:** 47 anteprime Studio, cinque ispettori, catalogo, Admin e laboratori con media pronti. Salvare filename che includa base e vista, annotare asset non risolti.
2. **1280×900 e 1366×768 runtime:** Partita/Squadra/Arkadex/Deposito/Analisi, battaglia e mappe. Misurare overflow, bounding box del dettaglio, posizione delle azioni primarie e scroll; il breakpoint desktop rende 1280×900 particolarmente utile.
3. **390×844 runtime:** apertura/chiusura finestre, raggiungibilità di ogni azione, tastiera virtuale nei campi, modali, interazioni mappa. La campagna 16:9 e le mappe viewport pieno seguono contratti distinti (`index.css:166–178`).
4. **Scala font/controlli:** almeno 1 e 1.25; non dedurre l'effetto dalla sola modifica del token.
5. **Movimento:** OS normale + preferenza interna ridotta; OS ridotto + override interno; normale/veloce. Osservare sequenza reale, non solo stato finale.
6. **Tastiera e mouse/touch:** selezione, conferma e annulla; focus sempre visibile; nessuna azione distruttiva provocata dal semplice movimento del focus.

Copertura di questa ripresa: inventario e percorsi verificati staticamente; **0 nuove schermate certificate in browser da questo sottoaudit** al momento della scrittura. Il coordinatore integra la propria copertura runtime e le immagini effettivamente osservate.
