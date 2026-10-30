# Precedenza degli stili delle schermate gestionali

La precedente struttura distribuiva gli import dei fogli fra `kit`, `PlayerUi`, Squadra, Borsa e Negozio. Le destinazioni caricate in differita potevano aggiungere le proprie regole dopo quelle della skin attiva. Anche in assenza di un errore visibile in ogni percorso, l'ordine dipendeva dalla navigazione ed era difficile da mantenere.

`src/player-ui/playerUiStyles.ts` possiede ora il caricamento e l'ordine completi:

1. Primitivi condivisi, disponibili anche per schede e ritratti fuori dal dialogo.
2. Layout specifici di Squadra, Borsa e Negozio.
3. Shell, geometria fullscreen e pannelli ausiliari.
4. Concept storici, limitati ai loro selettori.
5. Skin corrente dei riferimenti.
6. Artwork, composizioni PNG e adattamenti finali delle splash.

I primitivi sono raccolti in `playerUiPrimitives.ts`. Le destinazioni non importano più i propri override CSS al montaggio. I componenti, le immagini, le proporzioni, i nomi delle classi e le regole autoriali restano gli stessi; il caricamento del modulo PlayerUi completa la cascata prima di mostrare le destinazioni.

La verifica della build compilata percorre tutte le sei schermate a 1366×768 e 1920×1080 e controlla il dialogo reale. Lo Studio è verificato anche sotto la CSP desktop: cambiare una decorazione mantiene testo, comandi e personalizzazioni dopo ricarica. Le prove dense, le schermate ausiliarie e i vecchi concept sono inclusi nel giro browser generale riportato in `verification.json`.

Per aggiungere una nuova destinazione, collocare qui il foglio nel livello appropriato. Evitare import di nuove skin o override globali dal componente di una singola schermata: la navigazione non deve diventare un meccanismo di selezione della precedenza.
