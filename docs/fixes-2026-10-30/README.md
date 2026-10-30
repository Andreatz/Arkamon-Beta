# Correzioni dell’audit Arkamon — 30 ottobre 2026

## Perimetro

Implementazione dei nove difetti e della lacuna CI descritti in [audit del 29–30 ottobre](../audit-2026-10-29/README.md). Il lavoro parte dal checkout locale con HEAD `bb142c1b` e conserva le modifiche strutturali già presenti. Non cambia regole del format, illustrazioni o fotogrammi delle animazioni. Nessun commit, push o deploy è incluso in questa richiesta.

**Stato: tutte le correzioni concluse e verificate in locale**, compreso il difetto aggiuntivo del laboratorio emerso durante il collaudo. Il [riepilogo verificabile](verification.json) registra risultati, impronte e limiti delle prove. Le prove del vecchio audit restano storiche e non sono contate come verifiche di questa implementazione.

## Interventi

| Rilievo | Correzione | Regressione |
|---|---|---|
| GAME-29-01, P1 | Nuovo comando `concludiBattaglia` legge il checkpoint finale già durevole, valida insieme tutte le identità e l’intera squadra, applica HP/livelli/status, premi, interazioni, cleanup e destinazione con una sola scrittura. Fallimenti mantengono il risultato e consentono il retry. | 20 test del comando; Prosegui reale in entrambi gli ordini del roster, reload e quota/retry su desktop/mobile. Catture già salvate, riserve storiche, cap e Lega conservati. |
| SAVE-29-01 | Esportazione compatta, limite in byte coerente con l’importazione e validazione prima del download. Un file intrinsecamente troppo grande produce un messaggio e non elimina replay. Anche il ripristino rifiuta sostituzioni quando non può conservare la copia completa precedente. | Fixture valida 20 replay / 4.800 eventi: roundtrip completo. Errori espliciti oltre soglia e ingressi di download protetti. |
| VISUAL-29-01 | Recupero controlla tutte le chiavi before/after prima di scrivere; conserva una terza versione e il journal. Guardie impediscono scritture ordinarie di Admin/VFX durante recupero pendente. La transazione corrente ha una lease sincrona dedicata. | Entrambi i rami del journal, conflitti, rollback fallito, quota durante archiviazione e ripresa esplicita. |
| VISUAL-29-02 | Ogni parte dello storico viene normalizzata separatamente. I progetti validi restano disponibili; l’originale corrotto viene conservato nello stesso envelope. Il pannello permette di scaricarlo e liberarlo esplicitamente. | Bozza corrotta con applied/previous validi, successivi stage/discard/apply e conservazione dell’originale. |
| STUDIO-29-01 | Revisioni delle operazioni e identità della bozza impediscono pubblicazioni asincrone obsolete. Scarta, Esci, unmount, modifica successiva e nuova importazione prevalgono sulla lettura precedente. Anche il pannello separato Progetto visivo invalida import/acquisizioni/esportazioni dopo la chiusura. | Tre scenari reali: Scarta + nuovo import; Esci; modifica font durante lettura. Ulteriore scenario del progetto visivo chiuso durante importazione, seguito da riapertura e import valido. |
| OBS-29-01 | Trasporto binario separato dei soli tre slot pubblici selezionati: due cornici HP e sfondo. Immagini identificate da SHA-256; viewer legge con capability in header, valida MIME/contenuto/hash e usa Blob URL revocabili. | Due contesti senza IndexedDB condiviso; primo GET 503 e recupero, sostituzione asset, rilascio vecchio Blob, relay riavviato e viewer ricaricato. |
| OBS-29-02 | La console trasmette velocità e riduzione movimento effettive; un contesto di presentazione le applica ai renderer del viewer senza cambiarne le preferenze persistenti. Timer di fallback usano la stessa velocità. | Console fast e viewer normal mostrano entrambi 48 FPS; cambiando console a normal entrambi passano a 24 FPS, preferenze viewer intatte. |
| RELEASE-29-01 | Configurazione e packer rifiutano una revisione media diversa dal pin verificato. Il manifest compilato espone anche l’hash del manifest nativo. | Fixture completa delle cinque azioni: override incoerente rifiutato; revisione corretta accettata. |
| UI-29-01 | Il focus trap rispetta tabIndex, disabilitazione, inert e visibilità; le griglie mantengono il solo elemento scelto nella sequenza Tab. | Tab lascia la griglia, Shift+Tab torna alla selezione; focus resta dentro il dialogo su desktop/mobile. |
| CI-29-01 | Workflow obbliga i sei scenari nativi sullo stesso compilato prima della sigillatura. Ricevuta v2 richiede sei identità, zero salti/retry, pin/manifest completi e impronta dell’intero artefatto. | Contratti respingono prove di altre build, ricevute obsolete e report nativi mancanti/incompleti. |

## Confini del trasferimento pubblico

Il limite della fotografia pubblica resta **2 MiB**. Le immagini hanno un canale separato con massimo **12 MiB per file**, **tre slot attivi** e buffer massimo di sei file / 72 MiB per sostituirli. I file in staging non sono leggibili dal viewer; la nuova fotografia elimina quelli non più selezionati. Il trasferimento non copia libreria Studio, font, inventari, riserve o credenziali della campagna. Le capability non vengono inserite negli URL delle immagini o nel browser storage del viewer.

