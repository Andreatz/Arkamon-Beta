# Sprite dei dadi in battaglia

Il pannello dei risultati usa le sei varianti DiceMaster già presenti in
`public/vfx/generated/EffectPL.img_DiceMaster.images_nested/DiceRoll/`.
`battleDiceAssets.ts` associa i risultati del motore, da 1 a 6, ai rispettivi
asset del catalogo generato. Non modificare `generatedVfxAssets.ts` a mano.

## Sequenza

- Il primo sheet contiene i 16 frame comuni del lancio, indici 0–15.
- Il risultato 1 usa poi i frame 16–21 dello stesso sheet.
- I risultati 2–6 usano i frame 0–5 del rispettivo sheet.
- Tutti i segmenti sono riprodotti a 24 FPS: circa 917 ms più il passaggio tra
  segmenti. L'ultimo frame rimane visibile fino alla chiusura del pannello.

Le immagini hanno trasparenza RGBA reale. Il pannello usa la composizione
normale, senza anchor, offset amministrativi o specchiatura dell'avversario.
I dadi partono insieme. La griglia adatta dimensioni e colonne al numero di
dadi e alla larghezza disponibile.

La rappresentazione non genera numeri casuali: usa esclusivamente
`RisultatoMossa.tiriDado`. Danno e incrementi restano quelli del motore.
La barra salute conserva il valore precedente durante la mossa e il VFX.
Quando tutti i dadi hanno mostrato il primo fotogramma del proprio risultato
e il pannello ha completato l'ingresso, un passaggio di disegno sblocca insieme
il calo della barra e la scritta "Danno finale". I due secondi di permanenza
del pannello iniziano da questa comparsa effettiva, così un'immagine lenta non
fa sparire i dadi prima che siano leggibili. Lo stato risolto del Pokémon può
già avviare il KO all'impatto: soltanto gli HP mostrati restano in attesa.
Le immagini vengono precaricate entrando in battaglia. Se un caricamento
fallisce, compare il valore numerico senza interrompere l'azione. Con movimento
ridotto viene mostrato direttamente il risultato finale, dopo il caricamento.
Il valore numerico alternativo usa lo stesso segnale di visibilità. Lanci
senza dadi e callback ripetuti o relativi a un vecchio lancio non bloccano il turno.

## Anteprima e verifica

In sviluppo aprire `http://localhost:3000/#dice-lab`. L'anteprima usa lo stesso
componente della battaglia, con risultati fissi, scelta del lato, riproduzione
e simulazione delle immagini mancanti. Non cambia la partita. Il risultato
resta visibile nell'anteprima; in battaglia il pannello si chiude 2 secondi dopo
la comparsa dei risultati.

Validazione del 3 ottobre 2026:

- 461/461 test, in 38 file, e build completa riuscita.
- Dieci nuovi test verificano mappatura, PNG reali, intervalli dei frame,
  temporizzazione, 20 risultati, somme/incrementi/danno, fallback e
  ridimensionamento degli atlas. La modalità predefinita del player VFX
  conserva le dimensioni precedenti.
- Browser: sei risultati finali corretti, intro comune, lato avversario,
  replay, 20 dadi, griglia a 390 px senza overflow orizzontale e fallback.
- Durante una mossa avversaria in una sessione di prova separata è comparso
  il pannello con il risultato del motore, mentre i comandi restavano bloccati.

L'anteprima dei dadi non produce errori di console. La sessione di battaglia
ha ancora il warning preesistente di React relativo al ref di `BattleLayoutItem`
in `AnimatePresence`; questa modifica non interviene su quel componente.
La build segnala gli avvisi preesistenti sul database Browserslist e sulla
dimensione del bundle principale.
