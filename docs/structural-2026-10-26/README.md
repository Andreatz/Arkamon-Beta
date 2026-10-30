# Interventi strutturali — 26 ottobre 2026

Base del lavoro: `c150cf20`, dopo la pubblicazione dell'audit e delle 110 splash. Le illustrazioni approvate e i file autoriali delle mosse sono conservati. Questo rapporto distingue correzioni del software, prove locali ed eventuali verifiche su infrastruttura o dispositivi fisici.

## Esito per ciascun punto dell'audit

| Punto | Intervento concreto | Evidenza |
| --- | --- | --- |
| Caricamento iniziale | Proiezione runtime compatta delle mosse e dei nove effetti di stato necessari; caricamento del runtime Studio solo con un layout applicato; preparazione dei dadi su intenzione. Budget automatico dell'intero grafo statico. | Dati ricostruiti equivalenti, richieste compilate misurate e budget verificato. [loading.md](loading.md). |
| Store e responsabilità | Policy condivisa UI/comando; risoluzione pura dello scambio; preparazione e pulizia della battaglia; sei azioni della Lega con lettura e commit iniettati. | 883 test del dominio e 48 test di revisione indipendente riusciti; nessun nuovo storage. [domain.md](domain.md). |
| Cascata CSS | Un solo punto ordina layout, shell, vecchi concept, skin corrente, artwork, adattamenti e splash. Le destinazioni caricate in differita non importano più fogli che possano superare la skin attiva dopo la navigazione. | Build compilata con tutte le sei destinazioni; geometria e assenza di overflow verificate nei dialoghi reali. [styles.md](styles.md). |
| Vincoli dei comandi | Gli ingressi ordinari rispettano battaglia, sfida, Lega e proprietà della sessione; scambio e UI usano la stessa policy. Risultati espliciti distinguono applicazione, nessuna modifica e rifiuto. | 26 regressioni nuove: slot malformati, turno, cap, dati conservati e scritture fallite. Nessun checkpoint su rifiuto. |
| Pubblicazione | Un unico workflow verifica, compila una volta, testa il compilato, registra gli hash e distribuisce lo stesso artefatto. PR senza deploy; permessi Pages nel solo job finale. | Contratti con file e rapporti temporanei, tre prove compilate, actionlint. [release.md](release.md). |
| Desktop | Pacchetto selettivo, risorse multimediali esterne al codice Rust, destinazione separata e CSP esplicita. | Contratti Node/Rust, compilazione e prove del frontend desktop sotto la stessa CSP, compreso lo Studio e il blocco di script iniettati. [desktop.md](desktop.md). |
| Servizio ospite e regia separata | Prova con vero backend isolato e archivio temporaneo. Relay locale opzionale per una Browser Source che non condivide il profilo della console. | 62 test backend, una prova integrata ospite e prova con profili separati, ingresso tardivo e guasto reale del trasporto. [external-verification.md](external-verification.md). |

## Risultati quantitativi

Il file JavaScript principale della build web finale è circa **462,80 kB**, rispetto agli **864,48 kB** dell'audit precedente. La chiusura statica completa comprende **722.741 byte JavaScript** e **76.621 byte CSS**: il controllo non può essere aggirato spostando lo stesso codice in altri frammenti statici.

Nel confronto compilato a parità di server e con tre contesti isolati per versione, il JavaScript richiesto dal titolo dopo decompressione passa da 1.322.256 a 722.206 byte (**−45,4%**); le richieste passano da sette a quattro. Il trasferimento JavaScript osservato con gzip, incluse le intestazioni, passa da 260.090 a 208.753 byte (**−19,7%**). Nel caso con movimenti ridotti, le immagini richieste passano da 1.357.528 a 36.266 byte (**−97,3%**). Sono misure locali di byte e richieste: non certificano i Core Web Vitals o un tempo di avvio universale.

I limiti automatici sono **500.000 byte per l'entry**, **800.000 byte JavaScript iniziale complessivo**, **100.000 byte CSS iniziale**. Un superamento, una dipendenza mancante o dati runtime non aggiornati impediscono il rilascio.

