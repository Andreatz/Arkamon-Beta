# Ritratti del deposito e della squadra

I cerchi del deposito e della squadra usano la stessa inquadratura del viso, definita per ogni specie ed evoluzione in `src/components/deposit/depositPortraitFraming.ts`.

- `x` e `y` indicano il punto del viso da collocare al centro del cerchio, in coordinate normalizzate rispetto all'intera immagine PNG (0 = bordo sinistro/superiore, 1 = bordo destro/inferiore).
- `zoom` indica la larghezza dell'immagine rispetto al diametro interno del cerchio. Per esempio, `2` visualizza un'immagine larga il doppio del cerchio.

Il catalogo copre le 110 immagini frontali attuali. Le coordinate sono state scelte osservando gli sprite e controllando il ritaglio circolare, comprese le evoluzioni che hanno pose diverse. Per gli sprite di profilo, il punto comprende l'occhio visibile e il muso; per le creature senza un volto convenzionale comprende il tratto principale che le identifica.

`DepositView` posiziona l'immagine al centro del contenitore e la trasla in base a questo punto. L'altezza automatica mantiene le proporzioni originali, anche per immagini non quadrate. Il risultato scala con il cerchio e segue la specie quando viene spostata tra squadra e deposito.

Quando viene sostituito uno sprite con un disegno o una posa diversa, aggiornare l'entry della sua specie e verificarla nell'anteprima `#deposit-lab`. Quando viene aggiunta una nuova specie, aggiungere anche la sua inquadratura: il test di copertura segnala eventuali entry mancanti. Per ID sconosciuti il componente mostra prudentemente l'immagine centrata a scala 1; per immagini mancanti mostra l'iniziale del nome.

Queste regolazioni riguardano soltanto i ritratti del deposito e della squadra. Gli sprite originali e le impostazioni di scala della battaglia restano indipendenti.
