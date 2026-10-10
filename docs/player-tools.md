# Strumenti della partita e interazioni

Il pulsante **Partita**, nell’angolo inferiore sinistro, apre Diario, Backup, Impostazioni e Cronache. Questi pannelli sono disponibili anche nella schermata iniziale. Aprirli non consuma azioni.

## Diario e turno

Nel **Diario** scegli G1 o G2 per leggere medaglie, allenatori sconfitti, cespugli esplorati, posizione, monete e tappe configurate. I progressi sono individuali; una tappa condivisa è invece completata per entrambi dal primo giocatore che la conclude e premia soltanto quel giocatore.

Il prossimo obiettivo è un suggerimento ricavato dai dati della campagna e dai requisiti delle tappe. La mappa mostra anche le azioni disponibili. La regola resta **due movimenti oppure un movimento e un’interazione**: l’interazione conclude il turno, poi **Passa turno** cede il controllo all’altro giocatore. Cambiare vista o aprire un pannello non usa un’azione.

I vecchi salvataggi non registravano ogni luogo attraversato: il diario indica soltanto i luoghi documentati da posizioni locali, allenatori e cespugli. Il Percorso 15 e le sue tappe restano nascosti al giocatore finché non ha sconfitto tutte le otto palestre; l’accesso passa da Roma. Nessun incontro o premio viene creato automaticamente nel luogo segreto.

## Backup completo

In **Partita → Backup**, **Scarica backup partita** salva un file JSON portabile e versionato. Include entrambi i giocatori, squadre e depositi, HP/status/XP, inventari, monete, posizioni, turni, progressi, battaglia al suo ultimo punto concluso, definizioni delle interazioni e archivio delle cronache.

Per ripristinare:

1. Scegli il file in **Importa backup partita**.
2. Leggi l’anteprima e gli eventuali avvisi di recupero. Il limite del file è 5 MB; formati o versioni non supportati sono rifiutati.
3. Seleziona la conferma di sostituzione e premi **Ripristina questa partita**. **Annulla importazione** non cambia la campagna.
4. Se necessario, scarica la copia precedente dal pulsante dedicato. Questa copia viene conservata prima della sostituzione.

Il ripristino valida nuovamente il file e scrive i dati prima di sostituire la partita in memoria. Se lo spazio del browser è esaurito o bloccato, mostra un errore e tenta il rollback delle scritture già eseguite. Conserva gli HP: importare non cura le creature. Ricrea la scena anche se il backup contiene una battaglia e una battaglia era già aperta.

I dati del pubblico, i suoi riferimenti remoti, i temi e le impostazioni audio/animazioni del computer attuale non vengono importati. Se il file conteneva un turno in attesa di voto remoto, quel turno riprende dalla scelta del rivale, senza ripetere lo status già risolto. Una cronaca registra soltanto i risultati rivelati e conclusi: salvare durante un’animazione riprende dal precedente punto concluso.

I backup sono file della campagna sul tuo computer. Scaricali prima di eliminare i dati del browser o cambiare dispositivo. Il salvataggio automatico resta locale; non è stato aggiunto un servizio cloud.

## Editor dei pallini

Apri **Admin → Interazioni**, scegli il luogo e clicca un pallino oppure selezionalo dal campo **Pallino**. I numeri sono visibili soltanto nell’editor; coordinate, strade, collegamenti e ID del gioco restano quelli delle mappe approvate.

Ogni pallino può avere più interazioni. Assegna titolo, testo, disponibilità, completamento individuale o condiviso e attività:

- Dialogo, tappa o ricompensa.
- Cura esplicita della squadra.
- Allenatore o cespuglio già presente nei dati di quel luogo.
- Incontro con specie e livello definiti dalla regia.

