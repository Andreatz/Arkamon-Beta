# Mappe locali di città e percorsi

Le immagini originali in `public/maps` restano gli sfondi delle mappe: strade e pallini non vengono ridisegnati. Una rete di punti e collegamenti sovrapposta al PNG permette ai personaggi di camminare lungo le strade, comprese curve e ponti. Le coordinate sono percentuali riferite all'immagine intera, che viene mostrata senza ritagli o deformazioni.

## Movimento e turni

Ogni turno offre **due movimenti oppure un movimento e un'interazione**. Un movimento percorre il collegamento fra due pallini consecutivi e costa un'azione. Non è possibile saltare pallini o attraversare edifici, mare e altri spazi senza strada.

Il budget è unico fra mappa principale e locale: se un giocatore si sposta da Venezia a Percorso1 sulla mappa principale, gli rimane un'azione anche dopo aver aperto il disegno del percorso. Aprire una mappa, ispezionare il proprio pallino, tornare alla mappa principale o ricaricare la pagina non restituisce azioni e non costa un'azione. Anche sulla mappa principale sono consentiti due movimenti.

«Passa turno» dà il controllo all'altro giocatore e mostra il luogo in cui si trova realmente. Se i due giocatori sono nello stesso luogo, entrambi gli avatar restano visibili; se sono in luoghi diversi, la vista segue il giocatore che riceve il turno. Non viene spostato il personaggio inattivo.

## Punti e attività

I pallini sono numerati per ciascuna mappa e hanno identificatori stabili come `n1`, `n2`. Gli effetti dei punti sono ancora da definire: raggiungere un pallino non avvia automaticamente battaglie, cure o ricompense. Ispezionare il punto corrente mostra «Interazione da definire» senza consumare azioni.

### Venezia: riferimento dell'8 ottobre 2026

La numerazione e la rete di Venezia seguono la foto «Interazioni Venezia.png» fornita dall'utente: **57 punti e 62 collegamenti bidirezionali**. I numeri sono visibili sopra i pallini e coincidono con le destinazioni nei pulsanti «Vai a Punto…». La città conserva la sua immagine originale a colori.

Sono state eliminate le sei strade assenti nel riferimento: **19–23, 33–34, 34–54, 41–57, 42–51 e 44–46**. Ad esempio, dal punto 42 si raggiungono solo 41, 43 e 57; dal 44 solo 43 e 45. La numerazione visibile è indipendente dall'ID interno: tutti gli ID e i centri dei pallini originali restano stabili, quindi i vecchi salvataggi mantengono ciascun personaggio nello stesso punto fisico. L'ingresso resta `n56`, ora etichettato **Punto 29**.

La visita conserva le due azioni condivise con la mappa principale: due movimenti, oppure un movimento e un'interazione. I punti restano generici in attesa delle attività da associare. I numeri concordati sono abilitati solo per Venezia attraverso `showNodeNumbers`.

Le curve dei percorsi 48–49, 46–48, 11–14, 30–32 e 16–21 sono state riallineate al tracciato della foto, eliminando i piccoli gomiti e tagli presenti nelle coordinate precedenti. Il movimento animato percorre questi vertici negli stessi due sensi.

Due pallini si trovano sopra strutture senza un accesso disegnato: il punto16 di Cagliari e il punto1 di Foggia. Restano registrati e potranno ricevere un'interazione, ma non hanno una strada di movimento: collegarli adesso richiederebbe attraversare gli edifici.

I cespugli, gli allenatori e il Centro Pokémon già giocabili restano nel pannello «Attività». Avviare un'attività disponibile conclude il turno; il giocatore corrente resta in controllo per completare la battaglia o la cura, poi il passaggio attiva il prossimo giocatore già accodato. Queste attività non sono ancora associate a specifici pallini del disegno.

I pulsanti «Vai a Punto…» duplicano i collegamenti disponibili per rendere il movimento accessibile anche su schermi piccoli. I punti sono utilizzabili anche tramite Tab e Invio. Le animazioni seguono i vertici della strada in entrambe le direzioni; due movimenti rapidi vengono mostrati in sequenza. Le preferenze di movimento ridotto vengono rispettate.

## Dati e salvataggi

`src/data/localMaps.ts` contiene immagini, centri dei pallini, ingresso e collegamenti. Le strade includono solo i vertici intermedi: gli estremi sono i nodi. `src/engine/localMapMovement.ts` calcola adiacenze e percorsi senza dipendere dalla UI.

Lo store conserva `posizioniLocali1` e `posizioniLocali2`, indicizzate per luogo. Queste posizioni non sostituiscono il nodo dei personaggi sulla mappa principale. I vecchi salvataggi vengono accettati senza posizioni locali; un riferimento non valido torna al punto d'ingresso della mappa.

`Reggio-Calabria.png` corrisponde al luogo di gioco `ReggioCalabria`. `Percorso_15.png` è registrato come mappa locale, ma il mondo attuale non contiene ancora un nodo Percorso15 o una strada per raggiungerlo: occorre definire dove collegarlo prima che possa essere raggiunto nella partita normale. I luoghi senza una delle nuove immagini conservano la schermata preesistente.
