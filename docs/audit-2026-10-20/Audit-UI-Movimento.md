# Arkamon — audit UI, grafica, movimento e interazione

> Archivio del 20 ottobre 2026: **Snapshot iniziale UI e movimento**. Origine nella cartella della sessione: `outputs/Audit-UI-Movimento.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Analisi statica ricostruita il 20 ottobre 2026 nel checkout `C:\Users\andre\Documents\Codex\2026-10-19\https-github-com-andreatz-arkamon-beta\checkout`, HEAD verificato `ea4dcab344cf4030757b4c9bb00f4890b4421be4`. Il prodotto non è stato modificato. Questo allegato integra la revisione generale del coordinatore e l'[inventario delle schermate](./Mappa-Schermate-Laboratori.md).

**Il miglioramento con maggiore rendimento è rendere coerenti gerarchia, spazio e comportamento dei componenti esistenti.** La base contiene già cornici RPG condivise, artwork originali, ritratti ufficiali, cache native con limiti di memoria, sincronizzazione delle animazioni e dialoghi con gestione del focus. Aggiungere decorazioni sopra queste basi senza prima correggere geometria e gerarchia amplificherebbe i problemi attuali.

## Confine delle prove

Ho riletto i sorgenti UI/motion del checkout corrente. In questa ripresa non sono disponibili strumenti CUA/browser e gli screenshot della precedente esecuzione non sono presenti sul disco. **Questo sottoaudit non certifica nuove schermate viste in browser, fluidità percepita, frame rate, contrasto misurato o qualità finale dei media.** Gli asset pubblici erano in recupero: un'immagine non risolta durante tale fase non costituisce prova di un difetto dell'app. Le misure di runtime e i riferimenti visivi RPG eventualmente acquisiti dal coordinatore vanno allegati separatamente.

Le conclusioni seguenti distinguono fatti leggibili nel codice, implicazioni e verifiche ancora necessarie. I numeri di durata sono configurazioni; non sono tempi completi misurati durante un turno. I riferimenti `src/...:riga` sono relativi al checkout indicato sopra.

## Rilievi ordinati per impatto

### UI-01 — Colonne desktop più larghe della finestra: priorità alta

**Evidenza verificata.** `src/player-ui/rpgPlayerUi.css:13` attiva il layout desktop da 1100px di larghezza e 820px di altezza. Squadra impone tre colonne minime 420+390+440 = **1250px** (`:19`); Arkadex impone 420+370+430 = **1220px** (`:23`). Il gap è 24px, quindi due spazi aggiungono 48px (`:18`). La shell aggiunge 34px di padding per lato (`:14`), ridotto a 30px nel ramo di altezza 820–960px (`:26–28`). Nessun override successivo riduce le tre colonne. I due fogli sono importati in sequenza, compatibilità prima e nuovo RPG dopo (`src/player-ui/kit.tsx:8–9`).

**Conseguenza.** A viewport 1280×900 la larghezza minima richiesta è **1358px per Squadra** e **1328px per Arkadex**, prima degli ulteriori margini/bordi del dialogo. La soglia desktop ammette quindi misure che le colonne non possono contenere. Il pixel esatto tagliato e il percorso di scroll dipendono dal contenitore e richiedono browser; il conflitto fra regole è già dimostrabile staticamente.

**Intervento.** Legare il numero di colonne alla larghezza del contenitore reale. In modalità larga mantenere lista, ritratto, dettaglio; in modalità intermedia portare il dettaglio sotto o sostituire ritratto/dettaglio con pannello selezionabile; in modalità stretta mantenere lista e scheda su livelli successivi. Usare `minmax(0,...)` dove il contenuto può comprimersi, definendo per il testo wrapping e scroll consapevoli. Evitare di risolvere riducendo l'intera UI con uno scale globale.

**Accettazione.** A 1280×900 e 1366×768 nessun comando primario deve finire fuori viewport e nessun dettaglio deve richiedere scroll orizzontale involontario. Ripetere con scala font 1.25 e nomi lunghi. Studio a 1920×1080 non basta a verificare questo punto.

### UI-02 — La scala font non governa tutta la tipografia: priorità alta

**Evidenza.** L'Admin applica `--arka-font-scale` (`src/theme/applyAdminTheme.ts:28`); `src/index.css:66` lo traduce nel font del documento. Il nuovo menù imposta tuttavia font in pixel: corpo 22px (`rpgPlayerUi.css:3`), titoli 38/32/24px, label 18px e input 20px (`:4`), oltre a molti override locali.

**Conseguenza.** Cambiare il controllo globale non può scalare in modo uniforme questi valori assoluti. Il risultato dipende dal componente, rendendo difficile prevedere densità, leggibilità e collisioni. Non è un giudizio sui font originali: il problema è il loro dimensionamento.

**Intervento.** Conservare le famiglie originali (`index.css:6–18,52–54`), definire 5–6 ruoli tipografici con unità relative e limiti espliciti, derivare il moltiplicatore accessibile dallo stesso token. Separare scala del testo da scala dello stage e zoom dell'editor. Anteporre leggibilità di nome, HP, costo e azione alle didascalie decorative.

**Accettazione.** Misurare il valore computato di titolo, label, valore HP e pulsante prima/dopo il cambio di scala, poi verificare il layout nelle tre risoluzioni. Il semplice aggiornamento di una variabile non è prova di efficacia.

### UI-03 — Identità cromatica e componenti condivisi soltanto in parte: priorità alta

**Evidenza.** Esistono `RpgFrame`, `RpgCommand`, `RpgWindow`, `RpgMeter` (`src/components/rpg/index.tsx:6–29`); `GameButton` riusa le stesse cornici salvo il tono danger (`components/ui/GameButton.tsx:14–19`); `KitButton` e `KitFrame` reinterpretano asset storici verso le cornici nuove ma mantengono casi propri (`player-ui/kit.tsx:24–42`). Il tema Admin scrive token `--arka-*` e `--hp-*` (`theme/applyAdminTheme.ts:7–28`), mentre la shell dichiara una palette `--pu-*` propria e colori locali (`rpgPlayerUi.css:3–4`). Il file corrente contiene 172 righe / 34.380 caratteri, 13 `!important` e 38 occorrenze di colori esadecimali: dato di manutenzione, non una misura di qualità visiva.

**Conseguenza.** Una correzione alla dimensione o allo stato di un pulsante può non raggiungere tutti i contesti; cambiare palette non implica un tema uniforme. Le compatibilità sono utili, ma rendono difficile capire quale regola possieda davvero un componente.

**Intervento.** Un unico contratto semantico per `default`, `selected`, `focus`, `disabled`, `danger`, `pending`; un unico sistema di spazi e dimensioni; adattatori temporanei per le vecchie API. Mantenere le cornici e le immagini originali selezionate come asset di identità, poi normalizzare superfici, testo e stati intorno a esse. Portare prima tre flussi campione — Squadra, Analisi, Borsa — e propagare soltanto dopo confronto visivo.

### UI-04 — Troppa struttura permanente attorno al contenuto: priorità media/alta

**Evidenza.** La finestra giocatore monta logo/sottotitolo, posizione, selettore giocatore, valuta, sei voci di navigazione, kicker/titolo/descrizione, riquadro giocatore selezionato e footer (`src/player-ui/PlayerUi.tsx:130–180`). Le schermate figlie hanno a loro volta intestazioni e contatori (`TeamScreen.tsx:78–83`, `DepositScreen.tsx:101–110`). Il CSS nasconde già il page-head per Squadra/Deposito/Analisi/Negozio (`player-ui.css:2`) e le descrizioni desktop (`rpgPlayerUi.css:17`); non è quindi dimostrata una duplicazione visibile di ogni titolo. Altre ripetizioni sono nascoste e le toolbar Arkadex/Borsa sono spostate con `position:absolute; top:-68px` (`rpgPlayerUi.css:118–119,150–153`).

**Conseguenza.** È una proposta di semplificazione della gerarchia, da valutare sulle catture effettive. Il contenuto utile può competere con il guscio sulle altezze intermedie; gli aggiustamenti esistenti mostrano però già attenzione alla riduzione delle ripetizioni. Lo spazio effettivamente recuperabile richiede screenshot e misure.

**Intervento.** Un solo titolo per pagina, giocatore e luogo compatti e persistenti, valuta contestuale al commercio, azioni del compagno vicino al compagno. Tre livelli visivi leggibili: orientamento, decisione, dettaglio. Cornice elaborata sul contenitore principale o sul ritratto; righe dati e card secondarie più quiete. Il focus deve risultare dalla forma/contrasto del comando, senza dover illuminare ogni pannello.

### UI-05 — Mappe con salti di scala tipografica e comandi minuti: priorità media/alta

**Evidenza.** `src/scenes/localMapScene.css:3–14` imposta pulsanti 11–12px e note 10px. Nel ramo <=800px scende a 9–10px (`:23–39`). Da 1200px i pulsanti salgono direttamente a 20–22px e i titoli a 32px (`:42–52`).

**Conseguenza.** La stessa azione cambia drasticamente presenza fra 1199 e 1200px, mentre su schermo piccolo il testo operativo viene compresso. Non è ancora una misurazione di leggibilità reale o dimensioni touch, che vanno rilevate.

**Intervento.** Intervallo di densità continuo con `clamp()` e contenitori; su mobile ridurre la quantità di testo simultaneo e trasferire le attività in un pannello dedicato. Mantenere sempre evidenti posizione corrente, budget azioni e prossime destinazioni. Per i nodi, distinguere corrente/raggiungibile/completato tramite forma e testo oltre al colore, preservando artwork e topologia.

### UI-06 — Stage 16:9, finestre viewport e mappe seguono contratti diversi: priorità media

**Evidenza.** La campagna è uno stage 16:9 dimensionato con min(viewport) e trasformato da `--arka-stage-scale` (`src/index.css:166–173`); le mappe locali occupano l'intera viewport (`:175–178`); Partita viene montata in portal nel body (`settings/PlayerTools.tsx:43–53`, `components/ui/GameDialog.tsx:36–42`).

**Conseguenza.** Non si può dedurre il responsive di uno dei tre dal comportamento degli altri. Un aumento dello stage non ricalcola le colonne della finestra giocatore. Il pubblico può vedere dimensioni e ritagli diversi dal controllo locale.

**Intervento.** Esplicitare tre contratti: campo di gioco per proiezione, strumenti per viewport locale, mappa interattiva per contenitore. Tutti condividono safe area e token ma non lo stesso scale. Validare `?view=broadcast` come superficie indipendente, compresi dati presentati, pausa e dadi.

### UI-07 — Ritmo battaglia legato a clip native lunghe e orientamenti asimmetrici: priorità alta per la percezione

**Evidenza.** Il manifest definisce cinque azioni e genera soltanto set frontali (`src/components/arkamon/arkamonAnimationManifest.ts:5–12,35–66`); la configurazione base è 96 frame a 24fps = 4s (`:46–59`), con eccezioni per specie. Le viste posteriori conservano gli sprite esistenti (`:70–74`). Il giocatore A usa back, B front (`scenes/BattagliaScene.tsx:659–662`). La sequenza aspetta impatto e completamento di attaccante, bersaglio e VFX (`components/battle/battleVisualSequence.ts:92–100`); solo dopo parte la fase dadi e rivelazione HP/KO (`scenes/BattagliaScene.tsx:735–798`).

**Conseguenza.** Il lato avversario può avere ricchezza diversa dal lato del giocatore. Aspettare i completamenti integrali può allungare la decisione successiva, anche quando l'impatto è già leggibile. Non sono stati misurati né il tempo totale né una percezione di lentezza in questa ripresa.

**Intervento.** Conservare il cue di release/impact e la correttezza del reveal dei dadi. Separare fine necessaria della presentazione da coda decorativa della clip, consentendo alla posa di assestarsi mentre compare il pannello successivo quando coerente con le regole. Definire profili breve/standard/importante per mosse comuni, Suprema e KO; rendere il retro dignitoso con grounding, luce e feedback procedurale coerenti, senza sostituire automaticamente l'artwork originale. Non avviare una campagna di nuove animazioni prima di misurare pochi turni reali e il costo per specie.

**Accettazione.** Registrare una mossa normale, una cura, una Suprema e un KO per entrambe le parti; annotare comando→release→impatto→dadi visibili→HP→sblocco successivo. Ripetere in veloce e ridotto; nessun evento logico deve dipendere dall'animazione e nessun risultato deve trapelare prima dei dadi.

### UI-08 — Transizioni di scena con pesi differenti: priorità media

**Evidenza.** `src/components/transitions/sceneTransitionProfiles.ts:52–65` assegna 500ms ai viaggi, 1900ms all'evoluzione, 3000ms all'ingresso battaglia e 120ms agli altri casi, con cover/blend separati. Il filmato battaglia usa il segmento da 5s per 3s (`:3–5`). Esiste un timeout di sicurezza per rilasciare il blocco input (`:64–65`, `SceneTransitionOverlay.tsx:48–51`).

**Conseguenza.** Un ingresso ricorrente in battaglia può avere un costo attentivo molto maggiore di una selezione ordinaria. Il fail-safe è una buona difesa; non prova che la riproduzione media sia sempre pronta.

**Intervento.** Una grammatica di movimento condivisa: feedback breve di controllo, cambio pannello, viaggio, momento speciale. Riservare l'ingresso lungo ai momenti che lo meritano e provare una variante compatta per ripetizioni. Precaricare risorse selezionate al momento utile. Mantenere i fallback e un rilascio input deterministico.

### UI-09 — Riduzione movimento presente ma distribuita su due meccanismi: priorità media

**Evidenza.** `src/settings/gamePreferences.ts:46–50` risolve OS e preferenza salvata; `App.tsx:149–151` configura Framer Motion. Il VFX mantiene la velocità coerente durante un singolo evento (`components/vfx/useVfxPlaybackPreferences.ts:4–12`), e l'impulso battaglia scompare in ridotto (`BattlePresentation.tsx:69–72`). Le transizioni CSS dei pulsanti rispondono però direttamente alla media query OS (`components/ui/gameButton.css:37–38`, `components/rpg/rpg.css:11`, `player-ui/player-ui.css:112`).

**Conseguenza.** La scelta interna può non governare le transizioni puramente CSS allo stesso modo di quelle JavaScript. Lo Studio forza MotionConfig ma i hook personalizzati leggono ancora preferenza/OS: la sua staticità non va data per totale.

**Intervento.** Una preferenza risolta propagata anche tramite attributo sul root e token CSS. In ridotto togliere camera shake, hit-stop, grandi spostamenti e lampeggi ripetuti; mantenere highlight, testo, dadi e HP leggibili. Verificare la matrice OS×override invece di controllare soltanto l'OS.

### UI-10 — Animazioni geometriche da profilare: priorità media, costo non misurato

**Evidenza.** Il proiettile VFX anima `left` e `top` e dichiara `willChange:'left, top, transform, opacity'` (`src/components/vfx/MoveVfxLayer.tsx:175–197`). L'avatar della mappa anima una sequenza di percentuali `left/top` (`components/map/MainMapAvatar.tsx:34–58`).

**Conseguenza.** Sono proprietà che possono richiedere ricalcolo di layout/posizionamento. Il solo `will-change` non dimostra promozione efficiente né un problema percepito. Non è stato eseguito un profilo GPU/CPU in questo sottoaudit.

**Intervento.** Misurare prima layout/paint durante un caso impegnativo; se confermato, mantenere ancore normalizzate ma tradurre il moto tramite transform su layer stabili. Evitare blur e glow multipli a pieno schermo quando non aiutano a leggere l'azione. Conservare la priorità di impatto sul bersaglio rispetto alla quantità di particelle.

### UI-11 — Authoring molto potente, geometria runtime fragile: priorità media/alta di manutenzione

**Evidenza.** `src/ui-studio/UiDesignRuntime.tsx:51–70` applica/restaura stili inline `important`. Per la geometria crea placeholder e rende assoluti gli elementi, misurando root e offset parent (`:97–123`). Rileva mutazioni e ripete il passaggio via animation frame (`:214,257–277`). Il meccanismo è disabilitato se non c'è un design runtime (`:38`); le rettangolazioni battaglia vengono invece risolte prima del render (`:99–100`).

**Conseguenza.** La possibilità di spostare un elemento qualsiasi è utile per l'editor, ma il layout finale può dipendere da struttura DOM, misure e override in competizione con React. Non è corretto attribuire a ogni frame normale un costo di questo sistema, perché il percorso è condizionale.

**Intervento.** Estendere gradualmente il modello già usato dalla battaglia: componenti ricevono token/layout prima del render, con ID stabili e limiti per breakpoint. Riservare la trasformazione DOM agli adattatori legacy e all'authoring. Aggiungere una validazione della bozza per collisioni, rettangoli fuori area, contrasto e contenuto lungo prima dell'applicazione.

### UI-12 — Stati e feedback richiedono lo stesso livello di cura della cornice: priorità media

**Evidenza.** I ritratti della gestione usano il PNG frontale ufficiale e metadata di inquadratura (`src/player-ui/kit.tsx:46–80`), ma ogni istanza crea un `Image()` e un decode proprio (`:49–63`); un fallimento azzera solo il marker di caricamento, senza un placeholder esplicito di errore. Nel deposito i filtri oscurano i non corrispondenti mantenendo gli slot, con spiegazione scritta (`DepositScreen.tsx:120–138`), scelta coerente con gli spostamenti. Gli input e selettori sono perlopiù nativi e nominati.

**Conseguenza.** L'intenzione dei filtri è valida ma va resa evidente anche visivamente; un ritratto mancante può sembrare una cella vuota. Non è dimostrato un download ripetuto per ogni istanza: il browser può riusare la cache delle risorse.

**Intervento.** Introdurre skeleton/placeholder dichiarati, esito caricamento e retry solo quando utile; condividere readiness/decode dei ritratti se il profilo mostra costo reale. Distinguere chiaramente selezione, destinazione di spostamento, elemento non corrispondente al filtro, comando disabilitato e attesa. Le ragioni di blocco già presenti devono stare vicino al controllo interessato.

### UI-13 — La tastiera ha buone basi, la grammatica di selezione va resa esplicita: priorità media

**Evidenza.** `GameDialog.tsx:11–34` mette il background inert, gestisce Tab/Escape e restituisce il focus al controllo d'origine. `SpatialNavigation.tsx:12–35` usa tabIndex mobile e frecce; in modalità ordinaria chiama `.click()` dopo lo spostamento del focus. Squadra e Deposito disabilitano questa selezione automatica durante uno spostamento (`TeamScreen.tsx:84`, `DepositScreen.tsx:122,142`), evitando una conferma accidentale. Il footer mostra un suggerimento tastiera generico (`PlayerUi.tsx:180`).

**Conseguenza.** Non c'è una base per definire l'intera app inaccessibile. C'è invece un contratto da uniformare: in alcune liste le frecce selezionano subito, in modalità spostamento conferma con Invio; il suggerimento universale può non raccontare la fase reale.

**Intervento.** Mantenere focus e selezione distinti nello stile, suggerimenti contestuali alla modalità, annunci brevi per cambio selezione/esito e ritorni affidabili. Vietare la selezione automatica su controlli che eseguono mutazioni. Verificare dialoghi annidati e ritorno dal dettaglio per G1/G2.

### UI-14 — Audio operativo uniforme, poco semantico: priorità media/bassa

**Evidenza.** Il controller emette lo stesso click globale su ogni `button` al pointerdown e su Invio/Spazio (`src/components/AudioController.tsx:38–50`). Il laboratorio audio permette già destinazione mossa/evento, cue inizio/impatto, volume e ritardo (`components/audio/AudioLab.tsx:174–209`).

**Conseguenza.** L'infrastruttura consente una direzione sonora più precisa; il click globale non distingue spostamento focus, selezione, conferma, annulla o impossibilità. Da verificare con ascolto reale e volume bilanciato.

**Intervento.** Una piccola famiglia sonora coerente con il materiale del gioco, con eventi semantici e priorità: navigazione discreta, conferma leggibile, errore breve, evento raro riconoscibile. Evitare sovrapposizione tra click di sistema e suono della mossa. Non scegliere nuovi suoni soltanto dalla forma del nome file.

## Basi da conservare

La cache delle pagine native ha deduplicazione per URL, lease, limiti di memoria 32/64MiB, scadenza dopo rilascio e timeout di decode (`src/utils/spritePageCache.ts:25–96,101–142`). La preparazione delle immagini mantiene un budget 128MiB e una vita breve dei bitmap (`utils/prepareImageAsset.ts:3–10,33–65,78–87`). Le risorse di attaccante, bersaglio e VFX vengono preparate prima che partano gli orologi (`BattagliaScene.tsx:722–728`). La sequenza tiene separati risultato logico e rivelazione visiva. Queste scelte vanno valorizzate e misurate, senza introdurre un secondo sistema di cache o tempi animati che alterino i dadi.

La gestione preserva il PNG frontale ufficiale e l'inquadratura dei pixel del compagno; il laboratorio distingue esplicitamente frontale animato e retro statico (`DarklawAnimationLab.tsx:159–188`). I componenti comuni hanno già i punti di ingresso per cornici e stati. Rifinire ciò che esiste è più sostenibile che migrare ogni schermata a un kit estraneo.

## Direzione grafica proposta da validare sulle immagini reali

Questa è una **proposta**, non un giudizio derivato da screenshot assenti né una riproduzione di un gioco terzo. Il coordinatore deve affiancarle gli esempi RPG effettivamente osservati nel database richiesto dall'utente e gli artwork locali ripristinati.

1. **Identità Arkamon leggibile.** Preservare logo, famiglie originali e battle artwork. Scegliere una famiglia di materiali per il singolo contesto e trattare le cornici esistenti come accento di identità. Ridurre i livelli di cornice ripetuti per dare peso a compagno, destinazione e decisione.
2. **Una composizione per ogni compito.** Squadra: lista comparabile, compagno selezionato, tre/quattro azioni vicino alla scheda. Analisi: grande ritratto stabile e dati ordinati per domanda del giocatore. Borsa: oggetto→bersaglio→effetto→conferma. Negozio: catalogo, costo e totale con valuta vicina. Mappa: luogo corrente e itinerario, attività nel contesto del nodo. Battaglia: contrasto prima sui due nomi/HP, poi comando disponibile e stato del turno, infine VFX.
3. **Luce locale per la lettura.** Valutare sullo sfondo reale una maschera leggera sotto dati e comandi, un grounding coerente e separazione del ritratto. Evitare una patina nera globale che cancelli il panorama. Colori di tipo e rarità possono arricchire accenti piccoli; la selezione deve avere una grammatica stabile indipendente dal tipo.
4. **Informazioni a richiesta.** Mostrare subito ciò che serve per la decisione corrente e trasferire spiegazioni lunghe, regole complete e log nei pannelli già presenti. Preservare tutte le funzioni: cambiare priorità visiva e percorso, senza eliminare la profondità utile al GM.
5. **Movimento con una funzione leggibile.** Focus rapido, selezione breve, apertura pannello con continuità, viaggio leggibile, impatto allineato al bersaglio, eventi speciali riconoscibili. Animare la relazione fra causa ed effetto, non ogni decorazione. Lasciare una posa stabile per leggere dati e scegliere.

## Piano concreto di lavoro

| Fase | Cambiamento | Verifica che permette di passare oltre |
|---|---|---|
| 0 — Baseline | Completare media e avvio; acquisire le 47 preview, runtime, Admin/lab e flussi critici dell'inventario. Annotare esattamente ciò che è stato osservato. | Galleria vista e collegata al commit; errori di asset distinti dalla fase di ripristino; nessuna affermazione di copertura completa senza log |
| 1 — Fondamenta | Risolvere UI-01/02: larghezza reale, 2/3 colonne, font relativi, scroll previsto, safe area. Creare token semantici di colore/stato/spazio. | Squadra/Arkadex/Deposito leggibili a 1920×1080, 1280×900, 1366×768, 390×844 e font 1.25 |
| 2 — Verticale grafica | Rifinire una sola famiglia completa: Squadra→Analisi→Borsa con originali e componenti condivisi. Mettere a confronto prima/dopo sullo stesso dato. | Gerarchia chiara, nessun contenuto perso, azioni e focus stabili, G1/G2 preservati |
| 3 — Propagazione | Portare Menù, Deposito, Arkadex, Negozio e Registri sul contratto approvato. Ridurre ripetizioni nel guscio. | Stato vuoto/pieno, nomi lunghi, filtri e blocchi rimangono comprensibili; pattern uniforme |
| 4 — Mappe | Stato nodi, percorso e attività, toolbar responsive, pannelli di interazione, confronto sulle 16 mappe. | Posizione e prossima azione si riconoscono senza esplorare tutti i controlli; artwork preservato |
| 5 — Battaglia/motion | Registrare timeline e profilo; ridurre attese decorative, bilanciare front/back, uniformare cue VFX/audio e preferenze ridotte. | Normale/veloce/ridotto coerenti, nessun reveal anticipato, nessun blocco su asset fallito, frame time misurato |
| 6 — Authoring e manutenzione | Portare i layout ricorrenti verso render dichiarativo, validare bozze e contrasto/geometria, alleggerire adattatori DOM. | Stesso risultato fra Studio, runtime e broadcast entro il loro contratto; import e compatibilità mantenuti |

L'ordine serve a far crescere la qualità senza moltiplicare il lavoro: prima si rende affidabile lo spazio disponibile, poi si perfeziona una famiglia completa, quindi si replica il linguaggio e infine si rifiniscono i momenti spettacolari. L'applicazione delle modifiche è un lavoro successivo al presente sottoaudit; qui non è stato applicato alcun redesign.

## Decisioni di prodotto da non alterare nel redesign

La regia resta al GM e i due giocatori competono. Gli ospiti possono controllare privatamente gli avversari assegnati; il pubblico vota entro il perimetro previsto per gli NPC ordinari. Un miglioramento grafico non giustifica la trasformazione della narrazione in automazione, l'allargamento delle votazioni o la rimozione delle regole di turno/gestione. Il cambiamento deve chiarire ruolo, controllo e stato, preservando queste responsabilità.

Il promemoria di continuità è stato usato solo per preservare tali vincoli e la richiesta storica di font/artwork originali, non come prova tecnica del checkout attuale. Fonte memoria: `MEMORY.md:29–31`; i rilievi tecnici sopra derivano dalle letture correnti.
