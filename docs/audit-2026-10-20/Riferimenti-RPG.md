# Direzione UI RPG per Arkamon: fonti verificate e pattern trasferibili

> Archivio del 20 ottobre 2026: **Ricerca visiva con provenienza documentata**. Origine nella cartella della sessione: `work/rpg-references.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Rapporto ricostruito il **20 ottobre 2026** dalla cronologia effettiva di questo stesso task, dopo il ripristino del runtime e la perdita dei precedenti file locali. Non è un documento derivato dalla memoria persistente. Le osservazioni originali sono del **19 ottobre 2026**. Tutte e otto le fonti sono state riaperte e osservate nel browser del runtime attuale il 20 ottobre 2026.

## Provenienza e confine della verifica

- Il 19 ottobre sono state aperte e osservate **otto immagini singole ingrandite** in Game UI Database, da quattro giochi. Il crawler web era bloccato, il browser IAB era fruibile. Le immagini sono state viste, non inferite soltanto dalle etichette.
- Il 20 ottobre il browser callable è Opera via `mcp__cua_repl.js`. Tutte e otto le fonti sono state riaperte e osservate nuovamente tramite screenshot della galleria, oltre a leggere il contenuto DOM. Le fonti sono quindi verificate anche nella sessione corrente.
- Nessun asset è stato scaricato, copiato, modificato o usato per generazione. La ricerca riguarda composizione, gerarchia e interazione. Il sito espone un divieto di AI asset generation: non usare gli screenshot come input per generare asset.
- Il checkout corrente è stato verificato: **ea4dcab344cf4030757b4c9bb00f4890b4421be4**. I sette file dei laboratori sono stati riletti nel runtime attuale. La ricerca di reference resta distinta dall'audit locale e **non dimostra quali pattern siano assenti da Arkamon**.
- Solo immagini statiche. Nessuna misurazione di motion originale o ascolto. I timing proposti qui sono scelte progettuali da validare, non dati dei giochi citati.
- Octopath Traveler II non compariva nella ricerca interna effettuata; la reference verificata è il primo episodio del 2018. Persona 3 Reload è stato ispezionato; Persona 5 Royal no.
- I vecchi screenshot locali dei laboratori sono andati persi col runtime; non presentarli come deliverable attuale o nuova prova del checkout corrente.

## Otto fonti visive realmente osservate

| Fonte | Categoria e contenuto visto | Principio utile | Limite/errore da evitare |
|---|---|---|---|
| [Octopath Traveler58/74](https://www.gameuidatabase.com/gameData.php?id=741&autoload=31192) | Item/Ability: Selection Menu. Arena dominante, menu vicino al personaggio attivo, sequenza turni sopra, risorse stabili, dettaglio della selezione | Azione e contesto nella stessa zona d'attenzione | Testi troppo piccoli per proiezione/browser condiviso; non importare sistemi di vulnerabilità non previsti |
| [Octopath Traveler28/74](https://www.gameuidatabase.com/gameData.php?id=741&autoload=31151) | Player Menus. Categorie a sinistra, mappa centrale, riepilogo squadra a destra, fascia comandi inferiore | Struttura ripetibile fra sezioni e persistenza del contesto | Non introdurre mappa ornamentale o dieci destinazioni per imitare il gioco |
| [Persona 3 Reload38/96](https://www.gameuidatabase.com/gameData.php?id=1884&autoload=75791) | Player Menus. Illustrazione dominante, blu/ciano, voce attiva bianco/rosso, diagonali, squadra sul margine | Identità forte e selezione riconoscibile | Testi inclinati e distorti sono poco adatti a parametri, formule e regolazioni GM |
| [Persona 3 Reload, HUD combattimento](https://www.gameuidatabase.com/gameData.php?id=1884&autoload=75765) | Cross Menu/Enemy Health. Attore contornato, mirino sul bersaglio, comandi vicini all'attore, squadra fissa sul lato | Distinguere attore, bersaglio, scelta e conseguenza spazialmente | Croce gamepad poco adatta al mouse; troppi contorni luminosi competono col VFX |
| [Sea of Stars 26/29](https://www.gameuidatabase.com/gameData.php?id=2196&autoload=92245) | Selection Menu. Arena pixel art, menu compatto, risorse raggruppate, indicatori vicini agli avversari, pannelli blu sobri | Scena protagonista e UI di supporto | Icone/contatori senza spiegazione richiedono apprendimento; pubblico e GM devono capirli |
| [Sea of Stars 15/29](https://www.gameuidatabase.com/gameData.php?id=2196&autoload=92242) | Overview/Equipment. Ritratto, configurazione e statistiche in tre colonne, descrizione separata, separatori sottili | Identità→configurazione→conseguenza, con spazio prima dei bordi | Non trasformare ogni campo in una card incorniciata; fonte riaperta nel runtime20ott |
| [Pokémon Legends: Arceus48/130](https://www.gameuidatabase.com/gameData.php?id=1372&autoload=54065) | Summary/Moves. Nome e livello sopra, sottopagine, mosse allineate con tipo/PP, modello grande a destra | Dati confrontabili e spazio autentico al Pokémon | Tab solo iconiche poco scopribili sul web; non richiedere 3D per forza |
| [Pokémon Legends: Arceus108/130](https://www.gameuidatabase.com/gameData.php?id=1372&autoload=54070) | Selection Menu. Mossa selezionata, potenza/precisione/efficacia accanto, ordine azioni separato, risorse vicino ai partecipanti | Mostrare l'effetto prevedibile prima della conferma | Non rendere certe previsioni che dipendono da D6 o GM |

## Sette pattern per Arkamon

### 1. Arena prima, regolazioni dopo

Base visiva: Sea of Stars 26 e Octopath 58. Nel combattimento il protagonista deve essere il rapporto fra due Arkamon, fondale e azione. Le schede, il D6 e l'ultimo esito devono restare leggibili, con pannelli limitati allo spazio necessario. Il pubblico deve riconoscere fase, attore e bersaglio anche senza leggere lo storico completo.

**Applicazione:** mantenere l'arena ampia; collegare al soggetto la selezione e lo stato. Il GM può aprire regolazioni contestuali senza imporre la stessa densità alla vista pubblica. Verificare scala degli sprite, piano di appoggio, ombre di contatto e colore ambientale: spesso rendono la scena più credibile di nuove particelle.

**Criterio:** a 1440×900 e in proiezione un osservatore identifica in pochi secondi chi agisce e quale risorsa è cambiata. La misura esatta va provata nella build reale.

### 2. Un'identità, tre densità di informazione

Base: Octopath 28, Persona 38. Distinguere **pubblico**, **giocatore**, **GM/laboratori** per quantità e posizione delle informazioni. La vista pubblica comunica lo spettacolo; il giocatore decide; il GM prepara e corregge. Una nuova funzione deve sembrare parte dello stesso gioco.

**Applicazione:** consolidare i componenti già esistenti: stessi caratteri, superfici, badge, focus, bordi e ritmo dello spazio. Evitare palette o cornici radicalmente diverse a ogni sezione. La teatralità di Persona funziona per Home, ingresso, turno decisivo e vittoria; le impostazioni richiedono una gerarchia più calma.

**Criterio:** gli stessi concetti hanno identici nomi, icone e significati nelle sette viste strumenti e nei laboratori. Non presentare questo come assenza nel progetto: è una strategia di coerenza e rifinitura da confrontare col risultato effettivo.

### 3. Lista, identità e ispettore con ruoli stabili

Base: Pokémon 48 e Sea of Stars 15. Dare a ogni regione una funzione: lista confrontabile, identità/asset, dettaglio con conseguenze. La scheda Pokémon dovrebbe riusare la stessa grammatica fra squadra, deposito, Arkadex e analisi.

**Applicazione:** preservare selezione, filtri, pagina e scroll tornando dal dettaglio. Tab con etichette; icone per riconoscimento rapido, non come unico accesso. Su stretto l'ispettore diventa una vista o drawer con ritorno esplicito.

**Criterio:** il passaggio Squadra→Analisi→ritorno non costringe a ritrovare l'esemplare; tutte le righe di mossa allineano le stesse proprietà adattate alle regole di Arkamon.

### 4. Anteprima della conseguenza prima di confermare

Base: Pokémon 108. Una scelta ha più valore quando il giocatore vede cosa produce. In Arkamon ciò significa esplicitare «mossa→D6 richiesto→modificatori→bersaglio→effetto noto». Le parti dipendenti dal tiro o dal GM devono essere segnalate senza inventare percentuali.

**Applicazione:** nel combattimento mostrare l'anteprima essenziale. Nei laboratori visualizzare chiaramente prima/dopo e differenza dal riferimento; il controllo modificato deve rendere evidente quando la preview non è ancora stata ricalcolata o riprodotta.

**Criterio:** nessun vecchio esito sembra rappresentare una configurazione nuova. Le azioni irreversibili richiedono una descrizione concreta della conseguenza.

### 5. Movimento causale e ritmo, con riposo calmo

Base statica: Persona 89 e Sea of Stars 26 mostrano una separazione leggibile di ruoli; la motion proposta per Arkamon la deve conservare. Sequenza leggibile: anticipazione→azione→VFX→impatto→valore/status→assestamento. Il risultato persiste più a lungo del lampo.

**Applicazione:** una timeline condivisa per presentazione, con velocità normale/rapida, skip della sola presentazione, riduzione del movimento e cancellazione al cambio scena. Il registro autorevole decide l'esito; il replay non deve rilanciare D6 o applicare danni. Budget comune per blur, glow, shake e particelle.

**Timing iniziali proposti:** feedback 100–150ms; pannello 180–240ms; pagina 220–300ms; turno 250–400ms; D6 500–900ms; evento raro 700–1400ms prima di eventuale proseguimento. Valori da validare, non copiati dai giochi.

**Criterio:** a velocità normale si capisce l'evento senza rallentatore; movimento ridotto conserva tutta l'informazione con contrasto/opacità, senza shake/zoom/flash ripetuti.

### 6. Laboratori come banco di regia, con un flusso comune

Base: Sea of Stars 15 e principio dell'ispettore. Le funzioni tecniche hanno bisogno di densità ma anche di un ordine coerente: **scegli→configura→anteprima→confronta→conserva**. La preview dovrebbe usare lo stesso renderer della partita.

**Applicazione:** riutilizzare shell, descrizioni e controlli fra sette laboratori e Admin. Preset frequenti subito, avanzate espandibili, ricerca e filtri persistenti, stato «bozza/applicato» chiaro, reset locale visibile. Riferimento e candidato mantengono stessa scala e fondale per confronti validi. Le etichette tecniche dei file restano disponibili come dettaglio.

**Criterio:** il GM completa un caso reale senza attraversare impostazioni non pertinenti e sa sempre se la prova modifica la partita. Questo punto deve potenziare gli strumenti esistenti, non sostituirli con mockup.

### 7. Una gerarchia grafica verificabile, non decorazione cumulativa

Base: Persona 38 per contrasto selettivo, Sea of Stars 15 per separatori sobri, Pokémon 48 per spazio all'identità.

**Applicazione:** un accento di navigazione, colori dei tipi riservati al significato, superfici a pochi livelli, carattere caratteristico per titoli ed eventi e carattere leggibile per dati. Cifre tabulari per barre, turni e tiri. Stati distinti di hover/focus/selezionato/disabilitato/caricamento/errore. Preferire spazio e allineamento prima di aggiungere bordi, gradienti, ombre e bagliori alla stessa card.

**Criterio:** le informazioni importanti dominano anche senza VFX; non si deve dover leggere ogni bordo per sapere dove cliccare. Tastiera e touch hanno stati comprensibili quanto il mouse.

## Piano operativo di adozione

1. **Matrice della build reale:** schermate, stati, componenti esistenti e incongruenze. Separare implementato, difetto visto e proposta. Nessuna conclusione di assenza basata solo sulle reference.
2. **Una schermata rappresentativa:** rifinire gestione squadra/ispettore usando token e componenti condivisi già presenti; validare dimensioni e densità prima di propagarli.
3. **Una battaglia completa:** ingresso, scelta, bersaglio, D6, impatto, cambio turno, risultato. Catture e video/serie di frame a velocità normale; esiti autorevoli invariati.
4. **Propagazione nelle sette viste strumenti:** navigazione e schede coerenti, ritorni e selezioni conservati, stati vuoti/errori realmente utilizzabili.
5. **GM e laboratori:** flusso comune, preset chiari, preview affidabili, confronto e distinzione bozza/applicato. Rimuovere duplicazioni di presentazione, mantenere strumenti utili.
6. **Audit di ogni stato raggiungibile:** desktop ampio, finestra stretta/touch, proiezione, testi lunghi, sessione lunga, cataloghi pieni, movimento ridotto e prestazioni. Una build riuscita o una Home vista non equivalgono a copertura completa.

La direzione proposta è **arena scenica, dati ordinati, enfasi selettiva**. Il guadagno maggiore viene da composizione, coerenza e causalità; la quantità di effetti arriva dopo.
