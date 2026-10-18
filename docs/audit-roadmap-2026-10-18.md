# Roadmap di consolidamento Arkamon

Stato iniziale: audit del 18 ottobre 2026, commit `877c2844`.
Ramo di lavoro: `feat/audit-roadmap-2026-10-18`.

## Obiettivo e vincoli

Rendere affidabile e semplice la conduzione della gara Melia/Maggi in live. Livio resta GM; storia e interpretazione rimangono esterne. Gli ospiti privati controllano gli avversari designati, il pubblico vota soltanto le mosse degli allenatori NPC normali. La Lega mantiene quattro battaglie consecutive nello stesso turno.

Conservare font e grafica concordati, front ufficiali nelle viste statiche, HP residui, inventari e progressi separati, cap di 5 livelli ed esperienza non accumulabile. Non rigenerare filmati o sprite sheet. Release dei media e nuovo formato degli atlanti restano fuori da questa consegna, come già richiesto.

## Ordine di lavoro

| Fase | Intervento | Risultato verificabile |
| --- | --- | --- |
| 1A | Proprietà esclusiva della sessione, revisione e conflitti fra finestre | Una finestra obsoleta non può sovrascrivere la campagna; chiusura e ricaricamento consentono recupero del controllo |
| 1B | Unica lettura del roster durante la battaglia | Squadra, Deposito, Analisi e Borsa mostrano gli HP/status correnti senza abilitare cure fuori dal flusso di battaglia |
| 1C | Preparazione della live e pacchetto di configurazione | Un pannello segnala mappe/interazioni/negozi/Lega/connessioni incompleti; import/export configurazione separato dai progressi, con validazione e anteprima |
| 2A | Slot grafici dichiarati per i componenti | Sostituire una barra HP o cornice non sovrappone il vecchio asset e non nasconde testi o funzioni; Originale e import/export reversibili |
| 2B | Risolutore comune delle coordinate | Studio, sprite, VFX e numeri del danno rispettano lo stesso layout; le modalità interne ereditano correttamente |
| 2C | Ancora VFX a schermo intero | Centratura corretta a 16:9 e in finestre basse, senza interferire con le trasformazioni dell'animazione |
| 3A | Regia e vista In onda | Schermo pubblico pulito, nessun comando di modifica o editor, stato corrente sincronizzato dalla console del GM |
| 3B | Stato del controllo e pausa di regia | Giocatrice, fase, ospite/pubblico, attesa, esito e pausa sono riconoscibili; la pausa non cambia dadi o risultati |
| 3C | Attività e navigazione coerenti | Interazioni dei giocatori legate ai punti; scorciatoie del GM esplicitamente separate; un'unica area Registro conserva i tre archivi |
| 3D | Gerarchia della battaglia | Pannello dadi solo quando serve, azione successiva leggibile, font e asset esistenti conservati, geometria verificata a 1080p |
| 4A | Ridisegno e manifest | Nessun disegno ripetuto di pose ferme; strumenti diagnostici separati; riduzione dei dati inutili all'avvio senza cambiare sorgenti native |
| 4B | Separazione regole/store | Creazione delle istanze nel dominio con dipendenze esplicite; gli engine non importano lo store; migrazione graduale, nessuna riscrittura totale |
| 4C | QA e documentazione autorevole | Test mirati ai difetti, regressione completa, browser reale; regole attuali separate dai documenti storici e checklist per il collaudo in live |

## Funzioni complementari proposte nell'audit

- Riepilogo della gara: posizioni, medaglie e avanzamento della Lega, usando solo dati reali e senza rivelare elementi nascosti.
- Riepilogo di ripresa: ultimi eventi registrati e situazione corrente, senza generare storia.
- Connessioni: stato di ospite e votazione, comando ricevuto, riconnessione e presa in carico del GM; preservare i controlli contro comandi doppi e turni obsoleti.
- Regia privata: preparazione, pausa e collegamento della vista pubblica riuniti in un punto; niente controlli narrativi.

## Metodo di consegna