La vista dedicata al relay ignora fotografie BroadcastChannel di altre console locali. I caricamenti falliti vengono riprovati con attesa progressiva; chiusura/cambio sessione annullano richieste e rilasciano gli URL posseduti. La pubblicazione ritira i RAF pendenti anche quando un heartbeat o hello arriva prima del frame, evitando callback dopo la chiusura.

La [prova visiva del viewer indipendente](evidence/public-images-and-motion.png) usa esclusivamente immagini sintetiche riconoscibili (cornice blu e sfondo con testo), importate in un profilo QA temporaneo. Non rappresenta una modifica alla grafica di gioco. Dimostra sfondo e cornici presenti anche dopo sostituzione, riavvio del relay e ricarica del viewer.

## Recupero visivo utilizzabile

Un avviso in Admin e Studio permette di scaricare journal e valori correnti. L’azione esplicita «Conserva originali e mantieni impostazioni attuali» archivia gli originali prima di rilasciare il journal e riapre il gioco. Se manca spazio, il journal resta conservato. Queste operazioni riguardano le impostazioni grafiche; non modificano la campagna.

## LAB-30-01 — Ulteriore difetto trovato dal collaudo

Il giro generale ha rilevato un blocco del laboratorio mobile quando sia la pagina nativa del bersaglio sia il PNG di riserva restituiscono 404. Il renderer passava dal poster di caricamento all’immagine procedurale riutilizzando lo stesso nodo IMG già fallito; l’errore precedente non veniva notificato al nuovo gestore e la prova rimaneva in preparazione.

Le due immagini hanno ora chiavi React distinte, quindi il fallback viene montato con i propri gestori di caricamento/errore. La regressione esistente attende esplicitamente che il primo PNG sia già fallito prima di avviare la prova: il caso non dipende più dalla velocità casuale delle risposte. Il controllo mantiene l’attesa originale e verifica anche la successiva prova con un bersaglio valido.

## Verifiche

Le prove e i log attuali sono in `output/fixes-2026-10-30/`.

- TypeScript: superato senza diagnostiche.
- Suite unitaria completa sulla versione finale: **5.185/5.185 in 178 file**, codice 0, 124,92 secondi.
- Contratti Node rilascio/relay/immagini/budget/desktop: **21/21**.
- Browser mirato: primo giro 60 passaggi, un’esclusione prevista e sei nuovi test fermati dall’attesa di un attributo non presente nella schermata Percorso. Tutte le loro verifiche di dati e retry erano già passate. Corretto il selettore del test sul titolo visibile e aggiunta la verifica della destinazione nel salvataggio, senza modificare il prodotto per il selettore; i sei casi e la prova regia con verifica aggiuntiva del rilascio Blob sono poi passati tutti. Storico e trace conservati.
- Build finale web: codice 0, **550 clip / 52.775 frame**, pacchetto locale **803,4 MiB**. Il budget di avvio è rispettato: entry 469.064 byte, JavaScript iniziale 729.013 byte, CSS iniziale 76.721 byte.
- Compilato finale: **3/3** scenari generali e **6/6** nativi, zero esclusioni o retry. Le sei prove sono state ricontrollate con il nuovo verificatore contro l’impronta SHA-256 dell’intero pacchetto (1.630 file), senza creare una ricevuta di pubblicazione per il checkout ancora non committato.
- Ultimo ricontrollo unitario mirato dopo revisione finale: **60/60**, quattro file; TypeScript ricontrollato nella build finale.
- Sicurezza degli strumenti: **9/9**, codice 0.
- Browser completo: **538 identità = 427 passaggi e 111 esclusioni intenzionali**, zero irrisolti/non eseguiti. Comprende 18 regressioni nuove rispetto ai 520 scenari dell’audit. I risultati riconciliano quattro esecuzioni conservate: non sono presentati come un’unica invocazione tutta verde. Dopo il difetto del laboratorio sono passati tutti gli otto ricontrolli mirati, senza salti o retry, con il caso di errore reso deterministico e cinque percorsi nativi positivi aggiuntivi.
- Splash: **110 forme × Squadra/Arkadex × desktop/mobile = 440 misurazioni**, zero problemi nelle aree critiche del catalogo e zero errori JavaScript.

Il contratto delle sei prove native usa il bundle invariato e i soli media locali della revisione esatta, verificandone le impronte. Certifica il comportamento del compilato e la coerenza del pacchetto; **non certifica la disponibilità online del CDN**, una installazione Tauri fisica o una sessione OBS/CEF su hardware fisico.

La [riconciliazione browser](evidence/browser-summary.json) mantiene per ciascun caso identità, risultato, report di origine e storia degli errori. Comprende il giro generale, le correzioni di preparazione dei nuovi test e il ricontrollo del ramo fallback dopo la correzione; i passaggi non interessati sono conservati. Il [manifest delle sorgenti](evidence/source-fingerprints.json) annota le tre modifiche approvate durante questa fase e verifica l’assenza di ulteriori cambiamenti nella versione finale. Non è stata creata una nuova ricevuta di pubblicazione riferita a un commit che non contiene ancora queste modifiche.
