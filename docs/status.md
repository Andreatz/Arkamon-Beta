# Status e segnalini

Regole aggiornate il 6 ottobre 2026 e utilizzate dal motore, dalla battaglia e dal laboratorio `#battle-rules-lab`.

| Status | Risoluzione a inizio turno | Segnalino |
| --- | --- | --- |
| Paralizzato | Agisce per secondo. Un d6: 5–6 rimuove la paralisi (33,3%); 1–4 la mantiene senza impedire l'attacco. Quando guarisce torna all'ordine del round basato su livello e moneta. | Fulmine giallo, PAR, 5–6. |
| Addormentato | Fino a tre turni di sonno. Un d6 ogni turno: 4–6 sveglia e permette di agire (50%); 1–3 salta il turno e riduce la durata. Dopo il terzo fallimento il sonno termina e si agisce dal turno successivo. | Luna e Zzz azzurre, turni rimanenti. |
| Avvelenato | Danno fisso senza dado: primo turno 10% degli HP massimi, secondo 20%, terzo 30%, ecc. Arrotondamento per difetto, minimo 1 HP; HP limitati a zero. | Goccia viola con teschio, PSN, percentuale del prossimo turno. |

La paralisi usa il recupero 5–6 scelto dall'utente: due risultati su sei. Il 25% inizialmente proposto non è rappresentabile con un singolo d6 uniforme.

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

Aprire `#battle-rules-lab` permette di provare i veri d6 di paralisi e sonno e far avanzare il veleno su una dimostrazione separata con 100 HP. Le prove non cambiano la partita. «Reimposta» ripristina lo status iniziale e il contatore.
