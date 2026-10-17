# Verifica locale dello Studio UI — 17 ottobre 2026

## Risultato

Lo Studio è collegato alle schermate reali. Una modifica resta nella bozza fino ad **Applica al gioco**, viene salvata nel tema Admin e si applica nuovamente dopo il ricaricamento. La campagna usa un archivio separato; l’anteprima dimostrativa non la legge né la scrive.

Il lavoro è presente nel checkout `arkamon-live-rpg`, sul ramo `feat/live-rpg-2026-10-14`. La verifica descritta qui è locale: non dimostra un deploy o un nuovo installer Windows.

## Controlli

| Ambito | Evidenza |
| --- | --- |
| Suite unitaria completa durante l’implementazione | 135 file, 2.783 test passati. La prima esecuzione concorrente aveva evidenziato una gestione incompleta di `window.location` nei test del salvataggio: corretta e verificata nella nuova esecuzione. |
| Controlli unitari finali delle aree modificate | 9 file, 83 test passati: progetto UI, media, cronologia, ereditarietà, tema Admin, transazioni di salvataggio e pannello dadi. |
| TypeScript finale | Nessun errore. |
| Bundle di produzione | Compilazione Vite passata con base `/Arkamon-Beta/`. La verifica del bundle esclude la ricopia dei media pubblici pesanti; non esegue né modifica una release dei media. Rimangono gli avvisi Vite sulle dimensioni dei bundle del catalogo animazioni e dell’app. |
| Accettazione browser finale | 16 test Chromium passati in un’unica esecuzione; rapporti locali in `output/ui-studio-final-acceptance`. |
| Schermate reali | Tour delle 22 schermate, ID unici, geometrie finite e radice 1920×1080; sei posti Squadra e 35 posti Deposito. |
| Viste interne | Analisi Mosse/Status, Arkadex Mosse/Evoluzioni, dadi e borsa della battaglia. Modifiche geometriche effettive misurate sui pannelli dadi e borsa. |
| Mappe locali | Visita di ogni voce presente in `LOCAL_MAPS`, inclusa l’anteprima isolata del Percorso 15. Le personalizzazioni del luogo ereditano il layout comune. |
| Modifica e applicazione | Posizione numerica, trascinamento con zoom, ridimensionamento, annulla/ripeti, applicazione, ricaricamento e risultato nella scena reale. |
| File portabili | Importazione di SVG e font, font caricato effettivamente, esportazione con bytes inclusi, reimportazione, persistenza degli upload e scarto della bozza. |
| Menù | Etichette, visibilità e ordine nel contenitore corretto; un pulsante aggiunto richiama il vero Diario dopo l’applicazione. Il negozio non diventa una destinazione libera del menù. |
| Ereditarietà | Un testo aggiunto alla scheda base può essere spostato, rinominato e nascosto nella vista Mosse, mantenendo posizione e visibilità della base. |
| Dati aggiornati | Cambio di nome e specie da React: gli ID restano stabili e la rimozione degli override ripristina il nuovo nome e il nuovo sprite ufficiale. |
| Campagna e copie di sicurezza | Campagna, backup e sfida attiva identici prima/dopo il tour e le modifiche dell’anteprima. |
| Avvio | Editor e anteprima non vengono caricati nella schermata iniziale; si aprono su richiesta. |
| Grafica esistente | Navigazione di Titolo, mappa principale, Venezia, Percorso 1 e battaglia verificata. Asset originali delle mosse e fondo del pannello dadi conservati; Norwester è il nuovo font. |

Sono stati inoltre eseguiti i flussi esistenti di gestione a 1920×1080, 1920×945 e 1920×900. Un’attesa di caricamento degli sprite nella prova più densa non era terminata durante il primo gruppo concorrente; le tre prove dedicate sono state ripetute e sono passate (`output/ui-studio-portrait-recheck`). I risultati delle esecuzioni precedenti non sono sommati al conteggio dei 16 test finali.

## Immagini dell’editor reale

- `output/ui-studio-editor-1920x1080.png`: selezione di una tessera e prova di un asset Blu nella bozza.
- `output/ui-studio-library-1920x1080.png`: libreria degli asset.
- `output/ui-studio-dice-1920x1080.png`: vista interna del pannello dadi.

Le tre immagini sono state prodotte a 1920×1080; pagina e viewport misurano entrambi 1920×1080, senza scorrimento esterno. Nessun errore JavaScript rilevato durante la cattura. Il nuovo asset mostrato nella prima immagine è una prova nella bozza, scartata dopo la cattura.

## Limiti pratici

- La composizione è salvata nel browser corrente. Il trasferimento su un altro dispositivo richiede **Esporta/Importa**; non è stata aggiunta una sincronizzazione remota.
- Il riferimento di progettazione è desktop 1920×1080. Un layout personalizzato può sovrapporre elementi se si scelgono dimensioni o font incompatibili; lo Studio non riprogetta automaticamente ogni composizione.
- Le viste disponibili sono quelle elencate nel selettore. I laboratori di sviluppo e gli stati transitori non elencati non hanno un’anteprima dedicata.
- Norwester e Chela One sono inclusi. Azonix richiede un’installazione locale oppure l’importazione del suo file. I glifi mancanti nel font scelto usano i caratteri di riserva.

Per il funzionamento dell’editor e il formato dei pacchetti vedere [la guida dello Studio](ui-studio.md).

## Correzione della sostituzione degli asset — 17 ottobre 2026

Il comando **Scegli asset** raggiunge ora la superficie grafica del componente anche quando si seleziona un gruppo del layout. In particolare, le vecchie cornici HP e la texture statica non vengono più disegnate sopra la nuova grafica. **Originale**, annulla/ripeti e la rimozione della modifica ripristinano gli stili precedenti. Le decorazioni interne dei pannelli Arkamon vengono escluse durante la sostituzione; ritratti, indicatori e comandi restano presenti.

Le due cornici HP del kit Comuni sono adattate ai valori reali: il livello di esempio e il riempimento statico della barra inferiore sono esclusi dalla copia usata a schermo; nome, livello e indicatore HP sono allineati alla nuova cornice. I file SVG di partenza non vengono modificati.

Verifiche locali della correzione:

- 48 test unitari di Studio UI, importazione Admin e pannello dadi passati.
- 10 flussi browser esistenti dello Studio passati, compresi tour delle schermate e mappe, isolamento della campagna, applicazione, import/export e ripristino di testi e sprite.
- Quattro regressioni browser dedicate passate, in esecuzioni mirate: cornici HP, messaggi, pulsanti e pannelli Arkamon. Coprono aggiornamenti React, ripristino della geometria, annulla/ripeti e persistenza dopo applicazione e ricaricamento. Per il controllo dei pannelli Arkamon è stato necessario attendere il caricamento della schermata Analisi oltre la prima attesa di 15 secondi; la prova dedicata con attesa di caricamento estesa è passata.
- TypeScript e bundle di produzione con base `/Arkamon-Beta/` verificati. La prova del bundle esclude la ricopia dei media pubblici pesanti.

Lo screenshot locale `output/ui-studio-asset-replacement.png` mostra il caso segnalato con una sola cornice HP nemica, il nome Darklaw, livello 21 e 36/36 HP. Queste prove non costituiscono una verifica del deploy pubblico.
