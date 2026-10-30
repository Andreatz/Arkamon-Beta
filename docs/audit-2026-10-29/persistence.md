# Audit persistenza — 29 ottobre 2026

Analisi in sola lettura del checkout attivo. Sono stati creati soltanto harness e risultati sotto `output/audit-2026-10-29/persistence`; nessun sorgente, test di prodotto, Git o dato del browser è stato modificato. Tutte le prove usano `Map` e fixture inventate. I sette difetti PERSIST-01–07 di `docs/audit-2026-10-26/persistence.md` non sono ripresentati come ancora aperti.

## P29-PERSIST-01 — P2 — Il recupero del progetto visivo sovrascrive un salvataggio successivo

- Riferimento: `src/presentation/presentationTransaction.ts:41–45` e rollback a `:28–32`.
- Trigger: un'applicazione visiva lascia il journal dopo interruzione o rollback fallito; successivamente un'altra finestra, o lo Studio ancora aperto dopo l'errore, salva un nuovo tema. Gli ingressi di salvataggio ordinario dello Studio non bloccano questa situazione.
- Comportamento: il recupero considera soltanto il valore dell'ultimo marker. Riscrive tutti i valori `after`, oppure ripristina tutti i `before`, senza verificare che tema e VFX correnti corrispondano ancora a uno di quei due valori.
- Impatto: il tema più recente viene cancellato; anche il journal viene rimosso e il recupero dichiara `{ ok: true, error: null }`. La campagna non è coinvolta.
- Riproduzione: `node output/audit-2026-10-29/persistence/reproduce-visual-journal.mjs`. Entrambi i casi verificati (marker completo e incompleto) perdono il terzo valore più recente. Prova: `visual-journal-evidence.json`.
- Correzione da valutare: controllare tutti i valori correnti prima del replay/rollback, conservare terzo valore e journal con errore esplicito; impedire normali salvataggi visivi finché un journal richiede recupero. È la stessa protezione già introdotta per catalogo/campagna, assente nel protocollo visivo.

## P29-PERSIST-02 — P2 — Una singola bozza corrotta cancella lo storico visivo valido al salvataggio successivo

- Riferimento: `src/presentation/presentationProject.ts:28–35`; cancellazione definitiva tramite `stage` a `:77–79` o `discard` a `:81–83`.
- Trigger: l'envelope dello storico contiene `applied` e `previous` validi e soltanto `draft` non valido, per esempio una versione non supportata.
- Comportamento: le tre normalizzazioni sono nello stesso `try`; l'eccezione della bozza fa tornare `empty()` per tutto lo storico. Lo store mostra `applied: null`, `previous: null`, `error: null`, anche se i due progetti validi sono ancora nei byte originali. Alla successiva acquisizione di una nuova bozza, `stage` persiste questi null e restituisce successo.
- Impatto: scompaiono il progetto applicato e il punto di ripristino, inclusa la relativa configurazione audio esportabile; nessun avviso o download dell'originale accompagna la perdita. Le chiavi del tema/VFX possono ancora contenere parti della grafica corrente, ma non ricostruiscono lo storico completo.
- Riproduzione: `node output/audit-2026-10-29/persistence/build-fixture.mjs`, poi `node output/audit-2026-10-29/persistence/reproduce-project-history.mjs`. Il bundle importa i moduli reali, senza sostituirne i validatori; soltanto `localStorage` è una fixture. Prova: `project-history-evidence.json`.
- Correzione da valutare: recuperare separatamente le voci valide, mantenere l'originale sospeso con errore e non sovrascriverlo come uno storico vuoto valido.

## P29-PERSIST-03 — P2 — L'esportazione genera backup che la stessa applicazione rifiuta

- Riferimento: `src/save/gameBackup.ts:66–70`, limite e rifiuto a `:9` e `:74–75`. Il pannello backup e il dialogo di errore salvataggio chiamano questo serializzatore e dichiarano riuscito il download.
- Trigger riprodotto: archivio di 20 replay ammessi, ciascuno con 240 eventi ammessi; ogni evento contiene un commento di 475 caratteri (entro gli 800 ammessi), 12 dadi e normali dati di attore/bersaglio. Sono fixture valide del formato di replay importabile; non si afferma che siano già presenti nei salvataggi dell'utente.
- Comportamento: il serializzatore esporta JSON indentato senza confrontare la dimensione con il limite d'importazione di 5 MiB. Il risultato della fixture è **8.013.253 byte** e `validateGameBackup(exported)` restituisce l'errore di dimensione. Gli stessi identici dati, senza cambiare alcun evento ma serializzati compatti, sono **4.519.366 byte**, vengono accettati e conservano tutti e 20 i replay / 4.800 eventi.
- Impatto: il file consigliato come copia di sicurezza non può essere ripristinato dal normale pannello. Anche l'esportazione offerta dopo un errore di spazio può quindi dare falsa sicurezza.
- Riproduzione: dopo il bundle precedente, `node output/audit-2026-10-29/persistence/reproduce-backup-roundtrip.mjs`. Prova: `backup-roundtrip-evidence.json`. Non è stato creato o importato alcun file nel browser reale.
- Correzione da valutare: garantire il round trip del serializzatore, almeno scegliendo JSON compatto quando l'indentazione supera il limite e verificando la dimensione prima di dichiarare riuscita l'esportazione; per dati effettivamente oltre limite serve una policy esplicita (pacchetto separato o limite coerente), senza tagliare cronache in silenzio.

## Copertura e limiti

Letti i moduli applicativi di `src/save` (persistenza/normalizzazione, backup, journal, copie automatiche e pannelli), `src/session` (coordinatore, adattatore browser e gate), il protocollo della configurazione in `src/readiness/campaignApply.ts`, `src/presentation`, `src/store/adminStore.ts`, `src/store/vfxAdminStore.ts`, `src/ui-studio/mediaStorage.ts`, `studioStore.ts`, ingressi di importazione, `src/settings/gamePreferences.ts` e pannello. Nel `gameStore` sono state lette le sezioni di commit durevole, transazioni, serializzazione, idratazione, controllo proprietario e pubblicazione di replica. Letti anche i contratti di normalizzazione di archivio/replay e registro partita e i relativi assert di persistenza.

Le letture riconfermano le protezioni esistenti per le scritture della campagna, il journal dei backup e il catalogo sospeso; questa attività non costituisce una nuova esecuzione delle loro suite. Non sono stati eseguiti browser, build o suite pesanti da questo filone. I tre nuovi rilievi sono stati riprodotti con codice reale e fixture isolate; non è stata misurata la loro frequenza nei dati dell'utente. Sono ancora da correggere e non è stata eseguita alcuna pubblicazione.