Prima correggere i difetti riprodotti, poi integrare i nuovi flussi riusando i componenti attuali. Coprire gli invarianti con test del dominio, le modifiche agli asset e al layout con test sui componenti reali, e salvataggio/ricaricamento/finestre concorrenti con prove browser. I test di stati animati devono attendere segnali di stato e preparazione media, senza dipendere da ritardi arbitrari.

La build e il browser locale sono verifiche distinte dal deploy pubblico e dal binario desktop. Il collaudo del servizio dei controller sarà eseguito soltanto su un'istanza locale isolata se disponibile. Prove prolungate su hardware di trasmissione, ascolto artistico integrale dei suoni e approvazione della configurazione narrativa restano controlli umani espliciti: non vengono dichiarati superati da test automatici.

## Registro di esecuzione

L'implementazione e il collaudo locale della roadmap sono completati sul ramo indicato in apertura. Il [rapporto QA conclusivo](./audit-qa-2026-10-18.md) distingue i 3.274 test unitari, i 132 casi browser desktop unici dopo le ripetizioni, i nove casi su telefono emulato e la prova manuale della build compilata. Nessun fallimento rimane irrisolto nelle esecuzioni conteggiate. Questo risultato non certifica il sito pubblico, OBS o un nuovo installer Windows.

| Fase | Implementazione presente | Stato della verifica |
| --- | --- | --- |
| 1A | `src/session/` gestisce proprietà esclusiva, revisioni del checkpoint, rilettura prima del passaggio di controllo e finestre passive. Campagna, archivio battaglie, sfide, catalogo e ripristino backup passano dai controlli di scrittura. | Superati test del coordinatore e prove fra finestre, incluso «salvataggio fallito → scrittura esterna → rilettura»: il vecchio comando non rimane eseguibile. |
| 1B | `src/player-ui/currentRoster.ts` dà precedenza all'istanza viva dello stesso Arkamon. Squadra, Deposito, Analisi, Arkadex e Borsa usano gli HP e gli status correnti. | Verifiche del selettore e dei percorsi di consultazione/cura durante la battaglia; i permessi degli oggetti restano quelli del gioco. |
| 1C | `src/readiness/` aggiunge preparazione della sessione, copertura dei pallini, accessi ai negozi, configurazione Lega e freschezza della connessione. Il pacchetto portabile comprende solo catalogo e Lega, con anteprima, validazione e journal di recupero. | Superati applicazione, rifiuto, rollback e recupero dell'importazione, inclusa la rimozione del tentativo parziale dopo il rollback. Il controllo delle immagini riguarda solo squadre e mappe correnti, non una certificazione di tutti i media. |
| 2A | `src/ui-studio/skinSlots.ts` dichiara la cornice sostituibile e le sue decorazioni dipendenti: la nuova grafica della barra HP conserva nome, livello, stato e riempimento. | Prove con componenti reali e browser: scelta dell'asset, Originale, applicazione e ricarica. |
| 2B | `src/ui-studio/battleLayout.tsx` risolve insieme geometria dello Studio, sprite, VFX e danni; le viste dadi e Borsa ereditano dalla battaglia. | Test del risolutore e confronto anteprima/runtime nel browser. |
| 2C | `MoveVfxLayer` separa il contenitore a schermo intero dalla trasformazione dell'effetto. | Prove di centratura e ridimensionamento sui componenti e in battaglia. |
| 3A | `src/regia/` separa console e presentazione pubblica. `?view=broadcast` riceve una selezione esplicita di dati visibili, senza montare il motore né acquisire il controllo. | Superate verifiche dei dati esclusi e della vista passiva. Mappa pubblica confrontata geometricamente con quella reale, pallini circolari e G1/G2 separati a 1080p e in una finestra bassa. Trasporto limitato allo stesso browser/profilo; OBS Browser Source indipendente e dispositivi remoti non sono inclusi. |
| 3B | Stato del comando avversario, attesa e prossima azione sono esposti nella battaglia. Pausa volatile fra azioni concluse, con blocchi distinti per battaglia e transizioni. | Test dei blocchi di pausa e dei flussi con controller. Protocollo reale collaudato soltanto sull'istanza locale isolata descritta nel rapporto controller. |
| 3C | Le attività globali delle mappe locali passano alle scorciatoie private del GM. `RegisterScreen`, `RaceScreen` e il riepilogo di ripresa riusano archivi e progressi esistenti. Le sei utilità del menù sono Registro, Backup, Impostazioni, Gara, Ripresa e Sfide. | Superati navigazione, salvataggi invariati, compatibilità degli ingressi precedenti e collaudo dei nuovi archivi e delle viste dense. Rimossa la regione accessibile duplicata nelle Cronache. |
| 3D | Messaggio della battaglia solo se presente, azione successiva più leggibile e indicazione di controllo. Font Norwester e pulsanti delle mosse originali conservati; rimosso il doppio selettore G1/G2 negli strumenti integrati Arkadex/Borsa. | Regressione a 1920×1080 e finestre basse; il rapporto finale deve distinguere casi desktop e casi telefono. |
| 4A | `PagedAnimatedSprite` evita il ridisegno della stessa posa e sospende il ciclo quando è fermo. `scripts/native-runtime-manifest.mjs` e `nativeRuntimePages.ts` producono metadati compatti e materializzano le pagine necessarie senza cambiare atlanti o fotogrammi. | Test delle pose ferme, pausa/ripresa e preparazione pagine; confronto delle dimensioni del chunk registrato sotto. |
| 4B | `src/engine/pokemonFactory.ts` contiene la creazione delle istanze con dipendenze iniettabili. Incontri e store lo riusano; gli engine non importano lo store. | Test della factory e degli invarianti di istanza. È una separazione incrementale, non il completamento di una riscrittura dell'intero store. |
| 4C | [Specifica corrente](./current-game-spec.md), rapporti storici distinti nel README, [QA conclusivo](./audit-qa-2026-10-18.md) e [collaudo dei controller](./audit-controller-qa-2026-10-18.md). I file di prova restano sotto `output/roadmap-2026-10-18/`. | Completati regressione, ripetizioni dei casi corretti, build compilata, prove manuali e registrazione dei limiti. Nessun deploy o nuovo installer Windows eseguito in questa fase. |

