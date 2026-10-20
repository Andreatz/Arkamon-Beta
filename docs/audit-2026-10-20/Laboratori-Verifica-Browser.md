# Laboratori Arkamon — audit corrente

> Archivio del 20 ottobre 2026: **Visite dei laboratori sullo snapshot iniziale**. Origine nella cartella della sessione: `work/labs-browser-audit.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Data: 20 ottobre 2026. Checkout: `C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta/checkout`. HEAD verificato: `ea4dcab344cf4030757b4c9bb00f4890b4421be4`.

Browser disponibile: Opera tramite CUA. Le nuove visite locali di questo rapporto sono distinte dalle note storiche del primo ambiente. Nessun codice applicativo o dato reale viene modificato. Controlli demo e preferenze sono esercitati solo nell'origine locale di audit.

## Preparazione verificata

- Riletti i sorgenti attuali dei sette laboratori: BattleRulesLab, BattleDiceLab, SceneTransitionLab, VfxGallery, AudioLab, DarklawAnimationLab e DepositLab.
- Fonti RPG esterne: tutte e otto le schermate sono state riaperte e osservate nella sessione corrente. Direzione e riferimenti sono in `work/rpg-references.md`.
- Asset locali ancora in ripristino: nessuna risorsa assente durante il ripristino viene classificata come difetto. Le prove visive definitive iniziano quando il responsabile della build conferma la disponibilità.

## Checklist della visita

| Lab | Copertura da esercitare nel browser corrente |
|---|---|
| Regole | Moneta/continua; paralisi/prova/cura/reset; sonno primo e successivi/reset; veleno fino al KO/reset; overlay e blocco controlli |
| Dadi | Sei facce; tutti1–6;20fissi; latiA/B; replay; immagini normali e fallback esplicito; risultati persistenti |
| Transizioni | Mappe, evoluzione, ingresso battaglia; replay; stato durante/fine; ridotto statico; velocità normale |
| VFX | Ricerca/categoria/formato/candidati/consigliati; vuoto; riferimento e confronto; precedente/successivo; replay; lati; cinque anchor; scala; tre sfondi; ripetizione |
| Audio | Catalogo; destinazione mossa/evento; candidati; play/stop e combined; volume/cue/ritardo; ricerca/categoria/shortlist/pagine; candidato locale/reset/export; nessuna attestazione d'ascolto non avvenuto |
| Arkamon | Specie campione; front/retro; quattro sfondi/scale; cinque azioni e sequenza; frame; loop campione; attacco/VFX con mossa/bersaglio/vista |
| Deposito | Selezione; spostamento/scambio; fascia livelli; navigazione box; vuoto; reset; viewport reale |

Le quantità di catalogo non equivalgono alla revisione di ogni singolo asset. Il rapporto finale elencherà i campioni osservati e i limiti, senza dichiarare un audit artistico esaustivo di tutte le combinazioni.

## Visite correnti eseguite su build locale

Origine: `http://127.0.0.1:3050/`, build produzione locale invariata, asset ripristinati dal medesimo SHA (disponibilità confermata dal responsabile della build prima delle visite). Browser Opera, viewport iniziale **1494×678**. Preferenze verificate nel menu reale: velocità **Normale**, audio attivo; movimento ridotto inizialmente «Segui il dispositivo», portato a «Disattivato» per i confronti normali. Solo l'origine di audit è interessata.

Screenshot persistenti in `outputs/evidence/screenshots/`, tutti con prefisso `lab-`. I file sono stati scritti dai byte del metodo browser `screenshot`, senza manipolazione o ricostruzione dell'immagine.

### Regole e status

- Screenshot01 stato iniziale con tre sezioni;02 moneta durante il giro con Continua bloccato;03 esito Croce/IniziaB.
- Paralisi: D6=6, esito «può attaccare ma resta paralizzato»; Continua applica l'esito. Cura rimuove stato e disabilita Prova/Cura. Screenshot04.
- Sonno: primo click senza dado obbligatorio; secondo apre D6=4 con risveglio; Continua rimuove stato e disabilita la prova.
- Veleno: quattro avanzamenti,100→90→70→40→0. A0HP il comando è disabilitato; badge mostra il prossimo50%, descrizione ultimo danno40%. Screenshot05 include stati curati e KO da veleno.
- Tutti e tre i reset esercitati.

**Lettura grafica misurata:** le spiegazioni usano `Arkamon Norwester` a **10.5px**, interlinea15px, e l'introduzione12px/18px. Il carattere caratteristico è riconoscibile ma condensato e tutto maiuscolo anche nei paragrafi; una vasta area resta libera sotto le tre card. È opportuno mantenere l'identità nei titoli e migliorare scala e carattere di lettura per istruzioni, dati e stato.

