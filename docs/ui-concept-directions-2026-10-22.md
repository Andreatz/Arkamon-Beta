# Cinque direzioni per i menù di Arkamon

La nuova proposta sospende temporaneamente gli SVG decorativi dei menù e ricostruisce pannelli, controlli, selezioni e navigazione con CSS. Gli asset originali restano nel progetto. Le immagini ufficiali degli Arkamon e le animazioni native restano separate dal restyling.

## Confronto locale

Con il server locale sulla porta 3054, aprire `http://127.0.0.1:3054/?uiConcepts=1`.

La galleria permette di confrontare cinque stili e sei schermate reali: Squadra, Borsa, Menù partita, Deposito, Arkadex e Analisi. Il collegamento «Apri a pieno schermo» mostra il concept scelto su tutta la finestra. I controlli interni delle schermate funzionano; ogni cambio dalla barra esterna carica una nuova anteprima dimostrativa isolata.

| Stile | Direzione | Composizione |
| --- | --- | --- |
| Eclisse | Grafite, bronzo, titoli serif, luce morbida | Navigazione laterale, ritratto e comandi su tre colonne |
| Atlante | Carta chiara, petrolio, gerarchia editoriale | Indice orizzontale; Borsa su inventario, dettaglio e utilizzo affiancati |
| Impulso | Viola scuro, lime, Norwester, geometrie nette | Navigazione segmentata in alto, pannelli tattici e selezioni ad alto contrasto |
| Taccuino | Carta calda, verde bosco, terracotta, titoli corsivi | Diario a due pagine, indice laterale e azioni nella pagina destra |
| Prisma | Azzurro, bianco, blu e corallo, forme arrotondate | Navigazione in basso e pannelli ampi con comandi a pillola |

Le differenze comprendono composizione, tipografia, bordi, selezioni, densità e navigazione. La logica dei componenti è condivisa per mantenere coerenti le regole della partita.

## Applicazione e reversibilità

- `src/player-ui/uiAppearancePolicy.ts` contiene la policy temporanea `MENU_SVG_ARTWORK_ENABLED = false`.
- La partita locale usa Eclisse come proposta iniziale. Il parametro `uiConcept` permette di confrontare gli altri stili; non costituisce una preferenza persistente o una scelta definitiva di pubblicazione.
- Impostando la policy a `true` tornano i componenti con artwork originale e il root non riceve gli override dei concept.
- Le personalizzazioni Studio salvate non sovrascrivono i menù concept nel gioco normale. Lo Studio mantiene il proprio percorso di editing e continua a operare sulle altre scene.
- Non sono stati cancellati asset SVG e non sono stati modificati i cataloghi delle animazioni.

## Dati e funzioni

La galleria e le sue anteprime usano storage volatile per campagna e preferenze. Il ripristino dei backup e l'avvio/uscita delle sfide mostrano un messaggio nell'anteprima senza scrivere i salvataggi reali. Anche journal, checkpoint e copie automatiche sono isolati. La partita normale conserva persistenza e regole precedenti.

Il Negozio mantiene l'accesso tramite l'interazione autorizzata sulla mappa: non è una destinazione libera aggiunta alla navigazione del giocatore.

## Verifica ripetibile

- `e2e/ui-concepts.config.ts` / `e2e/ui-concepts.spec.ts`: cinque concept sui sei schermi, desktop e telefono, controllo del formato 1366×768, assenza di SVG decorativi, PNG caricati, assenza di sovrapposizioni, selezione degli oggetti e conservazione dei salvataggi/preferenze reali.
- `e2e/player-ui-integration.spec.ts`: percorso normale della partita, accessibilità, scambi persistiti, vincoli di livello, cura, consumo oggetti/turno, acquisti e accesso al negozio.
- `src/save/previewRestoreIsolation.test.ts` e `src/settings/previewPreferences.test.ts`: isolamento dei percorsi di persistenza diretti e delle preferenze dimostrative.
- Screenshot generati in `output/ui-concepts/screenshots/`, esclusi dal controllo versione. I file `<stile>-desktop-squadra.png`, `<stile>-desktop-borsa.png` e `<stile>-desktop-partita.png` documentano le principali viste reali.

La proposta è locale e confrontabile; non è stata pubblicata come nuovo stile definitivo.

## Risultati del 22 ottobre 2026

- 12 scenari della galleria/concept superati, sui due formati; ogni stile attraversa i sei schermi e il desktop include il controllo 1366×768 senza scorrimento del contenuto principale.
- Coperti tutti i 18 scenari di integrazione della partita. Dopo le correzioni di contrasto, i due scenari di navigazione/accessibilità sono stati ripetuti e superati; i flussi operativi già verdi non sono stati ripetuti senza motivo.
- Nessuna violazione di contrasto rilevata da Axe su Atlante, Impulso, Taccuino e Prisma per Squadra/Borsa/Menù partita (12 combinazioni). Eclisse è incluso nel controllo Axe completo sui sei schermi della partita, desktop e telefono.
- 4.085 test unitari coperti: 4.082 superati nella suite completa; tre test di generazione delle squadre hanno superato il limite di tempo durante le verifiche concorrenti. I due file interessati sono stati ripetuti isolatamente senza modificare i timeout: tutti i loro 57 test sono superati.
- Build di produzione completata. Catalogo delle 455 clip native e release media esistente conservati.
- Cinque screenshot finali della Squadra ricatturati dal server locale, con PNG e font caricati e nessun errore JavaScript.

Le verifiche automatiche di contrasto non sostituiscono il giudizio visivo su sfumature e glifi decorativi. Le catture e la galleria permettono di valutare direttamente ciascuna direzione.
