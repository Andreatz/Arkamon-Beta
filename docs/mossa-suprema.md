# Mossa Suprema

Il pulsante **Mossa Suprema** è disponibile per il Pokémon del giocatore e per l'avversario controllato da una persona nelle battaglie PvP, compresi Rivale e Capipalestra. Premendolo si apre la scelta dell'attacco da potenziare. Le mosse di cura sono escluse.

La scelta non consuma il turno né HP. **Annulla** o **Escape** torna alle azioni normali; dopo una ricarica si riprende il controllo stabile della battaglia senza un'attivazione pendente.

## Regola

1. Risolvi lo stato a inizio turno. Se il Pokémon non può agire o va KO prima dell'attacco, la Suprema non viene eseguita e il suo costo non viene applicato.
2. Calcola l'attacco scelto con i suoi dadi, bonus, efficacia di tipo, arrotondamento e minimo ordinari.
3. Infliggi **due volte il danno finale ordinario** al bersaglio.
4. L'attaccante subisce un contraccolpo di **50% degli HP massimi**, arrotondato per difetto e con minimo 1 HP. Gli HP residui non scendono sotto zero.
5. Risolvi KO, sostituzioni, XP e passaggio del turno attraverso il flusso normale della battaglia.

Con 19 HP massimi il costo è 9 HP, anche se il Pokémon parte da 5 HP: l'attacco viene eseguito e poi il contraccolpo lo porta a zero. Con un danno ordinario di 7, la Suprema infligge 14. Le mosse già marcate `SUPREMA` nel catalogo ricevono un solo raddoppio e un solo contraccolpo quando viene usato il comando.

Le azioni umane normali non attivano implicitamente la Suprema: occorre il pulsante dedicato. L'IA conserva la gestione delle mosse del catalogo già classificate Supreme, con lo stesso costo fisso del 50%.

Non è introdotto un limite di un uso per battaglia o un requisito di HP residui superiori al costo. La Suprema può causare il KO di chi la usa. Il KO dell'avversario PvP non conclude lo scontro se rimangono riserve vive.

## Interfaccia e salvataggi

Le aree `playerSupreme` ed `enemySupreme` del tema sono modificabili dall'Admin. I vecchi temi ricevono le nuove aree conservando colori, posizioni e regolazioni esistenti.

La finestra di scelta mostra il costo effettivo, consente navigazione con Tab e Shift+Tab, mantiene il focus al suo interno e libera lo sfondo prima di aprire un eventuale dado di stato. Le sequenze di danno e contraccolpo usano i checkpoint stabili già presenti.

## Verifica del 6 ottobre 2026

La suite completa supera **737 test in 58 file**. I test della Suprema usano mosse reali e verificano danno ordinario ×2 dopo arrotondamento, resistenza, HP massimi dispari, costo indipendente dagli HP correnti, assenza di accumulo ×4, esclusione delle cure e conservazione degli effetti offensivi. Due test del tema verificano importazione e caricamento di configurazioni precedenti prive dei nuovi pulsanti. TypeScript e build di produzione sono completati con successo.

Prove nel browser con App e motore reali, in scenari iniziali locali senza sostituire i dadi:

- Suprema di A: Vyrath 19→10 HP; Wormaren avversario 64→56 HP. Ricarica conserva HP e turno B.
- Suprema di B PvP: Vyrath 19→10 HP; Wormaren giocatore 64→48 HP. Ricarica conserva HP e passaggio al giocatore.
- Contraccolpo con KO di A: Vyrath 5→0 HP, bersaglio 64→44 HP; dialogo di sostituzione conservato dopo ricarica e Darklaw entra con 9 HP.
- Contraccolpo con KO di B in PvP senza allenatore: Vyrath 5→0 HP, Darklaw di riserva entra con 9 HP; la battaglia continua e il giocatore conserva 44 HP dopo XP e salita al livello 41.
- Sonno, dado 3: azione persa, A rimane a 19 HP e B a 12 HP; nessun contraccolpo della Suprema.
- Annullamento, Escape, Tab e Shift+Tab verificati. Schermo 390×640 e finestra 1280×480: pulsanti raggiungibili, titolo leggibile e controllo audio separato dall'azione.

Nella build di produzione, la sfida al Rivale è raggiunta attraverso mappa e percorso della partita di prova. Il giocatore usa Suprema → Sotterrare: Wormaren 13→7 HP e Felyss 12→8 HP. Il Rivale usa poi Suprema → Sussurro: Wormaren 7→1 HP e Felyss 8→2 HP. Il contraccolpo di Felyss costa 6 HP, metà dei suoi 12 HP massimi, indipendentemente dagli 8 HP residui iniziali. Ricaricare conserva entrambi gli HP e il passaggio del controllo al giocatore. I log della build di produzione controllati non contengono errori o avvisi.

Gli scenari locali dichiarano lo stato preparato e non costituiscono una campagna giocata dall'inizio. Nel laboratorio di sviluppo compare un warning React preesistente relativo ai ref delle transizioni degli sprite; non sono stati osservati blocchi delle azioni associati a quel warning. Questo intervento non pubblica una nuova versione GitHub Pages né un installer desktop.
