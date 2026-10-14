# Arkamon: ospiti, Lega e interfacce GDR

## Format e ambito

Livio conduce e interpreta la storia a voce. Melia e Maggi sono i due giocatori della campagna. Il software presenta movimenti sulle mappe, battaglie e gestione degli Arkamon. Non vengono introdotti strumenti narrativi o altre forme di influenza del pubblico.

Il pubblico sceglie a maggioranza soltanto le mosse dei normali allenatori NPC. Capipalestra, rivale, Superquattro ed eventuale Campione sono controllati da un singolo ospite invitato. Gli incontri selvatici rimangono automatici.

## Collegamento ospite

Aggiornare insieme Arkamon e il servizio Arkanight: il secondo implementa il protocollo `private-guest-v1`. Nell’Admin di Arkamon, collegare il servizio con le credenziali della regia. Le abilitazioni del pubblico NPC e dell’ospite sono indipendenti.

Il QR NPC può essere mostrato in live. L’invito ospite è nascosto finché la regia non lo mostra nell’Admin; va condiviso privatamente con la persona che interpreta l’avversario. La battaglia non mostra mai quel QR.

Il primo browser che apre l’invito ne acquisisce il controllo esclusivo. Il cookie HttpOnly mantiene l’identità dopo una ricarica. Un altro browser non può usare il medesimo invito già assegnato. Per cambiare ospite, premere **Nuovo ospite / rinnova invito**: il precedente perde accesso, il collegamento NPC rimane valido. Sono disponibili revoca e scadenza dell’invito a un’ora.

Il comando deve corrispondere a round, turno, creatura, mossa e generazione dell’invito correnti. Un comando privato chiude immediatamente il turno; non è un voto a maggioranza. In caso di scadenza o revoca, nessuna mossa automatica viene eseguita senza l’intervento della regia. È disponibile il fallback esplicito. Un servizio precedente senza il nuovo protocollo non può trasformare il boss in una votazione pubblica.

La stessa persona deve continuare a usare lo stesso browser per riconnettersi. Il cambio dispositivo richiede un nuovo invito. Il QR è una capacità privata, non una verifica dell’account Discord o Twitch.

## Lega

L’ingresso è disponibile a Roma dopo le otto medaglie. Le quattro battaglie consecutive occupano lo stesso turno del giocatore, compresi i checkpoint fra incontri e le evoluzioni. I progressi sono distinti per i due giocatori e inclusi nei backup della campagna; le sfide seed/Fanta restano separate.

Prima della prima partecipazione, Livio configura nell’Admin i nomi dei quattro Superquattro, specie e livelli delle rispettive squadre. Le decisioni su ripartenza dopo una sconfitta ed eventuale Campione finale restano esplicite nella configurazione. Una bozza incompleta non può iniziare una Lega e non assegna una vittoria. Non sono stati inventati avversari o contenuti della storia.

Il primo giocatore che completa la serie viene registrato come Campione della regione, con la squadra vincente e la schermata finale. I movimenti della corsa si fermano; campagna e registro restano disponibili. Dopo il primo tentativo la configurazione è fissa per entrambi i giocatori.

Gli HP residui si conservano. Gli oggetti della borsa, usati esplicitamente fra incontri, non interrompono il turno riservato alla serie e non acquistano né regalano cure. La formazione non può essere riordinata o scambiata con il deposito durante il tentativo. Il percorso segreto conserva lo sblocco precedente e non riceve nuove attività.

## Interfacce e presentazione

- Cornici SVG blu, font originali e front ufficiali confermati sono conservati. La direzione GDR/DS si esprime con finestre, cursore triangolare, gerarchia, liste e comandi stabili.
- Deposito: ricerca per nome/specie/numero, tipo, livello e condizione; i filtri attenuano le creature senza spostare le coordinate. L’anteprima della destinazione mostra la fascia di livelli e un eventuale blocco del cap prima dello scambio.
- Borsa: anteprima reale degli HP prima/dopo e degli status rimossi o conservati, senza consumare l’oggetto durante la consultazione.
- Menù: carta allenatore con medaglie e stato della Lega. Nessun negozio nella navigazione e un solo **Riprendi il Viaggio**.
- Battaglie: asset originali delle mosse, cursore e dettagli tattici; le cure mostrano il loro effetto anziché dadi offensivi. HP numerici per entrambi i lati; stato del turno con nomi effettivi e distinzione ospite/pubblico. Risultato con KO e livelli derivati dagli eventi rivelati, senza rilanciare dadi o assegnare ricompense extra.
- Cattura e superamento di una palestra ricevono un sigillo animato breve. L’evoluzione alterna i front delle due forme, centrati sulla loro area opaca, e rispetta velocità e movimento ridotto.
- Mappa principale: la pedina segue anche le curve delle strade personalizzate; due comandi rapidi percorrono entrambe le strade in ordine. Hover/focus anticipa il percorso senza spendere azioni. Le mappe locali mantengono pallini senza numeri visibili e anticipano il singolo movimento.

Le prove browser includono 1920×1080 con contenuto denso, ricarica della Lega, quattro battaglie reali e collegamento a un servizio locale reale. Le prove locali non certificano automaticamente il deployment remoto, il telefono fisico o OBS/Twitch. Il rapporto di consegna indica i controlli conclusi sul commit pubblicato.