### Dice Lab

- Sei facce normali1–6 viste in motion e a riposo, somma21; screenshot06–07. Il giro è chiaramente distinto dai cubi finali con punti sulla faccia superiore.
- Venti dadi fissi latoB, somma66; screenshot08–09. Il risultato resta fino al replay; select e checkbox bloccati durante l'esecuzione.
- Singolo6 con fallback esplicitamente attivato; screenshot10. La cifra numerica conserva l'esito.
- Confermata la differenza fra configurazione cambiata e vecchio esito fino al replay: occorre un'indicazione «configurazione modificata» se la preview precedente rimane.

**Geometria:** con sei cubi, il pannello misura clientWidth678px/scrollWidth710px; griglia636/689px. Durante il giro compare una barra di scorrimento orizzontale (screenshot06). L'overflow è riprodotto su asset completi, non è un404. Con20dadi la griglia diventa più alta della prima porzione visibile, ma la pagina è scorrevole. La ridistribuzione degli spazi dovrebbe rendere la somma importante quanto le immagini.

### Transition Lab

- Tutti e tre gli scenari riprodotti a velocità Normale: mappe/dissolvenza (11–12), evoluzione con D6cremisi (13–14), ingresso battaglia con videoVS (15–16).
- Sono state viste immagini dei passaggi e gli stati finali. Il videoVS è stato riprodotto una seconda volta; select e pulsante risultano disabilitati finché finisce. Screenshot16 è stato riscritto solo dopo status «Transizione completata» e Riproduci riabilitato.
- Buona distinzione fra navigazione ordinaria e momenti speciali. Il VS ha una forte identità scenica; non occorre estenderne la spettacolarità a ogni normale apertura di menu.

### Deposito legacy

- Asset normali controllati dopo completamento: immagini con naturalWidth2048 per tutte e nove le specie della demo. Screenshot17 riscritto dopo caricamento, non lasciato sul primo frame incompleto.
- Darklaw16 dalla squadra a box1/posto4: squadra ricompattata. Blazion5/Felvex7 scambiati; poi Darklaw16 reinserito nello slot libero accanto a specie5–6. Screenshot18.
- Aperto box2 e box3 vuoti (19); reset riporta box1 e demo iniziale (17). Navigazione precedente di box1 espone box30.
- **Incoerenza della demo confermata:** istruzioni dicono massimo5livelli ma campione e reinserimento non rispettano la fascia. Source attuale `DepositLab.tsx` richiama `scambia` direttamente. Non è prova di un bypass nel deposito della partita.

**Lettura grafica:** asset di identità ben visibili ma quasi tutto il peso visivo è sui35cerchi di contorno bianco dei box, anche vuoti. I nomi dei contenuti box sono solo nei nomi accessibili/tooltip; ridurre il contrasto degli slot vuoti e dare a selezione/dettaglio uno spazio più chiaro migliorerebbe scansione e priorità. Il reset in cima e l'uscita a freccia senza etichetta visibile sono meno evidenti dei box.

### VFX Lab

- Catalogo418VFX,294consigliati. RicercaSpark=1; combinazione water/GIF/candidati=2; statici senza consigliati=4. Ricerca inesistente=0, con messaggio vuoto e selezione fuori filtro espliciti (29).
- Riferimento fissato, selezione nuova, due pannelli di confronto, rimozione del riferimento; precedente/successivo, reset filtri. Entrambi i lati, cinque ancoraggi, scala0.5/1.25/2×, tre sfondi e ripetizione on/off esercitati.
- Campioni selezionati: Spark, GIFSharkKick, KenneyMagicRing statico, CannonJump e TynusLightning sprite sheet. Screenshot20–29.
- Il GIFSharkKick è stato visto chiaramente sul fondo scuro (24) e quasi scompare sul fondo chiaro (22–23) con il blend previsto. È una differenza grafica effettivamente osservata: la validazione dei VFX va fatta anche contro i fondali luminosi reali. A scala1.25× il GIF al targetA vicino al margine viene tagliato dal viewport di confronto.
- Per i brevi sprite sheet292–958ms le catture non hanno isolato con affidabilità il momento visibile. Il DOM avanza `background-position` e opacità, nessun errore console; non attribuisco la mancanza nella cattura a un difetto di rendering. Serve un video continuo o un'ispezione temporale dedicata per giudicarne il raccordo. Non è stata rallentata la presentazione o cambiato l'asset.

