# Collaudo locale dei controller Arkamon · 18 ottobre 2026

## Ambito e provenienza

Il servizio non era presente nel checkout Desktop `main`: quel ramo non contiene ancora le API Arkamon. Il worktree storico `arkamon-live-vote` era stato rimosso dal filesystem, ma l'oggetto Git del ramo `feat/arkamon-private-guests-2026-10-14`, commit `ff4b0c8b03aa15a4a8a865e99c6bd7459c9c699c`, era ancora disponibile nel repository locale Arkanight.

Per la prova è stata estratta una snapshot indipendente sotto `output/vote-service-audit-2026-10-18`, senza cambiare rami o sorgenti del backend. Le dipendenze sono state installate dal lockfile della snapshot. Lo script ufficiale di test usa un archivio di file temporaneo privato, una password esclusivamente fittizia e binding su `127.0.0.1:3047`.

Per la successiva integrazione con la build Arkamon `http://127.0.0.1:3052`, un launcher di sola verifica ha aggiunto quell'origine alla lista CORS locale. Il launcher elimina le variabili Supabase ereditate e non carica file di ambiente di produzione. La snapshot contiene soltanto `.env.example`.

La sessione usa autenticamente password host di test, token generati dal servizio, inviti e cookie HttpOnly del protocollo normale: non sono stati rimossi o aggirati controlli di autenticazione. Nessun database, credenziale, migrazione o sito remoto è stato utilizzato o modificato.

## Risultati verificati

| Verifica | Esito | Prova |
| --- | --- | --- |
| Modelli, handler HTTP, file-store, concorrenza e crash dei lock | 62 test passati | `output/vote-service-unit-2026-10-18.log` |
| Controller nel browser desktop e Pixel 7 emulato | 10 test passati | `output/vote-service-browser-2026-10-18.log` |
| Ospite privato: frontend Arkamon aggiornato → API reali → pagina telefono | 1 test passato | `output/private-guest-integrated-2026-10-18.log` |
| Pubblico NPC: due telefoni → voti reali → maggioranza nel frontend aggiornato | 1 test passato nella ripetizione isolata | `output/npc-integrated-retry-2026-10-18.log` |

I dieci casi del servizio esercitano due QR aperti contemporaneamente nella stessa identità tramite Web Locks e SharedWorker, ingresso sequenziale nei browser privi di tali strumenti, persistenza del cookie dopo ricarica, cambio voto senza doppio conteggio, assegnazione esclusiva dell'ospite, comando singolo, revoca/rinnovo dell'invito, pubblico escluso dal canale privato e scadenza senza scelta automatica al posto dell'ospite.

La prova integrata dell'ospite usa il test persistente `e2e/private-guest-battle.spec.ts`: ricarica la battaglia in attesa, riceve **Soffio** dal telefono, applica un solo attacco senza ripetere il veleno già risolto, ricarica nuovamente e confronta HP ed eventi salvati. Nessun errore JavaScript rilevato nel frontend in questo percorso.

La prova NPC usa due browser telefono distinti: il primo vota **Soffio**, il secondo vota **Brezza Profumata** e cambia il voto in **Soffio**. I conteggi reali risultano `[2,0,0]`, con due partecipanti. La ricarica del frontend conserva lo stesso round; la chiusura da parte della regia risolve la maggioranza e applica un singolo attacco regolare, senza ripetere il veleno già risolto. Una seconda ricarica conserva HP ed eventi. Nessun errore JavaScript rilevato in questo percorso.

Il primo tentativo NPC ha raggiunto il limite di 60 secondi durante la ricarica e la riapertura della votazione, mentre servizio e frontend di sviluppo erano sottoposti a lavoro concorrente. Il test è stato corretto per attendere il documento e i segnali effettivi della UI anziché il caricamento integrale dei media; il budget della prova è diventato 120 secondi. La ripetizione è passata in circa 1,9 minuti. Il primo timeout rimane nel log `output/npc-integrated-2026-10-18.log` e non viene conteggiato come passaggio. Questi tempi non sono una misura delle prestazioni della build pubblicata.

## Limiti

- La prova riguarda il protocollo della snapshot backend `ff4b0c8b` e il frontend locale della roadmap. Non certifica che lo stesso commit sia pubblicato sul sito Arkanight.
- L'archivio reale della prova HTTP è su file. I test del percorso Supabase verificano il confronto atomico delle revisioni tramite simulazione; non costituiscono una prova autenticata del database remoto.
- Pixel 7 è emulato. Telefono fisico, rete LAN, HTTPS pubblico, proxy, impostazioni CORS di produzione e scansione con fotocamera richiedono ancora un collaudo sul sistema di trasmissione.
- OBS, Twitch e Discord non erano in esecuzione nel collaudo automatizzato. Le prestazioni sulla macchina di regia rimangono una verifica distinta.
- I sorgenti del backend non sono stati modificati né pubblicati. Il servizio temporaneo può essere arrestato al termine delle prove; le sessioni create contengono soltanto dati dimostrativi.
