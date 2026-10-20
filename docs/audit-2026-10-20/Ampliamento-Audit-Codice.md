# Arkamon — ampliamento della revisione di dominio e della copertura

> Archivio del 20 ottobre 2026: **Estensione dello snapshot di codice**. Origine nella cartella della sessione: `outputs/Ampliamento-Audit-Codice.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Aggiornamento sul commit `ea4dcab344cf4030757b4c9bb00f4890b4421be4`, checkout `C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta/checkout`. Questo allegato estende [Audit-Codice.md](./Audit-Codice.md) e mantiene distinti lettura del codice, inventario, esecuzione e osservazione browser.

**Nessuna modifica all'applicazione, nessun test o build eseguito da questo agente.** I nuovi percorsi di errore sono ricavati dal codice; il caso C17 è stato segnalato all'agente principale per una prova con lo store reale. L'ispezione dei test riguarda i loro assert, non un esito di esecuzione. L'analisi non duplica il filone di revisione estetica/UI.

## Copertura aggiornata

L'inventario completo resta di 488 file `src`, 438 TS/TSX e 60.894 righe fisiche. La lettura manuale passa da **42 file integrali e 18 parziali** a **69 integrali e 13 parziali**, con **406 file soltanto censiti**. Il numero dei file parziali diminuisce anche perché alcuni sono stati completati, fra cui lo store principale e il coordinatore di sessione.

I 69 file integrali comprendono **64 sorgenti applicativi e 5 file di test**. Non sono 69 schermate o 69 test eseguiti. Nei file applicativi rientrano anche tipi, modelli, hook e componenti di controllo; i cataloghi generati non vengono conteggiati come logica revisionata. La [copertura per singolo file](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/code-inventory.json`) contiene categoria, stato di lettura, righe e ambito delle letture parziali. Le quantità non devono essere sommate alla copertura prodotta dagli altri agenti senza prima unire i percorsi e togliere i duplicati.

| Categoria nel censimento `src` | Lettura integrale | Lettura parziale | Solo censimento |
|---|---:|---:|---:|
| Sorgenti applicativi TS/TSX | 64 | 8 | 205 |
| Test nominati `.test` / `.spec` | 5 | 5 | 145 |
| Supporti/fixture dei test | 0 | 0 | 7 |
| Cataloghi generati identificati | 0 | 0 | 2 |
| Cataloghi JSON applicativi | 0 | 0 | 16 |
| Fogli di stile | 0 | 0 | 28 |
| Asset e altri strumenti | 0 | 0 | 3 |

I JSON sono già tutti passati da una lettura strutturale automatica; la colonna «solo censimento» indica che non viene rivendicata una revisione umana completa del loro contenuto. Il grande catalogo VFX e il catalogo dello studio restano classificati come generati, non come moduli delle regole da rifattorizzare per il loro numero di righe.

### File completati o aggiunti in questa estensione

