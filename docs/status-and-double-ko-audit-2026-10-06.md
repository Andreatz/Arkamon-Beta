# Verifica status e doppio KO — 6 ottobre 2026

Questo aggiornamento completa le regole degli status e modifica la sequenza della Mossa Suprema secondo la scelta dell'utente. La suite completa supera **774 test in 60 file**; TypeScript e build di produzione completati con successo.

## Doppio KO

Il bersaglio riceve prima il danno dell'attacco. Se va KO, l'attaccante riceve XP e sale di livello conservando gli HP correnti. Il contraccolpo viene poi ricalcolato sul massimo del nuovo livello. Il KO per contraccolpo non cancella gli XP già ricevuti e non premia anche il bersaglio sconfitto.

Prova discriminante nel browser: Vyrath livello14 con13/25HP usa Suprema→Soffio su Wormaren livello5 con1HP. I dadi restano casuali; il danno minimo reale della Suprema è sufficiente per il KO del bersaglio. Vyrath sale al livello15 senza cura e il massimo diventa27; il costo passa da12 a13HP, portandolo a0. Questo distingue l'ordine richiesto dall'applicazione del costo prima del livello, che lo avrebbe lasciato a1HP.

| Scenario PvP provato | Risultato osservato |
| --- | --- |
| A attaccante, entrambi ultimi Arkamon | A livello15 HP0; vittoria A; una evoluzione A in coda. |
| B attaccante, entrambi ultimi Arkamon | B livello15 HP0; vittoria B, quindi sconfitta nella vista di A; nessuna evoluzione B nella coda A. |
| A attaccante, solo B ha una riserva | A mantiene livello15 HP0; la squadra B vince grazie alla riserva Darklaw HP9. |
| B attaccante, solo A ha una riserva | B mantiene livello15 HP0; la squadra A vince grazie alla riserva Darklaw HP9. |
| A attaccante, entrambe le squadre hanno riserve | B sostituito con Darklaw HP9; dialogo di cambio per A. Dopo la scelta, un solo passaggio A→B. |
| B attaccante, entrambe le squadre hanno riserve | B sostituito con Darklaw HP9; dialogo di cambio per A. Dopo la scelta, un solo passaggio B→A. |

Ricaricare i risultati terminali A/B conserva HP0, livello15 ed esito, senza nuovo XP o secondo contraccolpo. Ricaricare il cambio obbligato conserva il dialogo e la coda evoluzioni. Prosegui dopo la vittoria di A salva livello15 HP0 nella squadra; l'evoluzione confermata cambia la specie1→2 mantenendo HP0 e torna al percorso.

Gli XP di B sono conservati nel checkpoint della battaglia. Il Rivale PvP ha una propria squadra temporanea: questa progressione non viene assegnata al giocatore2 e l'evoluzione di B non viene inserita nella coda del giocatore A.

## Status e segnalini

Barriera elettrica, terza mossa reale di Shrody, applica Paralizzato a Wormaren mantenendo HP64. La mossa non infligge danno e non presenta un tiro offensivo. Nove mosse di paralisi preesistenti nel catalogo entrano negli slot liberi dei loro proprietari; i primi due attacchi restano conservati.

Nel laboratorio della build di produzione, il veleno su100HP dà100→90→70→40→0. I messaggi riportano perdite10/20/30/40HP e il segnalino indica il prossimo incremento. Reimposta torna a100HP e10%. I veri dadi provati hanno dato4 per il sonno (risveglio) e1 per la paralisi (status conservato); le soglie mostrate sono rispettivamente4–6 e5–6.

Nella battaglia PvP reale, Vyrath livello10 con19HP massimi passa19→18→15→10, con contatori1→2→3 e segnalino del prossimo danno20%→30%→40%. Tra le azioni, l'avversario usa Furia Ionica: lo status singolo impedisce una seconda alterazione e la mossa pura non sottrae HP, isolando il danno del veleno. Ricaricare dopo il terzo turno conserva10HP, contatore3, prossimo danno40% e passaggio al Rivale.

I segnalini SVG giallo, azzurro e viola compaiono nella battaglia per entrambi i lati e nel laboratorio, con testo e descrizioni accessibili. Il laboratorio su390×640 non produce scorrimento orizzontale.

## Ambito e limiti

Le prove di battaglia usano l'App e il motore reali su una pagina locale separata: i pulsanti preparano solo lo stato iniziale, senza sostituire RNG, tiri o risultati d'attacco. Le prove non rappresentano una campagna completa giocata dall'inizio. Il laboratorio di100HP è una dimostrazione esplicita e non cambia la partita.

La build conserva i warning già presenti sulle dimensioni del bundle e sui dati Browserslist. Nella pagina di sviluppo è presente il warning React già documentato sui ref delle transizioni degli sprite; le azioni provate si completano. Questo aggiornamento viene salvato nel branch di lavoro e nell'anteprima locale; non pubblica automaticamente una versione GitHub Pages o un installer desktop.
