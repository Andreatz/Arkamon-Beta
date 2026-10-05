# Deposito con ritratti circolari

La scena utilizza il nuovo sfondo fornito dall'utente,
`public/backgrounds/deposito.png`, e riprende la composizione della schermata
di riferimento: sei ritratti squadra sulla sinistra, targhette con nome e
livello, 35 posti circolari in una griglia 7 × 5 sulla destra, barra azzurra
e pulsante di ritorno in basso. La barra riutilizza `public/ui/box_deposit.png`.
I ritratti usano gli sprite esistenti, senza applicare le scale della battaglia.

Il motore conserva 30 box. I pulsanti passano al box precedente o successivo,
con collegamento circolare tra 1 e 30. Il primo click su un posto occupato
seleziona l'Arkamon e lo evidenzia in oro; il secondo click sposta o scambia
con il posto scelto. Cliccando di nuovo sulla sorgente si annulla la selezione.
È possibile cambiare box prima di scegliere la destinazione. Nome, livello
e HP restano disponibili nelle etichette e nei tooltip; i controlli funzionano
anche con tastiera e mostrano il focus.

`DepositoScene` collega la vista condivisa `DepositView` allo store del gioco.
Il motore di scambio e la capienza restano quelli esistenti. I quattro gruppi
del layout sono ancora modificabili nell'Admin. Alla rilettura delle
preferenze, le posizioni che corrispondono al vecchio layout predefinito
vengono aggiornate; i rettangoli personalizzati e gli offset del testo vengono
conservati. La migrazione è idempotente.

In sviluppo, `http://localhost:3000/#deposit-lab` mostra la stessa vista con
gli Arkamon del riferimento. Gli spostamenti agiscono solo sui dati locali
dell'anteprima; «Ripristina anteprima» ripristina squadra, box e selezione.

Validazione del 3 ottobre 2026:

- 470/470 test in 40 file e build completa riuscita.
- Nove nuovi test sulla migrazione delle preferenze, posti e nomi accessibili,
  dati dei ritratti, squadra vuota e navigazione circolare.
- Browser: caricamento dello sfondo e dei nove ritratti, selezione e annullamento,
  deposito con compattazione della squadra, ritiro, scambio tra posti occupati,
  trasferimento dal box 1 al posto 35 del box 2, collegamento 1/30 e tastiera.
- Nessun errore di console nell'anteprima. Restano i precedenti avvisi della
  build sul database Browserslist e sulla dimensione del bundle principale.