- **Store di campagna:** letti i blocchi rimasti di `gameStore.ts`, incluse cattura, aggiornamento creature/inventario, tutta la sequenza Lega, movimento legacy e ingresso nei luoghi. Ora è coperto integralmente.
- **Engine:** `localMapMovement.ts`, `movimento.ts` e `pokemonOwnership.ts`; con i moduli già letti coprono tutti i sorgenti applicativi `.ts` direttamente sotto `src/engine`.
- **Sessione:** `sessionCoordinator.ts` e `SessionGate.tsx`, oltre a `sessionOwnership.ts` già coperto. Letti acquisizione/rilascio Web Lock, fallback lease, baseline, revisioni e idratazione protetta.
- **Interazioni:** `runtime.ts`, `interactionStore.ts`, `tiledAdapter.ts`; `schema.ts` e `types.ts` erano già letti. I pannelli editor/esecuzione restano nel filone UI. Letti costi, requisiti, completamento, token avversari, premio differito e importazione Tiled.
- **Challenge:** `seededRandom.ts`; tutti i moduli di logica e tipo di `src/challenges` sono ora letti integralmente. Restano fuori dalla copertura integrale i due pannelli UI e i dati/fixture classici come contenuto umano.
- **Audience:** `useAudienceStore.ts`, `useAudienceTurn.ts`, `types.ts`; con API e controller già letti completano la logica del client. Il pannello Admin è stato letto soltanto per verificare che le operazioni concorrenti di C18 siano effettivamente avviabili, senza attribuirgli giudizi estetici. Il componente QR resta al filone UI.
- **Lega:** `leagueModel.ts` completo e relativi comandi nello store. Contenuti/opzioni restano quelli configurati: l'audit non introduce una regola o avversario di produzione.
- **Recupero e cronache:** `SaveFailureNotice.tsx`, `SaveRecoveryNotice.tsx`, `campaignApply.ts`, `battleArchiveStore.ts`, `battleChronicle.ts` e `trackGameChange.ts`. Letto anche `readinessModel.ts` per distinguere l'avviso generico «nessuna interazione» dalla diagnosi di un archivio corrotto. `arkadexModel.ts` è letto fino a riga 95, per confermare l'idempotenza della derivazione dei progressi.
- **Test letti negli assert:** `interactionStore.test.ts`, `campaignApply.test.ts`, `campaignCatalogFence.test.ts`, `useAudienceStore.test.ts`, `leagueRuntime.test.ts`. Gli altri test restano nelle categorie del censimento precedente.

## Nuovi rilievi

### C16 — P2: un catalogo locale non valido viene convertito in vuoto senza diagnosi di recupero

