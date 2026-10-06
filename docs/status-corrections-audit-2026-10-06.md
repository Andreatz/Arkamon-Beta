# Correzione paralisi e sonno — 6 ottobre 2026

Questo intervento applica le ultime due puntualizzazioni dell'utente. La paralisi non guarisce con il dado: 1–2 impedisce l'attacco e consuma il turno, 3–6 permette l'attacco (66,7%), mantenendo lo status e la priorità per seconda. Il primo turno di sonno viene sempre saltato senza dado; i tentativi di risveglio con 4–6 iniziano dal secondo turno.

## Implementazione

Il motore distingue la verifica di un attacco dalle azioni non offensive. La scena A verifica PAR dopo la scelta dell'attacco; la scena B fa lo stesso dopo la scelta umana PvP o dell'IA. Le cure e la Masterball non richiedono il dado PAR. Il sonno e gli altri status continuano a essere risolti anche per queste azioni. Un attacco bloccato, inclusa la Suprema, non infligge danni né applica il contraccolpo.

Le quattro mosse di cura HP già giocabili rimuovono paralisi e veleno anche a HP pieni. L'IA dà priorità alla cura della propria paralisi. La fine di una battaglia senza cura mantiene PAR in squadra e deposito per entrambi i giocatori; una cura completa o il Centro la eliminano. Non sono stati introdotti nuovi oggetti curativi: l'unico oggetto attualmente giocabile è la Masterball.

Per il sonno, tre turni rimanenti identificano il primo turno ancora obbligatorio. Il primo salto porta il contatore a due; i successivi d6 4–6 svegliano immediatamente, 1–3 consumano un altro turno di sonno. Dopo al massimo tre turni saltati lo stato termina e si agisce dal turno successivo. Un salvataggio con due o un turno rimanente riprende dai dadi di risveglio senza ripetere il primo salto.

Segnalini, descrizioni accessibili, laboratorio e documentazione mostrano le nuove regole. Il laboratorio consente inoltre una cura esplicita della paralisi a HP pieni. Veleno progressivo e ordine della Suprema (KO del bersaglio → XP/livelli → contraccolpo) restano coperti dalla suite.

## Verifica automatica

- **800/800 test passati in 60 file**, inclusi tutte le sei facce PAR, persistenza dello stato, tutte le sei facce del sonno dal secondo turno e primo turno senza chiamare RNG.
- Cure HP a massimo e parziale, priorità IA anche a livello100, conservazione PAR dopo cattura/fine battaglia, salvataggio e ripristino reale, squadre e depositi dei due giocatori, Centro e cura completa.
- TypeScript e build di produzione completati con successo. Restano i warning preesistenti su dimensioni del bundle e dati Browserslist.

## Verifica nel browser

Le prove usano App e motore reali con stato iniziale dichiarato tramite pulsanti di una pagina QA locale separata. Dadi e risultati delle mosse non vengono forzati.

- **Cura A e B PvP:** Beestrix livello10 paralizzato usa Assorbilinfa a19/19HP. Nessun dado PAR; dopo l'animazione lo stato è assente e gli HP restano19.
- **Sonno A e Suprema:** Vyrath livello10 con19HP e tre turni di sonno sceglie Suprema→Soffio. Il primo turno viene saltato senza dado; gli HP restano19 e il bersaglio154, senza contraccolpo. Il segnalino passa3→2. La ricarica conserva contatore2 e il passaggio al rivale.
- **Sonno B PvP:** avviare il turno del rivale con tre turni di sonno lo salta direttamente senza dado e senza mostrare la scelta delle mosse. Il segnalino passa3→2 e gli HP restano19 contro154.
- **Attacco PAR A e Suprema PAR B:** il vero dado1 blocca entrambe le azioni. Nessun danno al bersaglio, HP19 e154 conservati, nessun contraccolpo della Suprema e PAR ancora presente. Il controllo passa al lato opposto.
- **Laboratorio di produzione:** primo sonno senza dialogo del dado; dal secondo, il vero dado6 sveglia. Il dado PAR3 consente l'attacco ma lascia il segnalino; «Cura paralisi» lo elimina anche a100HP.
- **Schermo mobile:** laboratorio a390×640, larghezza del documento390, senza scorrimento orizzontale. I nuovi comandi e le descrizioni restano leggibili. Log della pagina di produzione privi di errori e avvisi.

La verifica riguarda questi scenari e i salvataggi provati, non una campagna completa. La build aggiornata è disponibile nell'anteprima locale; la pubblicazione GitHub Pages è separata dal salvataggio sul branch di lavoro.
