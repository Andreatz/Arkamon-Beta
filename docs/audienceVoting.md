# Votazione delle mosse del rivale

Il pubblico può partecipare dal telefono e scegliere la mossa del Pokémon dell’allenatore rivale. La regia continua a gestire dadi, avanzamento dei turni e battaglia. La votazione si applica ad allenatori NPC, capipalestra e rivale PvP; i Pokémon selvatici sono esclusi.

## Avviare il collegamento

1. Aprire **Admin → Pubblico** in Arkamon.
2. Inserire nel campo **Sito per il collegamento** l’origine del sito Arkanight che ospita il servizio, per esempio `https://arkanight.example`. Usare l’indirizzo completo, senza percorso, parametri, credenziali o frammento.
3. Inserire la password della regia del sito e premere **Avvia collegamento**. Il campo della password viene svuotato immediatamente; la password non viene salvata nelle preferenze di Arkamon.
4. Scegliere il **Tempo per votare**: il valore iniziale è 15 secondi, modificabile da 5 a 120. Il tempo di un ballot già aperto resta invariato.
5. Attivare **Fai scegliere le mosse al pubblico**. L’opzione parte disabilitata.

Il pannello mostra due inviti distinti:

| Codice QR | Battaglie controllate dal pubblico |
|---|---|
| Allenatori NPC | Allenatori NPC |
| Capipalestra e PvP | Capipalestra e lato rivale delle battaglie PvP |

Gli inviti rimangono gli stessi per tutti i turni del collegamento. Si possono mostrare sullo schermo, copiare con **Copia link** o salvare come immagine con **Scarica QR**. La battaglia mostra automaticamente il QR del canale pertinente. Il telefono vede solo la votazione del proprio canale; può aprire anche l’altro invito dallo stesso browser.

Un nuovo collegamento sostituisce il precedente e genera nuovi QR. Prima di sostituirlo bisogna concludere l’eventuale votazione in corso. La sessione dura al massimo 24 ore; alla scadenza occorre avviarne una nuova.

## Come si sceglie la mossa

Ogni browser collegato ha una scelta per turno e può cambiarla fino alla chiusura. Cambiare scelta sposta il voto: non aggiunge un altro votante. Vince la mossa con più voti. In caso di parità il server estrae una delle mosse a pari merito una sola volta e conserva il risultato. Senza voti viene usata la scelta automatica del rivale.

Il pubblico sceglie fra le mosse disponibili per il Pokémon attuale. La Mossa Suprema non compare fra le opzioni. Il termine della votazione dipende dall’orologio del server; un nuovo voto o il ricaricamento della pagina non fanno ripartire il tempo.

Gli status obbligatori vengono elaborati prima di aprire la votazione. Sonno o un KO da veleno possono impedire il turno e quindi non aprono il ballot. La mossa scelta resta soggetta alla paralisi, ai dadi e alle regole normali di danno e KO. Il checkpoint della battaglia conserva il turno in attesa, così la ripresa non applica di nuovo veleno o sonno né esegue due attacchi.

La regia può **concludere la votazione** prima della scadenza. Se il servizio non risponde, può **riprovare** oppure **continuare senza votazione** e lasciare scegliere al rivale. Disattivare il voto del pubblico interrompe l’attesa e ripristina la scelta automatica.

## Telefono, rete e HTTPS

`localhost`, `127.0.0.1`, `::1` e `0.0.0.0` non sono indirizzi da distribuire ai telefoni. Per una prova locale usare l’indirizzo LAN del computer e collegare i telefoni alla stessa rete Wi-Fi; il servizio deve ascoltare su un’interfaccia raggiungibile e la rete deve consentire la connessione.

Per l’uso online configurare un sito pubblico HTTPS. Se la pagina del gioco è aperta in HTTPS, anche il sito delle votazioni deve usare HTTPS: il browser blocca una richiesta HTTP e Arkamon mostra un messaggio prima di inviare la password. Le prove HTTP del gioco verso un servizio HTTP sulla stessa rete restano possibili.

Il sito delle votazioni e quello del gioco possono avere domini diversi. Il backend deve consentire esattamente l’origine del gioco, comprensiva di protocollo e porta, tramite `ARKAMON_HOST_ORIGINS`. Per esempio l’origine di `https://utente.github.io/Arkamon-Beta/` è `https://utente.github.io`, senza il percorso `/Arkamon-Beta/`. Non usare `*`.

## Configurazione del servizio Arkanight

Il frontend Arkamon viene configurato dalla scheda **Pubblico** e non richiede nuove variabili `VITE_*`. Il backend e la pagina del telefono sono nel repository Arkanight, con API sotto `/api/arkamon-votes` e pagina `/giochi/arkamon/vota/<sessionId>`.

Prima dell’utilizzo online:

1. Applicare nel progetto Supabase di Arkanight il file **`docs/arkamon-votes-setup.sql` del repository Arkanight**. Crea l’archivio privato `arkamon_vote_sessions`, abilita RLS e nega l’accesso ai ruoli del browser. Il servizio usa esclusivamente il client server con ruolo di servizio.
2. Configurare nel server le variabili esistenti `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `ADMIN_PASSWORD`. La chiave di servizio e la password non vanno nel frontend Arkamon, nei QR o nel repository.
3. Impostare `ARKAMON_HOST_ORIGINS` con le origini esatte autorizzate del gioco, separate da virgole. In produzione le origini locali di sviluppo non sono abilitate automaticamente.
4. Se necessario, impostare `ARKAMON_VOTE_PUBLIC_ORIGIN` con l’origine canonica HTTPS del sito Arkanight. Il valore deve essere una sola origine, senza percorso, query, frammento o credenziali. Usare la stessa origine nel campo **Sito per il collegamento** di Arkamon, perché il frontend verifica che gli inviti restituiti appartengano al servizio configurato.
5. Pubblicare il servizio e verificarlo con un telefono usando entrambi i QR. Avere il frontend locale o una PR pronta non equivale ad aver configurato il database e pubblicato il servizio.

Solo per prove di sviluppo è disponibile `ARKAMON_VOTE_LOCAL_STORE`, impostata a una directory assoluta privata fuori dal repository e dai file pubblici. In produzione questa opzione viene rifiutata: il servizio non sostituisce automaticamente il database con dati in memoria o file locali. Dettagli su archivio, API e controlli sono in **`docs/backend-arkamon-votes.md` del repository Arkanight**.

## Chiusura e recupero

**Chiudi collegamento** disattiva il voto, revoca la sessione sul sito e cancella la capacità host da questo computer. I precedenti QR smettono di funzionare dopo la revoca.

Se il sito non è raggiungibile, Arkamon disattiva il voto e conserva il collegamento per poter riprovare a chiuderlo. Solo dopo questo errore compare **Scollega questo computer**: elimina la capacità locale e permette di impostare un altro sito. Questa operazione non conferma una revoca remota; i vecchi QR restano sul sito fino alla scadenza della sessione.

La capacità di controllo host viene conservata soltanto nelle preferenze locali dell’organizzatore, con verifica di scadenza. Non è inclusa nel checkpoint della battaglia, nelle esportazioni di gioco, nei link o nei QR pubblici. I collegamenti del pubblico contengono soltanto l’invito del canale; la pagina del telefono lo elimina dalla barra dell’indirizzo dopo averlo letto. Il backend gestisce l’identità anonima del browser tramite cookie HttpOnly e mantiene i voti dei due canali separati.