**Prova:** [interactionStore.ts:63](../../src/interactions/interactionStore.ts#L63), [readinessModel.ts:35](../../src/readiness/readinessModel.ts#L35).

Il merge persistito valida l'intero catalogo e usa `catalog?.interactions ?? []`. Se una singola voce ha una mappa/pallino non più valido o il catalogo ha una forma non riconosciuta, tutte le interazioni diventano un elenco vuoto in memoria. L'errore del validatore non viene esposto da questo store. La preparazione della sessione valida poi l'elenco già vuoto e mostra il normale avviso «Nessuna interazione attiva», compatibile anche con una campagna intenzionalmente non configurata: non distingue i due casi.

**Limite preciso:** la sola idratazione non dimostra la cancellazione del valore originale dal disco. Il rischio di sostituzione si presenta al successivo salvataggio/importazione del catalogo: una nuova voce viene composta con il vuoto in memoria, quindi può sostituire anche le voci valide del catalogo precedente. L'esportazione ordinaria esporta il vuoto in memoria, non i dati grezzi da recuperare. Le importazioni nuove sono validate e non generano questo problema con dati validi: il trigger è un archivio precedente danneggiato o divenuto incompatibile.

**Intervento:** conservare l'errore e il valore grezzo in uno stato di recupero separato, offrire esportazione del dato originale e impedire una sostituzione implicita prima che l'utente scelga come recuperare. Valutare un recupero per voce con avvisi e dipendenze coerenti; non eseguire mai le righe non valide. Riutilizzare il criterio del salvataggio campagna, che presenta avvisi e non confonde dati recuperati con una nuova installazione.

**Verifica consigliata:** contesto isolato con due voci valide e una voce con pallino assente, idratazione, osservazione dell'avviso, download del catalogo, salvataggio di una nuova voce e controllo del valore persistito. Il test dello store letto copre importazione non valida e quota piena, ma non contiene questo scenario di idratazione.

### C17 — P2: il recupero dell'importazione solo catalogo può annullare un successo quando la Lega è identica

**Prova:** [campaignApply.ts:70](../../src/readiness/campaignApply.ts#L70), [gameStore.ts:333](../../src/store/gameStore.ts#L333), [campaignApply.ts:107](../../src/readiness/campaignApply.ts#L107).

L'importazione salva nel journal il valore precedente della campagna, scrive il catalogo e applica la configurazione Lega tramite `aggiornaStato`. Se la Lega importata coincide con quella attuale e il resto della campagna è già canonico, lo store riconosce il checkpoint semanticamente identico e restituisce successo **senza una nuova scrittura**. L'importazione pubblica il catalogo e comunica successo. È un caso normale per un pacchetto che aggiorna soltanto le interazioni e lascia `league: null`.

Se il processo si interrompe prima della rimozione del journal, oppure la rimozione fallisce e viene ignorata, al prossimo avvio `checkpointUnchanged` resta vero. Il recupero non entra nel ramo di completamento e, poiché la Lega coincide anche con il valore precedente, ripristina il catalogo vecchio. La logica non può distinguere «non ho ancora completato l'importazione» da «ho completato un aggiornamento che non richiedeva modifiche alla campagna» usando solo quei byte.

**Stato della prova:** percorso ricavato dalla composizione dei due moduli reali; nessuna simulazione, crash o prova browser eseguiti da questo agente. La condizione è circoscritta a Lega invariata, checkpoint canonico e journal rimasto presente; non viene dichiarata perdita di roster o progressi delle giocatrici. Il comportamento normale senza interruzione rimuove il journal e conserva correttamente il catalogo importato.

**Lacuna del test rilevante:** [campaignApply.test.ts:21](../../src/readiness/campaignApply.test.ts#L21) sostituisce lo store; il mock può scrivere la campagna anche quando la configurazione è identica. `campaignCatalogFence.test.ts` usa il catalogo reale, ma simula ancora il comando della campagna con una scrittura incondizionata. Il caso «crash prima del commit con Lega identica» è presente: manca l'altra metà con successo dello store reale e nessuna scrittura necessaria.

**Intervento:** aggiungere una fase durevole di commit al journal, come già fa [restoreJournal.ts:64](../../src/save/restoreJournal.ts#L64), e definire il punto di commit per l'importazione composta. Verificare i confini prima/dopo ogni write, il checkpoint identico, il fallimento della pulizia e il recupero ripetuto. Non forzare una modifica fittizia ai progressi per rendere differente la campagna.

### C18 — P3: una risposta fallita del vecchio comando ospite può mostrare un errore nella nuova sessione

**Prova:** [useAudienceStore.ts:80](../../src/audience/useAudienceStore.ts#L80), confronto con `refreshSnapshot` a `:138-153`; [AdminAudiencePanel.tsx:16](../../src/audience/AdminAudiencePanel.tsx#L16), `:47-52`, `:74-75`.

`controlGuest` conserva la sessione iniziale e, al fallimento, scrive sempre `error` sullo store corrente. A differenza del polling e della connessione, non controlla revisione o identificativo corrente nel ramo di errore. È possibile avviare un rinnovo/revoca ospite e poi chiudere o rinnovare il collegamento generale mentre la prima richiesta è ancora pendente: i controlli del collegamento non leggono `guestBusy`. Se la richiesta vecchia fallisce dopo il successo del collegamento nuovo, il messaggio obsoleto appare nella nuova sessione.

**Limite:** il ramo di successo passa da `acceptSnapshot`, che controlla la sessione; non viene dimostrata sostituzione dei token, presa di controllo o applicazione di una mossa al turno sbagliato. Il difetto è una segnalazione d'errore non più pertinente, soprattutto sgradevole durante una conduzione live.

**Intervento:** applicare la stessa invalidazione per revisione/sessione già adottata da `refreshSnapshot`, anche alle eccezioni di `controlGuest`. Una richiesta vecchia deve terminare senza cambiare gli avvisi del collegamento attuale. Verificare separatamente successo, errore transitorio e sessione terminata dopo rinnovo generale.

## Conferme e debiti strutturali meglio circoscritti

**Interazioni e premi:** `resolveConfiguredInteraction` controlla definizione, turno, punto corrente, requisiti e disponibilità; restituisce una patch unica per risorse/turno/battaglia. Il premio di una sfida resta in `pendingBattle` ed è applicato alla conclusione soltanto se esito e identità di riferimento corrispondono. Il sistema non assegna automaticamente la ricompensa all'apertura. Questo conferma il buon confine transazionale già descritto.

**Regole duplicate:** il nuovo percorso delle interazioni ripete la selezione pesata degli incontri (pesi 60/30/10 e livello nel range) e la creazione avversari già presenti in `engine/encounters`, `pokemonFactory` e nello store NPC. I risultati correnti non sono dimostrati diversi; il debito è mantenere più implementazioni che possono divergere in futuro. Estrarre servizi puri riusabili lasciando al chiamante ID deterministici, prenotazione dell'interazione e persistenza. È un affinamento di C07/C08, non un nuovo bug di bilanciamento.

**Lega:** i comandi controllano configurazione, luogo, medaglie, turno, team cap, run e stage. La sconfitta passa il turno senza una cura implicita; l'intervallo conserva HP e usa solo oggetti posseduti e consentiti. La configurazione rimane bloccata dopo il primo tentativo. I test letti contengono assert su questi contratti, sui riferimenti obsoleti, sul doppio KO da Suprema, sulla presentazione dell'evoluzione finale e sul salvataggio rifiutato. Non equivale a una nuova esecuzione o verifica di ogni stato UI.

**Sessione:** la baseline del checkpoint è controllata al write; un read passivo non legittima una scrittura esterna. L'idratazione avviene sotto la proprietà prima dell'abilitazione dei comandi; il viewer non acquisisce il lock. Il rilascio annuncia la disponibilità dopo il ritorno del callback Web Lock. Non è stata trovata in questa estensione una prova di doppio writer ordinario. Il lease fallback resta una soluzione che richiede scenari reali di sospensione e recupero delle finestre: il solo timeout configurato non dimostra una race avvenuta.

**Challenge e RNG:** seed normalizzato, algoritmo e cursore sono espliciti; la ricostruzione non richiede rieseguire tutti i tiri precedenti. La versione della funzione hash/PRNG è dichiarata. La separazione tra campagna e challenge è reale; C09 riguarda la riproducibilità futura dopo modifiche a dati/motore, non un salvataggio sul ramo sbagliato trovato ora.

**Cronache:** il modello limita numero eventi, testi, dadi e specie; gli ID azione sono metadati e non consumano il generatore dei dadi. L'archivio conserva un numero limitato di battaglie e mantiene un risultato leggibile in memoria se fallisce la scrittura, segnalandolo. Non è un archivio illimitato che cresce per sempre. La verifica narrativa/completa dei replay nel browser resta esterna a questo allegato.

## Stato fisico dei media ricontrollato

In questa ripresa ho enumerato i file fisici presenti in `checkout/public`: **13.654 file, 8.690.270.963 byte**. È una misura corrente dei metadati del filesystem, che conferma il ripristino dell'insieme pubblico per numero e dimensione totale. Non sono stati ricalcolati tutti gli hash e non è stato aperto ogni media.

Questa misura è separata da `git ls-tree -l`: nel clone parziale alcuni blob continuano a non essere idratati nel database Git anche quando il corrispondente file fisico è già disponibile. L'inventario conserva `mediaTree` con dimensioni ignote segnalate e `mediaPhysical` con conteggi reali. Non conclude che una build o una pagina sia rotta soltanto perché Git non sa ancora fornire la dimensione di un blob locale.

## Lavoro ancora aperto

I motori puri e i moduli applicativi di `engine`, `save` e `session` sono ora letti integralmente, insieme alla logica di challenge, client audience e interazioni. I test di questi sistemi non sono tutti letti negli assert né eseguiti da questo agente. Restano il grande orchestratore UI di battaglia nelle porzioni già dichiarate, editor, pannelli e laboratori assegnati al filone UI/VFX, CSS, cataloghi come contenuto umano, pipeline non ancora letta e backend esterno. La completezza del filesystem o un test automatizzato positivo non trasforma automaticamente queste parti in codice revisionato o flussi osservati.
