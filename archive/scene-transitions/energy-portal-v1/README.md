# Portale di energia — versione ibernata

Questo archivio conserva la precedente transizione di Arkamon: portale blu e dorato per la navigazione, variante violetta per l'evoluzione e portale di riserva dietro il video della battaglia. È stato conservato su richiesta dell'utente il 3 ottobre 2026, quando è stata scelta una nuova direzione visiva.

Stato: **ibernato, fuori dall'applicazione attiva**.

- Branch di origine: `feature/vfx-recipe-engine`.
- Commit originale: `330fa451e1eba67f9758f9cadc509049408025f0`.
- `src/components/transitions/` contiene copie esatte degli otto file della precedente implementazione, compresi i due file di test. Soltanto il nome delle due copie dei test termina con `.test.ts.snapshot`: il contenuto originale rimane identico, ma Vitest non le esegue.
- `docs/scene-transitions.md` conserva la guida originale.
- `manifest.json` elenca i nove file originali, le dimensioni in byte e le impronte SHA-256. `originalPath` indica il percorso originale da ripristinare, `storedPath` indica il percorso conservato nell'archivio; `path` mantiene lo stesso valore di `originalPath`. README e manifest sono aggiunti all'archivio e non sono parte della vecchia implementazione.

Il percorso dell'archivio è esterno alla cartella `src` della repository. I file non devono essere importati o esportati dall'applicazione, né la loro CSS caricata tramite `@import`. Il portale non deve rimanere come riserva nascosta della nuova animazione: la riserva del video di battaglia segue la nuova direzione attiva. Il video `public/assets/Transizione Battaglia.mp4` rimane un asset condiviso della repository e non viene duplicato qui.

## Ripristino, soltanto dopo una scelta dell'utente

Questo archivio non esegue ripristini automatici. Per riattivare il portale, attendere una richiesta esplicita dell'utente e preparare una modifica verificabile:

1. Salvare la versione alternativa attiva in un commit o in un archivio separato, così la scelta rimane reversibile. Non cancellarla soltanto perché si apre questo archivio.
2. Verificare le dimensioni e gli SHA-256 dei nove file identificati da `storedPath` rispetto a `manifest.json`. Un archivio incompleto o con impronte diverse va controllato prima della copia.
3. Confrontare le copie archiviate con i file attivi e con gli attuali punti d'integrazione. In particolare, `App.tsx`, `AudioController.tsx` e le scene usano il coordinamento delle transizioni: eventuali modifiche successive richiedono un adattamento, non un ripristino indiscriminato della repository.
4. Ripristinare soltanto i percorsi necessari elencati nel manifest nelle rispettive posizioni alla radice della repository, copiando da `storedPath` a `originalPath`. Per le due copie dei test questa mappatura rimuove il suffisso `.snapshot` e restituisce il nome originale `.test.ts`. La CSS archiviata e il profilo con modalità `portal` devono essere riattivati insieme al relativo overlay. Riattivare il portale come riserva del video soltanto se incluso nella scelta dell'utente.
5. Valutare i file aggiunti dalla nuova alternativa. Rimuoverli o spostarli in un altro archivio soltanto quando questa sostituzione è autorizzata dall'utente; non eliminare automaticamente l'intera cartella attiva.
6. Eseguire `npm test` e `npm run build`, quindi verificare nel browser navigazione, battaglia, evoluzione, movimento ridotto e ripristino dei comandi. Creare il commit soltanto dopo test e build verdi.

Il commit originale permette anche di consultare la precedente implementazione con `git show 330fa451e1eba67f9758f9cadc509049408025f0:<percorso>`. Non usare un reset della branch per recuperare una singola animazione: annullerebbe anche il lavoro successivo.