Il vecchio build ordinario copiava circa **9.107 MiB di `public`**. Il pacchetto selettivo corrente occupa circa **802,7 MiB**, compreso il codice compilato. Le 455 animazioni native continuano a usare le pagine della revisione immutabile già verificata; filmati sorgente e atlanti completi non vengono incorporati nel programma. Non è una distribuzione interamente offline dei media pesanti.

## Verifiche generali

- **4.207/4.207 test unitari**, 175 file, quattro worker. Il primo giro aveva quattro errori nel medesimo mock UI incompleto della Lega; la fixture è stata completata e l'intera suite ripetuta con successo, senza allentare la policy del prodotto.
- **883/883 test del dominio**, più revisione indipendente **48/48**. Questi sono sottoinsiemi della verifica generale e non vengono sommati al totale.
- **13/13 contratti Node** di budget, artefatto, relay e separazione dei media desktop; **2/2 test Rust** del gestore delle risorse.
- **478 scenari browser riconciliati per identificativo: 376 riusciti e 102 esclusioni dichiarate**, nessun caso irrisolto. Sono esecuzioni conservate e riprove mirate, non un unico giro verde. [browser-verification.json](browser-verification.json) conserva selezioni, conteggi e hash dei rapporti originali.
- **3/3 scenari della build compilata**, comprendenti dodici viste gestionali, nuova partita/ricarica e collegamento pubblico in un profilo indipendente.
- **2/2 scenari del frontend desktop sotto CSP**, comprese le sei destinazioni, immagini effettivamente caricate, anteprima Studio e persistenza della personalizzazione dopo ricarica. Un tentativo inline e uno script remoto iniettato vengono bloccati.
- Backend reale isolato: **62/62 test** e **1/1 scenario ospite**. Nessuna credenziale o scrittura di produzione.
- **Compilazione Windows di produzione e installer NSIS riusciti**: eseguibile 13.163.008 byte, installer 724.513.101 byte (circa 691 MiB). Non sono stati installati o avviati nel profilo utente. [verification.json](verification.json) registra file, SHA-256 e confini delle prove. Le evidenze locali sono sotto `output/structural-2026-10-26/`.

Durante le verifiche è stato corretto anche il watcher di sviluppo: gli HTML generati da Tauri e le cartelle `dist*` provocavano ricariche del gioco durante una compilazione parallela. Il watcher ora ignora quei risultati. Una prova con quattro HTML temporanei nelle directory escluse ha verificato l'assenza di navigazioni e la conservazione di un marcatore in memoria; gli errori dei tentativi interrotti restano rendicontati, senza attribuirli a immagini mancanti.

## Dati e asset appena importati

L'aggiornamento remoto precedente includeva cinque nuove immagini di percorso senza una definizione revisionata di pallini e collegamenti. Sono ora censite esplicitamente in `localMaps/artworkInventory.ts` come sorgenti in attesa di geometria. Il test continua a rendicontare tutti i PNG, mantenendo distinti i sedici grafi verificati dalle cinque immagini: non si inventano strade e non si modifica il progresso dei salvataggi. Questa è una ricognizione degli asset nuovi, non un cambiamento delle regole dei percorsi.

## Confini delle verifiche

Lo store resta il punto di composizione e commit durevole, mentre le responsabilità estratte hanno policy e input espliciti. Non è stato introdotto un secondo motore di battaglia, né riscritta l'intera scena degli effetti. I vecchi stili restano disponibili come anteprime e hanno una precedenza dichiarata; non sono stati eliminati per abbassare artificialmente la complessità.

Telefono fisico, GPU/audio/CEF di OBS, rete reale e sospensioni lunghe richiedono una prova su quell'ambiente. Sono disponibili procedure e collegamenti ripetibili; i risultati con Chromium e backend isolato non vengono spacciati per certificazione hardware. Il workflow del backend privato richiede un token GitHub di sola lettura: non è stato creato un token personale o copiato un segreto nel progetto pubblico.

La nuova procedura di pubblicazione è verificata localmente nei contratti e nella build. La sua prima esecuzione su GitHub avverrà quando queste modifiche verranno pubblicate: non viene attribuita a una vecchia revisione una build ottenuta da sorgenti ancora in esame.
