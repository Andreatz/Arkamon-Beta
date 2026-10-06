# Status e segnalini

Regole aggiornate il 6 ottobre 2026 e utilizzate dal motore, dalla battaglia e dal laboratorio `#battle-rules-lab`.

| Status | Risoluzione a inizio turno | Segnalino |
| --- | --- | --- |
| Paralizzato | Agisce per secondo. Prima di un attacco tira un d6: 1–2 impedisce l'attacco e consuma il turno; 3–6 permette l'attacco (66,7%). In entrambi i casi la paralisi rimane. Guarisce soltanto con una cura. | Fulmine giallo, PAR, 3–6. |
| Addormentato | Il primo turno si dorme sempre, senza dado. Dal secondo turno un d6: 4–6 sveglia e permette di agire (50%); 1–3 salta il turno e riduce la durata. Si saltano al massimo tre turni, incluso il primo obbligatorio; dopo il terzo turno di sonno si agisce dal turno successivo. | Luna e Zzz azzurre, turni rimanenti. |
| Avvelenato | Danno fisso senza dado: primo turno 10% degli HP massimi, secondo 20%, terzo 30%, ecc. Arrotondamento per difetto, minimo 1 HP; HP limitati a zero. | Goccia viola con teschio, PSN, percentuale del prossimo turno. |

Il dado della paralisi verifica la possibilità di attaccare, non la guarigione. Le cure e le azioni non offensive, come l'uso della Masterball, non richiedono questo dado. La paralisi resta anche dopo una sostituzione, un salvataggio o la fine della battaglia; dopo una cura torna l'ordine del round basato su livello e moneta. Queste regole sostituiscono la precedente guarigione casuale con 5–6.

Le mosse di cura HP disponibili (Assorbilinfa, Risveglio verde, Respiro profondo e Tocco di pace) rimuovono anche paralisi e veleno, compresi i casi con HP già pieni. Il Centro Pokémon e la cura completa eliminano gli status. Al momento l'inventario giocabile contiene solo la Masterball: non è stato aggiunto un nuovo oggetto curativo. Il sonno continua a impedire anche le azioni non offensive durante i turni saltati.

Il sonno appena applicato ha tre turni rimanenti: il primo passaggio obbligatorio lo porta a due senza consumare un dado. Un salvataggio con due o un turno rimanente riprende dai tentativi di risveglio, senza ripetere il primo turno.

Il veleno usa un contatore per istanza (`stato.turniTrascorsi`), conservato nel salvataggio della battaglia. Un vecchio avvelenamento senza contatore parte dal 10%. Applicare nuovamente il veleno dopo una cura riparte dal 10%; un Pokémon KO non accumula altri tick. I segnalini sono SVG e testo leggibile, con descrizione accessibile e regola completa al passaggio del puntatore. Compaiono accanto alle barre HP di entrambi i lati e nel laboratorio.

Esempio con 100 HP massimi: 100→90→70→40→0, con perdite di 10, 20, 30 e 40 HP. Con 19 HP massimi: 19→18→15→10, con perdite di 1, 3 e 5 HP. Il segnalino mostra il prossimo tick: dopo il primo danno indica 20%.

## Mosse giocabili

Le mosse di veleno e sonno già presenti mantengono il loro attacco e applicano lo status secondo le regole esistenti. Le nove mosse di paralisi già nominate nel catalogo sono ora giocabili nei terzi slot liberi:

| Mossa | Arkamon |
| --- | --- |
| Furia Ionica | Vyrath, specie 3 e 4 |
| Impatto Voltaico | Ampereel |
| Impatto Statico | Grimbolt |
| Barriera elettrica | Shrody |
| Papille Paralizzanti | Lickard |
| Folgorazione | Weedrug |
| Stasi Elettrica | Felvex |
| Catene rigide | Trippix |
| Torpore Artico | Peek-a-buu |

Queste nove mosse applicano solo lo status: zero danni, nessun tiro offensivo e nessun minimo di danno. Il pulsante le identifica come «Status». Non sono selezionabili come Mossa Suprema. Un Arkamon può avere un solo status; uno status già presente impedisce di aggiungerne un altro. I VFX delle mosse pure di paralisi sono classificati come status.

## Laboratorio

Aprire `#battle-rules-lab` permette di provare il d6 della paralisi, curarla anche a HP pieni, verificare il primo turno obbligatorio del sonno e i successivi d6 di risveglio, e far avanzare il veleno su una dimostrazione separata con 100 HP. Le prove non cambiano la partita. «Reimposta» ripristina lo status iniziale e il contatore.
