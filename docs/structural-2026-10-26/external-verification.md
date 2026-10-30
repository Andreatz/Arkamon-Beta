# Ospite, telefoni e vista pubblica in un profilo separato

## Servizio ospite effettivo

La specifica `e2e/private-guest-battle.spec.ts` è stata eseguita contro il codice reale Arkanight, estratto in una snapshot separata alla revisione `ff4b0c8b03aa15a4a8a865e99c6bd7459c9c699c`. Il repository Arkanight è privato: nessun suo sorgente viene incorporato o pubblicato nel frontend Arkamon. L'estrazione, le dipendenze e i log restano sotto `output/`, escluso dal versionamento.

Il nuovo launcher `scripts/start-private-guest-service.mjs`:

- accetta solo un percorso assoluto alla copia isolata;
- rifiuta copie contenenti file `.env` reali, poiché Next li leggerebbe anche dopo la pulizia delle variabili;
- passa al processo una lista minima di variabili di sistema, senza Supabase o altre credenziali ereditate;
- imposta una password dimostrativa, un archivio temporaneo privato e binding `127.0.0.1:3047`;
- consente soltanto le origini locali usate dal test e rimuove l'archivio temporaneo alla chiusura normale.

Risultati del 26 ottobre 2026:

| Prova | Risultato |
| --- | --- |
| Test del backend HTTP, modello, protezione identità, file-store, concorrenza e confronto delle revisioni | **62/62 riusciti** |
| Frontend Arkamon, vero servizio e telefono emulato 393×851 | **1/1 riuscito**, nessun test saltato |
| Ricarica della battaglia mentre attende il comando | Stesso turno ripristinato |
| Comando Soffio dal telefono | Un attacco eseguito, senza ripetere il veleno già risolto |
| Ricarica dopo l'attacco | HP ed eventi conservati, nessun secondo attacco |

La sessione usa password, inviti, token e cookie HttpOnly generati normalmente dal servizio. I controlli di accesso non vengono disattivati. Il percorso Supabase è verificato dai test di confronto delle revisioni con simulazione del trasporto; nessuna connessione autenticata al database remoto è stata effettuata.

Per ripetere su una copia già isolata del backend:

```powershell
$env:ARKAMON_GUEST_BACKEND_CHECKOUT = 'C:/percorso/alla/snapshot-isolata'
npm run test:private-guest
```

La configurazione avvia automaticamente frontend e servizio, rifiutando di riusare un processo preesistente. La suite ordinaria conserva l'esclusione esplicita quando non dispone del backend. Il workflow manuale `Isolated private guest integration` rende questa verifica ripetibile in GitHub con un token di sola lettura del repository privato, separato da ogni credenziale di produzione.

## Browser Source con profilo separato

Il limite di `BroadcastChannel` è stato rimosso per la regia locale mediante un relay opzionale HTTP/SSE. La modalità ordinaria, fra finestre dello stesso profilo, continua a funzionare senza avviare servizi aggiuntivi.

Avvio della versione locale e del relay:

```powershell
npm run dev -- --host 127.0.0.1
npm run obs:relay -- http://127.0.0.1:3000/
```

Il secondo comando mostra due collegamenti. Aprire il collegamento **Console di gioco** nella scheda che controlla la partita, sostituendo l'indirizzo corrente, e usare il collegamento **Browser Source OBS** nella sorgente Browser. Se si sta usando una build compilata con base Pages, fornire il suo URL locale completo, per esempio `http://127.0.0.1:3016/Arkamon-Beta/`.

Il relay si lega esclusivamente a `127.0.0.1`. I collegamenti contengono due capacità casuali diverse da 256 bit nel frammento `#` dell'indirizzo: il frammento non entra nella richiesta HTTP della pagina. Le chiamate al relay usano l'header Authorization; nessun token è accettato nei parametri dell'API. L'origine è quella locale fornita esplicitamente all'avvio. Le capacità scadono alla chiusura del processo e un nuovo avvio genera nuovi collegamenti.

La sorgente può soltanto leggere. Non esistono comandi di gioco sul relay. Il mittente invia esclusivamente `makePublicSnapshot`; il server rifiuta campi privati, corpi oltre 2 MiB e scritture con la capacità del visualizzatore. Il client mantiene al massimo una richiesta e una fotografia più recente in attesa. Una sorgente che si collega in ritardo riceve l'ultimo stato pubblico; uno stream bloccato viene interrotto dopo otto secondi e ritentato. Non viene persistito un salvataggio nel profilo della sorgente.

Console e visualizzatore seguono anche `hashchange`: applicare, sostituire o rimuovere il collegamento nella pagina già aperta chiude il trasporto precedente e invalida importazioni e callback superate. La regressione conserva un marcatore DOM per dimostrare che collegamento e disconnessione funzionano senza ricarica. Rimuovere il frammento disconnette quel client; per invalidare le capacità del processo occorre chiudere e riavviare il relay.

La nuova specifica compilata `e2e-release/broadcast-relay.spec.ts` usa **due BrowserContext indipendenti**, privi di storage, lock e BroadcastChannel condivisi. Verifica ingresso dopo un cambio turno, aggiornamento, ricarica passiva, perdita reale del trasporto, riconnessione e chiusura della console. Per interrompere il trasporto chiude effettivamente il server: la sola emulazione offline Chromium non tronca uno stream SSE già aperto. La ripresa nel test mantiene le medesime capacità; riavviare il comando CLI genera invece nuove capacità e richiede aggiornare i collegamenti.

La prova è riuscita sulla build compilata a **1920×1080**, senza errori JavaScript, pulsanti di gioco, Admin o salvataggi nel profilo separato. Anche i quattro contratti HTTP di autorizzazione, limiti e ingresso tardivo sono riusciti. Lo screenshot `isolated-browser-source.png` è conservato fra gli output della prova.

In OBS impostare **File locale disattivato**, URL del visualizzatore, larghezza 1920 e altezza 1080. Le opzioni di scaricamento e ricarica della pagina possono restare nelle impostazioni preferite della regia: il visualizzatore recupera lo stato all'apertura. Questi controlli corrispondono alle [proprietà ufficiali della sorgente Browser](https://obsproject.com/kb/browser-source).

## Confini delle prove

- Il collegamento dedicato serve al gioco aperto su HTTP locale nella stessa macchina di OBS. Non espone una porta sulla LAN e non abilita accesso remoto. Per la finestra Tauri rimane disponibile Cattura finestra; il relay non allarga la CSP dell'app desktop.
- Immagini importate nello Studio e conservate soltanto nell'IndexedDB di un profilo non vengono copiate nel profilo OBS: per quel caso usare risorse del pacchetto o Cattura finestra. Il relay trasferisce lo stato pubblico, non un archivio privato di media.
- L'eseguibile OBS è presente sulla macchina, ma non è stato avviato e non sono stati toccati profili, collezioni, dispositivi di cattura o impostazioni utente. La prova Chromium misura l'isolamento e il trasporto, non certifica GPU, audio, decoder CEF o acquisizione finale di OBS.
- Telefono fisico, scansione QR con fotocamera, rete Wi-Fi, sospensione prolungata del sistema operativo e HTTPS/CORS del sito pubblicato richiedono il dispositivo e l'ambiente reale. La prova con browser telefono emulato è distinta da queste verifiche.
- La revisione remota attualmente pubblicata di Arkanight e la configurazione Supabase di produzione non sono state modificate o certificate.
