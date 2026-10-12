# Audit Arkamon — 12 ottobre 2026

La revisione copre il gioco React/TypeScript, il motore, gli store e i salvataggi, l'interfaccia, mappe e cataloghi, animazioni, integrazione dei voti e configurazione della pubblicazione. Sono stati corretti i difetti riprodotti nel repository del gioco. Il servizio dei voti esterno è stato esaminato localmente in sola lettura; il database remoto, il traffico reale da telefoni e la distribuzione in produzione non sono certificati da questo audit.

La base della revisione è `db9c58f`, che include la PR 48. Il lavoro è isolato su `audit/project-2026-10-12-isolated`: il checkout abituale è stato aggiornato da un'altra attività durante l'audit. Le fonti originali e gli asset non sono stati modificati.

## Correzioni

| Difetto riprodotto | Comportamento dopo la correzione | Prova |
|---|---|---|
| Cattura e Masterball modificavano memoria prima di sapere se il browser aveva salvato | Creatura, inventario, Arkadex, registro e checkpoint cambiano soltanto dopo una scrittura riuscita | Quattro casi quota: normale/Masterball, squadra/deposito; memoria e disco invariati al rifiuto; retry idempotente |
| La scena non spiegava una cattura non salvata e permetteva una nuova azione | Stato esplicito di cattura in attesa; riprova del solo salvataggio, senza nuovi dadi o effetti di status; altre azioni bloccate | Browser: quota selettiva, nessun consumo, retry e ricarica; un solo evento e una sola creatura |
| Posto in squadra considerato disponibile anche per una cattura fuori fascia con deposito pieno | La disponibilità include il cap di cinque livelli e il bersaglio concreto; rifiuto prima della cattura | Test con compagno KO incluso nel cap; browser con 1.050 posti occupati |
| Depositare l'ultimo Arkamon cancellava la distinzione fra setup e campagna iniziata | Titolo, laboratorio e store contano squadra e deposito; Continua funziona, reset richiede conferma, nessun secondo starter | G1/G2/entrambi in deposito, setup parziale, ricarica e browser |
| Saldi frazionari o oltre il limite numerico erano ripristinati ma rifiutati dal negozio | Saldo normalizzato a un intero sicuro con avviso; saldi validi conservati | Nove regressioni, comprese anteprima backup, ripristino e acquisto persistito |
| Vecchi poll del pubblico potevano interrompere o sovrascrivere il rinnovo del QR | Successi ed errori precedenti sono ignorati dopo una nuova operazione; nessun vecchio refresh durante il collegamento | Quattro ordini asincroni espliciti: successo/410/503 tardivi e revoca fallita |
| Alcuni renderer usavano solo il movimento ridotto del sistema | Tutti i VFX interessati seguono la scelta sistema/on/off del gioco | Preferenze opposte a quelle del sistema e pulizia dei timer |
| Velocità 2× accelerava i frame senza allineare impatto, completamento e livelli compositi | Clock coerenti, velocità fissata per evento; cambiare impostazione non ripete callback | Timer, ritardi, impatto/completamento e cambio preferenza durante l'evento |
| Il canvas cancellava lo sprite durante il caricamento del clip successivo | Ultimo frame conservato fino al nuovo frame pronto; PNG della stessa specie/lato al primo caricamento e dopo errore | Riproduzione clear senza draw; prova browser con atlante rallentato e pixel reali del canvas |
| Tab ed Esc del menù venivano bloccati durante le transizioni | La mappa resta protetta, i dialoghi indipendenti rimangono utilizzabili da tastiera | Browser con transizione trattenuta, Tab e chiusura Esc prima della fine |
| Grimbolt 24 richiedeva l'evoluzione in Ampereel 26 | Evoluzione nella forma finale Grimbolt 25 al livello 26 | Due regressioni rosse prima; HP/status/cap/EXP conservati |

Il target evolutivo corretto è un'inferenza convergente dai contenuti esistenti: 24 e 25 hanno nome, tipo, categoria e HP base comuni, mosse 18/128 → 19/129 e sprite piccolo/adulto della stessa famiglia. Ampereel 26 ha nome, categoria e mosse diversi e una propria evoluzione. Il target storico sbagliato è presente anche nell'Excel originale, che rimane invariato; non sono state inventate specie o modificati altri parametri.

Il pannello dei QR ora indica **partecipanti iscritti al gruppo**: il contatore non misura presenze in tempo reale, perché il servizio non dispone di heartbeat.