**Lettura grafica:** strumenti ricchi e già organizzati con riferimento/candidato. La densità e i nomi tecnici molto lunghi rendono costosa la scelta; i dettagli essenziali potrebbero avere etichette leggibili, con ID tecnico secondario. Il fondo di battaglia in una preview alta solo240px a questa viewport è ritagliato molto diversamente dall'arena reale: sarebbe utile scegliere anche una preview con rapporto scena costante.

## Interruzione infrastrutturale da non confondere con bug

L'apertura di ArkamonLab ha incontrato `Unable to preload CSS /assets/DarklawAnimationLab-9LF3p_fr.css`, seguita dal reload con `ENOENT .../checkout/dist/index.html`. Screenshot30 documenta l'errorboundary. L'infrastruttura stava ricostruendo la build; questa cattura **non è** una schermata finale né una prova di bug del prodotto. Visite Arkamon/Audio e controlli responsive proseguiranno su build stabile.

## Piano artistico particolareggiato dei laboratori

Questa è una proposta di rifinitura dei sistemi presenti, da mantenere distinta dai difetti verificati sopra. I laboratori già offrono confronto, filtri e preview riusabili: il salto di qualità deve renderli più rapidi da leggere e più fedeli alla scena finale, senza nascondere strumenti utili.

### Un banco di lavoro coerente

Adottare una shell comune in tre regioni: **scelta/preset**, **anteprima**, **parametri e risultati**. Su desktop il catalogo rimane a sinistra e la preview possiede un'area stabile; i dettagli rari sono un ispettore richiudibile. Sotto i1280px l'ispettore passa sotto la preview; su telefono, catalogo e anteprima diventano tab con etichette e conteggio. Nessuna preview deve finire dopo centinaia di righe di elenco prima di essere raggiungibile.

La barra superiore raccoglie nome del laboratorio, contesto della prova, stato «Solo anteprima» e un ritorno testuale. Il controllo Partita può restare globale, ma non dovrebbe competere con replay/continua. Un'unica barra trasporto contiene Riproduci/Ripeti/Ferma/Ripristina e velocità. I controlli bloccati durante le sequenze devono spiegare lo stato attivo senza obbligare a cercare un messaggio lontano.

La palette dei laboratori conserva la base Arkamon. L'accento identifica selezione e comando primario; i colori di tipi, stati e A/B mantengono significato costante. Il font caratteristico resta nei titoli, nelle azioni brevi e negli eventi; descrizioni, valori e identificatori richiedono più leggibilità. Per le dimensioni iniziali provare corpo14–16px, etichette12–13px e numeri tabulari, poi misurare sul viewport target. Non ridimensionare tutta la UI insieme per correggere un singolo gruppo.

### Regole: da tre schede statiche a prove leggibili

Conservare tre sezioni status ma dare loro una struttura parallela: condizione attuale, regola breve, comando, ultimo evento. Il badge del prossimo effetto deve avere una dicitura «Prossimo turno», distinta dal danno appena applicato. Nel veleno aggiungere una barra100HP con segmenti e un semplice storico10/20/30/40: rende la progressione evidente a GM e pubblico senza dover leggere frasi ripetute.

Moneta e D6 sono già distinti da animazione ed esito: potenziare il risultato con «Inizia A/B» o «Può agire/Salta il turno» più grande del dettaglio numerico. La fase di lancio può restare breve; la conseguenza rimane visibile finché l'utente prosegue. Cure e reset devono essere secondari, con un riscontro chiaro del ripristino.

### Dadi: spazio al risultato e geometria stabile

Separare area dadi e riepilogo. La somma e il danno finale non dovrebbero dipendere dalla posizione sotto una griglia alta; un riepilogo persistente dentro la preview li mantiene leggibili anche con20dadi. Usare colonne e dimensione dei dadi derivati dallo spazio effettivo del pannello, includendo l'ingombro del movimento, per eliminare la scrollbar orizzontale vista con sei cubi.

Quando cambia un parametro dopo un tiro, indicare «Nuova configurazione pronta» e mostrare la preview precedente come tale, oppure sostituirla con uno stato pronto al lancio. Non confondere l'ultimo risultato con i nuovi select. Un switch «Rendering normale/Fallback» più esplicito può migliorare il confronto tecnico lasciando chiaro che non si tratta di una scelta del giocatore.

### Transizioni: tre ritmi, stessa identità

Conservare la differenza già presente fra passaggio rapido, momento di evoluzione e ingressoVS. Dare alla preview un rapporto scena costante, nome dello scenario e un indicatore di fase leggibile. Un confronto normale/ridotto affiancato aiuta a validare entrambe le versioni senza aprire ogni volta il menu globale. La velocità deve essere una preferenza di prova chiaramente etichettata, non alterare le regole.

