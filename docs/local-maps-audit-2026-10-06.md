# Verifica delle mappe locali — 6 ottobre 2026

Integrate le 16 immagini di città e percorsi fornite in `public/maps`, conservando i PNG originali. Le reti manuali contengono **765 pallini e 893 strade bidirezionali**. Gli avatar seguono curve, ponti e bordi delle piazze; i due giocatori conservano posizioni indipendenti per luogo e il nodo effettivo della mappa principale.

La regola confermata dall'utente è **due movimenti oppure un movimento e un'interazione**. Il budget è condiviso fra la mappa principale e quelle locali. Aprire e chiudere la vista, ispezionare il punto attuale o ricaricare la pagina non consuma né restituisce azioni. Raggiungere un punto generico non avvia automaticamente un'attività. Le attività esistenti sono nel pannello dedicato e chiudono il turno quando vengono eseguite.

## Verifica automatica

La suite completa supera **850/850 test in 63 file**, includendo 35 controlli dei dati delle mappe, adiacenze e percorsi inversi, budget di due movimenti, impossibilità di un terzo, consumo condiviso fra viste, conservazione delle posizioni dei due giocatori, vecchi salvataggi e passaggio al giocatore già accodato senza saltarne il turno. TypeScript e build di produzione completati con successo.

I controlli dei dati confrontano i centri dei nodi con i pixel rossi dei PNG originali, verificano identificativi e coordinate, estremi e unicità delle strade, assenza di collegamenti che saltino un altro pallino e raggiungibilità. Le reti sono state confrontate visivamente con tutte le immagini, con una seconda lettura delle strade sovrapposte e ingrandimenti dei ponti e dei bivi.

## Prove nel browser

- Caricamento di tutte le 16 mappe con immagini effettivamente disponibili, pallini selezionabili e due avatar negli scenari in cui i giocatori sono nello stesso luogo.
- Cagliari: G1 percorre n4→n7→n12, budget2→1→0. Il terzo movimento è disabilitato. Ricaricare conserva n12, il punto n4 di G2 e zero azioni.
- Passaggio a G2: G1 rimane a n12; G2 parte da n4, si muove a n7 e usa il Centro Pokémon. L'interazione chiude il suo turno; il successivo passaggio riattiva G1 senza saltarlo.
- Mappa principale: due movimenti Cagliari→Percorso8→Palermo portano il budget2→1→0. Aprire Palermo rimane possibile per visualizzarlo, senza concedere un nuovo movimento. G2 rimane nella sua Cagliari e il cambio turno ne apre la vista corretta.
- Percorso 2: movimento n7→n11, poi Cespuglio A. La vera battaglia viene avviata; il turno successivo è accodato, conservando entrambi i punti locali.
- Milano: G1 e G2 percorrono indipendentemente n55→n51. Entrambi rimangono visibili anche sullo stesso pallino, con etichette separate.
- Luoghi diversi: lo scenario Venezia/Milano mostra soltanto il personaggio presente nella città; Passa turno apre il luogo del prossimo giocatore senza teletrasportarlo.
- Tastiera: Invio esegue il movimento, il pannello Attività mantiene il focus al proprio interno e Escape lo chiude riportando il focus al comando iniziale, senza spendere azioni.
- Schermo 390×640: mappa intera senza deformazioni, movimento attraverso i comandi inferiori, larghezza del documento 390 e nessuno scorrimento orizzontale. Le mappe locali usano lo spazio disponibile anche nelle finestre strette, mantenendo i comandi separati dal disegno.
- Build di produzione: Venezia aperta dal normale flusso della partita, movimento n1→n4 e ricarica conservano n4 e una sola azione residua. I log controllati della produzione non riportano errori o avvisi.

Le prove controllate usano App, store e motore originali in una pagina QA separata: i pulsanti preparano solo lo stato iniziale. La prova in produzione usa il normale salvataggio della partita. Non rappresentano una campagna completa giocata dall'inizio.

## Punti ancora da definire

Gli effetti dei pallini saranno assegnati su indicazione dell'utente. Due punti sono su strutture senza accesso stradale nel disegno: Cagliari/n16 e Foggia/n1. Restano registrati, senza inventare passaggi attraverso gli edifici; tutti gli altri 763 pallini sono raggiungibili dall'ingresso della relativa mappa.

Percorso 15 è registrato e la sua rete è pronta, ma manca un nodo e un collegamento nella mappa principale. La collocazione attende l'indicazione dell'utente. Le schermate dei luoghi senza una delle nuove immagini rimangono disponibili.

Restano i warning preesistenti della build sulle dimensioni del bundle e sui dati Browserslist. La pagina QA in sviluppo contiene inoltre i warning React già documentati della battaglia e del ricaricamento durante le modifiche. Questo aggiornamento non pubblica automaticamente una nuova versione GitHub Pages o un installer desktop.