Sharp è aggiornato da 0.34.5 a 0.35.5, che include le correzioni delle dipendenze native segnalate dai maintainer. La pipeline reale di spritesheet, eseguita separatamente sulle due versioni con tre frame RGBA esistenti, produce PNG e pixel identici byte per byte, inclusa la cella vuota trasparente. Non sono stati rigenerati gli asset. [Avviso librsvg del maintainer](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w).

Rimosso il vecchio comando locale `gh-pages`, che compilava senza la base Pages e pubblicava attraverso un branch diverso dalla sorgente configurata. La distribuzione rimane il workflow GitHub Actions esistente; vedere [pubblicazione](github-pages-deployment.md).

## Verifica e copertura

La revisione strutturale verifica 110 specie, 229 mosse runtime (9 di status), 31 allenatori, 184 incontri in 85 cespugli; 16 mappe locali con 771 nodi e 922 strade; 29 luoghi e 31 collegamenti nella mappa principale. I nodi locali sono tutti raggiungibili dal loro ingresso e le strade sono bidirezionali. Nessun riferimento controllato mancante o con maiuscole/minuscole errate. Tutti i 220 PNG front/back e i 160 atlanti nativi di 32 specie sono presenti; letti gli header di 1.189 immagini.

Il Percorso 15 mantiene zero incontri e zero allenatori: i contenuti della località segreta non sono stati inventati. Gli sprite posteriori e le specie ancora prive di video mantengono il fallback previsto.

Sono preservati HP residui, danno al nemico prima del contraccolpo della Suprema, regola del doppio KO, cap comprendente i compagni KO, EXP mai accumulata e isolamento delle sfide dalla campagna. Rimangono font originali e asset originali della battaglia; il kit SVG resta sullo stato del lancio dei dadi. Non sono stati introdotti release degli asset o atlanti a pagine.

La cattura non salvata rimane risolta nella memoria della stessa scena per la riprova: lo store del dominio e il salvataggio restano invariati, mentre status, risultato e cronaca locali sono conservati. Ricaricare prima della scrittura riuscita riprende l'ultimo checkpoint già salvato. La prova di ricarica del nuovo risultato avviene dopo il retry riuscito. La verifica con veleno parte da 19 HP, applica un solo tick di 1 HP e conserva i 18 HP dopo due rifiuti, il successo, la ricarica e Prosegui.

Verifica locale completa: **2.448 test passati in 111 file**; **93 prove browser passate** e 15 esclusioni previste (prove specifiche 1920×1080 non ripetute sul viewport mobile); build di produzione con base `/Arkamon-Beta/` riuscita. I risultati CI sono riportati nella PR. I controlli in browser includono desktop/mobile, Arkadex, registro, negozio, backup, sfide, cap, deposito, voti simulati, schermate 1920×1080 e le nuove regressioni di recupero. Le prove usano contesti separati, senza alterare il salvataggio abituale.

Limiti: la connettività dei grafi non equivale a una partita manuale completa fino a Roma; header/metadati non certificano tutti i frame contro i video originali. Il test dei pixel rallentati è una prova di rendering reale; i test dei timer e dei callback usano un ambiente controllato. Non è stato misurato il consumo su un telefono fisico. I GIF come immagini conservano il loro FPS intrinseco, mentre 2× accelera contenitore e callback; la scena di evoluzione usa ancora il timer fisso di 1,8 secondi.

## Priorità rimaste