Il D6cremisi e il videoVS hanno già forza grafica: la rifinitura riguarda integrazione, contrasto e raccordo alla destinazione. Evitare di moltiplicare stacchi complessi nelle aperture frequenti; la spettacolarità del raro dipende dalla sobrietà del normale.

### VFX: catalogo leggibile e confronto corretto

Sostituire la prima riga dell'elenco tecnico con un nome comprensibile, miniatura della famiglia, tipo, intensità e durata. Conservare ID e percorso in un dettaglio copiabile. Separare bene «Confermato», «Candidato» e «Consigliato», indicando autore e significato quando possibile: sono informazioni diverse e non un voto unico di qualità.

La preview dovrebbe consentire due modi: scena reale con attore/bersaglio e banco neutro con riferimenti di scala. Nel confronto A/B usare lo stesso rapporto, stessa scala e stessa regione dell'arena. Aggiungere i limiti dell'asset e il piano d'appoggio come guide facoltative; un effetto tagliato dal viewport deve essere distinguibile da uno progettato per invadere lo schermo.

Per il problema osservato del blend su chiaro, predisporre una matrice rapida dei fondali rappresentativi: scuro, chiaro, foresta e ambiente luminoso. Non correggere tutti i blend automaticamente: valutare colore, alpha, bordo e intensità preservando il carattere dell'asset. Un effetto valido sul nero può fallire sul gioco; il lab deve anticiparlo.

### Arkamon: qualità dei soggetti e continuità del movimento

Le viste originale/animato sono già il confronto giusto. La rifinitura dovrebbe bloccare camera, piano dei piedi e scala relativa, con guide opzionali su centro e perimetro. Usare un selettore specie con miniature e stadio, perché più ID condividono lo stesso nome. La review dei loop necessita primo/ultimo frame affiancati e replay del raccordo; il rapporto matematico di differenza resta una priorità di controllo, non un verdetto artistico.

Le cinque azioni devono comunicare peso e intenzione distinti. L'attesa ha movimento piccolo e stabile; attacco ha anticipazione e recupero; colpito è leggibile senza cambiare silhouette in modo incoerente; vittoria e KO mantengono l'esito. La prova attacco con VFX deve mostrare timeline con marcatori attacco/effetto/impatto/reazione e la stessa composizione della partita. Nessuna valutazione delle animazioni ancora non osservate viene implicata da questo piano.

### Audio: sincronizzazione chiara, ascolto responsabile

L'organizzazione in destinazione, confronto e conservazione è già utile. Potenziarla con un trasporto unico e una timeline visiva con inizio, impatto e ritardo; distinguere «audio solo» e «insieme» senza cambiare il contesto scelto. Formato, durata e livello devono essere secondari al candidato, mentre errori di riproduzione indicano un'azione praticabile.

Le proposte semantiche restano proposte finché ascoltate. Non rinominare una scelta come validata solo perché il browser ha emesso un evento play. La review artistica deve considerare timbro, coda, volume relativo e riconoscibilità nel contesto musicale. L'audit corrente non ha ancora svolto questa parte; il criterio impedisce di confondere successo tecnico e qualità acustica.

### Deposito: gli Arkamon prima dei posti vuoti

Abbassare il contrasto degli slot vuoti, conservando un bordo più forte per hover, focus, selezione e destinazione disponibile. Lo slot occupato mostra un nome breve al focus o in un ispettore sempre raggiungibile. La fascia squadra mantiene identità e livello; il selezionato rivela subito origine, destinazioni valide e regole.

La navigazione dei30box merita un selettore diretto oltre alle frecce. Reset e ritorno devono avere etichette e dimensioni coerenti con gli altri laboratori. La demo dovrebbe applicare i vincoli della partita oppure dichiarare espressamente quelli esclusi, così una prova visivamente riuscita non insegna una regola falsa.

### Ordine di lavoro e validazione

1. Corpo testo, livelli di contrasto, shell e trasporto comuni; verificare una pagina densa e una scenica.
2. Preview con composizione fedele, geometria dadi e gerarchia degli slot deposito.
3. Distinzione configurazione/risultato e indicatori di fase; stato bozza chiaro e ritorni prevedibili.
4. Guide e confronto artistico per sprite/VFX/audio, mantenendo gli asset originali finché una modifica non è valutata nel contesto.
5. Prove a viewport reale desktop/telefono, tastiera, movimento ridotto e sessione lunga. La qualità si valuta sui compiti GM completi, non solo su una cattura gradevole.