I requisiti possono chiedere medaglie, un livello minimo in squadra, monete, Masterball o tappe precedenti anche in altre città. Puoi impostare un costo e una ricompensa in monete/Masterball. I requisiti sono controllati prima di spendere risorse o concludere il turno. Le dipendenze mancanti o circolari sono rifiutate.

Dialoghi e cure possono essere ripetibili soltanto senza ricompensa. Gli incontri assegnano il premio configurato dopo la vittoria o una cattura riuscita, in aggiunta alle ricompense ordinarie dell’allenatore; una sconfitta o una fuga non assegnano il premio. Una seconda chiamata o ricarica non paga nuovamente la stessa tappa.

**Salva interazione** pubblica la definizione nel gioco. Un errore di archiviazione conserva la configurazione precedente. In esplorazione, raggiungi il pallino e apri **Interagisci sul punto**. Le attività del luogo già esistenti restano nel loro pannello **Attività**.

In **Importa / esporta e Tiled** puoi scaricare un catalogo JSON oppure modificarlo e sostituirlo dopo la validazione. L’adattatore Tiled esporta lo sfondo e gli oggetti dei punti con proprietà `arkamon*`: modifica quelle proprietà e reimporta il file TMJ come testo. Metti il TMJ accanto al PNG originale per visualizzare lo sfondo in Tiled. L’importazione aggiorna soltanto le interazioni del luogo, senza riscrivere coordinate o collegamenti del gioco.

## Cronaca e replay

In battaglia il pulsante **Cronaca** elenca dadi realmente usciti, bonus, efficacia, danni, cure, status, KO, XP, Suprema, contraccolpo, cambi, catture e decisioni del pubblico. Durante una risoluzione il pulsante è bloccato; attacco e KO vengono registrati dopo la rivelazione dei dadi.

L’ordine della Suprema resta: danno al bersaglio → KO del bersaglio → XP/livelli dell’attaccante → contraccolpo → risultato. Nel doppio KO l’attaccante vince lo scontro. Il registro non modifica il risultato né lancia nuovi dadi.

Le ultime **20 battaglie concluse** sono archiviate automaticamente in **Partita → Cronache**, filtrabili per giocatore. **Rivedi** apre la sequenza degli eventi; **Precedente / Successivo / Ultimo evento** cambiano solo la consultazione. Puoi scaricare replay JSON e cronaca di testo. Ogni cronaca conserva al massimo 240 eventi e segnala eventuali eventi precedenti omessi. La pulizia dell’archivio richiede una conferma.

Se lo spazio del browser si esaurisce, la cronaca rimane consultabile durante la sessione e il pannello mostra un avviso. Scarica i replay da conservare e usa **Salva le cronache disponibili** dopo aver liberato spazio. Un’eliminazione o importazione fallita conserva l’archivio precedente.

## Audio e animazioni

In **Partita → Impostazioni** scegli volumi separati per musica ed effetti, audio acceso/spento, velocità normale o rapida e movimento ridotto automatico/attivo/disattivo. Le preferenze si salvano separatamente dalla campagna.

La velocità rapida dimezza le durate di presentazione senza cambiare dadi, danni o turni. Il movimento ridotto elimina transizioni spaziali e scuotimenti aggiuntivi, mantiene leggibili i risultati e rispetta l’ordine di rivelazione. Le modifiche di volume si applicano anche ai suoni già attivi.

## Verifica automatica

`npm test` esegue i test di logica e componenti. `npm run test:e2e` esegue i flussi nel browser su desktop e viewport mobile, con controlli axe sulle nuove interfacce. Prima dell’uso locale installa Chromium con `npx playwright install chromium`; per Chrome già installato imposta `PW_CHANNEL=chrome`.

La CI delle pull request esegue test, build e browser, conservando report, screenshot degli errori e tracce per sette giorni. Il server dei test usa la porta 3014 e contesti isolati: non modifica i salvataggi del browser abituale. Le prove automatiche non sostituiscono una campagna completa, telefoni fisici o una verifica della pubblicazione online.