| Priorità | Problema e implicazione | Passo concreto |
|---|---|---|
| Alta, distribuzione | `public` contiene 4.008.316.375 byte, circa 3,733 GiB, e Vite lo copia integralmente. Supera il limite documentato di 1 GB del sito Pages. La build riuscita non risolve la quota. | Distinguere contenuti realmente necessari e materiali sorgente; progettare una distribuzione degli asset separata. Questo lavoro era stato rimandato dall'utente e non viene introdotto di nascosto nell'audit. |
| Alta, memoria | Gli atlanti più grandi sono 7.680² pixel: circa 225 MiB RGBA ciascuno, 450 MiB per due. La cache da 512 MiB non comprende bitmap, canvas, GPU e decodifiche transitorie. | Profilo su dispositivi reali, caricamento mirato e qualità regolabile; paginazione degli atlanti nel lavoro futuro già previsto. |
| Alta, backend voti separato | Il checkout locale del servizio usa Next 15.0.7 con avvisi di sicurezza. L'avviso RCE riguarda server su filesystem Windows; non dimostra esposizione di Vercel/Linux. Versione remota e hosting non verificati. | Aggiornamento controllato del servizio esterno, seguito da prove su cookie, QR, CORS, scadenza e persistenza; non pubblicare quel backend locale come se fosse già aggiornato. |
| Media, voto al primo accesso | Due primi ingressi contemporanei dello stesso browser ai due QR possono creare cookie differenti; l'ultimo invalida l'accesso precedente. Ingressi sequenziali funzionano. | Bootstrap dell'identità condiviso/serializzato e test con due schede; nessuna prova di voti ordinari duplicati. |
| Media, salvataggi | Diverse altre azioni usano aggiornamenti persistenti multipli e gli errori di quota non hanno ancora un esito uniforme. | Estendere la transazione con risultato esplicito a fine battaglia, premi e interazioni; recovery visibile e backup automatico recuperabile. |
| Media, Fanta v2 | Il costo Fanta v1 esclude CURA ma tratta CURA_PCT come migliore attacco atteso per alcune specie, alterando il prezzo relativo. | Correggere nella versione 2 delle regole con classifiche separate; cambiare v1 invaliderebbe comparabilità e generazione delle vecchie sfide. |
| Media, avvio | Bundle principale circa 1,42 MB minificato, 239 kB gzip; cataloghi e strumenti aumentano il lavoro iniziale. | Separare dati non necessari subito e strumenti di amministrazione; conservare una baseline di tempi reali su rete lenta. |
| Media, strumenti | Audit npm del frontend: zero avvisi nelle dipendenze di produzione; otto negli strumenti (5 high, 2 moderate, 1 low) dopo le correzioni. Restano Tailwind/transitive e esbuild. | Aggiornamenti compatibili verificati e, quando necessario, piano dedicato; nessun `audit fix --force` né migrazione automatica dello stack. |

Fonti: [limiti di GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [avviso Next Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), [avviso esbuild serve su Windows](https://github.com/evanw/esbuild/security/advisories/GHSA-g7r4-m6w7-qqqr). Le condizioni degli avvisi sono distinte dall'esposizione effettiva dell'applicazione.

Il workflow Pages del `main` esistente (`db9c58f`, run 38225024610) risulta riuscito. L'eccesso rispetto alla quota è dunque un rischio documentato e misurato del pacchetto, non la diagnosi di un rifiuto di quel deploy. Le nuove correzioni dell'audit richiedono l'integrazione della loro PR prima di arrivare al sito pubblico.

## Funzionalità e interattività da progettare

| Idea | Beneficio per il gioco | Complessità / vincoli |
|---|---|---|
| Pubblico informato | Sul telefono: HP, stato e descrizione breve delle mosse; in regia: mossa vincente e percentuale dei voti | Bassa/media; usare i due canali attuali e il solo stato già pubblico |
| Obiettivi personali di viaggio | Piccoli incarichi con progresso e ritorno dall'NPC; motivi diversi per visitare le città | Media; definire premi, consumo dell'interazione e visibilità per giocatore |
| Tornei delle sfide seed | Stessa configurazione per tutti, tabellone e confronto dei risultati; campagna intatta | Media; regole versionate e classifica condivisa con verifica dei risultati |
| Anteprima tattica | Mostrare intervallo del danno, rapporto fra tipi e possibili stati per le specie già conosciute | Bassa/media; calcolo dal motore corrente, senza cambiare RNG o rivelare specie sconosciute |
| Dialoghi a scelta e NPC riconoscibili | Ritratto, battute e decisioni con conseguenze esplicite; più identità per ogni luogo | Media; autore dei contenuti, persistenza delle scelte e icone sui punti senza numeri |
| Boss cooperativo | I due giocatori affrontano un nemico comune e il pubblico decide la sua mossa | Alta; definire ordine dei turni, KO, oggetti, ricompense e checkpoint prima dell'implementazione |
| Scambi consensuali | Scelta di due creature, riepilogo e conferma di entrambi i giocatori | Media/alta; trasferimento atomico, cap e spazio verificati, nessun vantaggio da ricarica |
| Spiegazione del turno | Dalla cronaca, una scheda che collega tiro, bonus, tipo, stato e danno effettivo | Bassa; sfruttare i dati già registrati e favorire apprendimento e discussione durante lo stream |

Ordine suggerito: affidabilità della distribuzione e dei salvataggi, pubblico informato e spiegazione del turno, poi obiettivi di viaggio. Tornei e cooperativa richiedono prima regole consolidate e un servizio condiviso verificato.