### Misura della riduzione dei metadati

Il confronto salvato in `output/roadmap-2026-10-18/native-metadata-build-comparison.json` riguarda **il solo chunk del manifest delle animazioni native**:

| Misura | Prima | Dopo | Riduzione |
| --- | ---: | ---: | ---: |
| JavaScript compilato | 1.735.506 byte | 189.467 byte | 89,1% |
| Stima gzip della build | 484.447 byte | 4.381 byte | 99,1% |

Non è una misura del tempo di caricamento, del consumo di memoria, dei media trasferiti o dell'intero gioco. Il chunk principale rimane di circa 842 kB prima della compressione e produce ancora l'avviso di dimensione di Vite: la migrazione incrementale dei moduli rimane un lavoro ulteriore, senza alzare la soglia per nascondere l'avviso.

### Confini e controlli ancora distinti

- Le prove del backend locale, dei due controller e della maggioranza NPC sono documentate con versione della snapshot, log, primo timeout e ripetizione riuscita nel [rapporto controller](./audit-controller-qa-2026-10-18.md). Non dimostrano quale backend sia oggi pubblicato.
- Gli avvisi su pallini, negozi e Lega chiedono configurazione esplicita. Non sono contenuti mancanti da generare automaticamente e non bloccano il teatro mentale.
- I luoghi senza una mappa locale a pallini conservano la vista di riserva esistente; non sono state inventate nuove mappe o nuove interazioni.
- Restano da collaudare sul sistema di trasmissione telefono fisico, rete reale, CORS/HTTPS di produzione, OBS, Twitch, Discord e carico prolungato. Le prove locali non certificano questi livelli.
- La distribuzione dei media, un nuovo formato degli atlanti, la rigenerazione delle animazioni e una riscrittura completa del gioco restano esclusi da questa consegna.
