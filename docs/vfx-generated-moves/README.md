# 276 VFX individuali generati

**276 mosse, 276 PNG distinti, nessuna assegnazione mancante.** Snapshot degli asset: 2026-10-02T14:46:43+00:00.

Per confrontare i VFX nel gioco, avvia `npm run dev` e apri [VFX Lab](http://localhost:3000/#vfx-lab). Cerca `Moveset` per vedere i 276 nuovi effetti, oppure il nome della mossa.

Apri [Anteprima_VFX.html](Anteprima_VFX.html) dal repository oppure da una sua copia completa. Gli sprite sono in `../../public/vfx/moves/ai-generated/` e il lettore funziona offline. Non spostare il solo HTML senza i PNG.

I PNG runtime sono copie byte per byte dei finali verificati: RGBA 2048×2048, griglia 4×4, 16 celle 512×512, frame 1 e 16 vuoti, alpha reale e pivot locale (256,256). Scala iniziale 1, blending normal. Le durate e i tempi d’impatto sono valori iniziali da verificare nel gioco.

Le nuove associazioni hanno stato **proposed**. La [revisione statica](reports/VISUAL_REVIEW.md) conserva per ogni ID il metodo effettivo: foglio intero, culmine o campioni selezionati. [Verifica tecnica](reports/verification.json): 276/276 pass e hash distinti. Restano 49 note tecniche documentate; la fluidità e il posizionamento nel motore non sono ancora verificati. Il lettore ha controlli del codice e simulazione DOM; l’esecuzione automatica in un browser reale era bloccata per `file://`.

Gli [originali e la provenienza](../../vfx-source/ai-generated/README.md) restano fuori da public. Si conservano tutte le 306 versioni originali, 276 delle quali sono quelle selezionate. 170 record riportano lo strumento e il prompt effettivo individuali; 106 record storici conservano prompt catalogo, originale e provenienza, senza inventare istruzioni aggiuntive non registrate.

Il [catalogo dei prompt](prompts/Prompt_VFX_276_mosse_Arkamon.md), concept, palette e motivi degli Arkamon sono versionati. La [tabella di associazione](../vfx-moveset-assignments/README.md) comprende anche 56 anteprime prive di ID di combattimento, senza introdurre meccaniche nuove.

## Riproducibilità

- `python scripts/vfx-generated/build-prompt-book.py` ricrea il catalogo dei prompt dalle fonti editoriali conservate.
- `python scripts/vfx-generated/normalizer.py ORIGINALE DESTINAZIONE --qa-json REPORT` applica la normalizzazione originale con Pillow e NumPy. Conserva sempre l’originale e usa una destinazione nuova prima di confrontare gli hash.
- `python scripts/vfx-generated/package.py` ricrea il pacchetto portatile in `dist/vfx-generated/Arkamon_VFX_276.zip`, escluso da Git. Il grande ZIP di consegna non viene inserito nel commit.
- `npm run vfx:runtime` rigenera il manifest TypeScript dal catalogo; il file generato non si modifica a mano.

I rapporti `package-verification.json` e `viewer-code-verification.json` documentano lo snapshot originario della consegna. Il viewer qui usa percorsi adattati al repository; gli hash dei PNG restano invariati.

## Verifica dell’integrazione nella repository

Il [rapporto dell’integrazione](reports/repository-integration-verification.json) registra 417 test superati in 30 file e build riuscita. Il catalogo comprende 418 effetti totali, inclusi i 276 nuovi. I test decodificano tutti i nuovi PNG e controllano dimensioni, trasparenza, griglia, fotogrammi iniziale/finale vuoti e hash.

Nel VFX Lab servito dal gioco sono stati verificati ricerca dei 276 asset, filtri status (56) e terra (23), ricerca e selezione di Stasi Elettrica, riproduzione sul bersaglio e trasparenza sullo sfondo di battaglia, senza errori registrati nella console. Questo controllo riguarda il Lab e un’animazione campione; la calibrazione completa delle 276 animazioni in battaglia resta da verificare con l’utente. Il lettore HTML offline conserva il limite di verifica indicato sopra.

La ricostruzione dei 276 prompt produce file identici byte per byte, anche su Windows. Il pacchetto ZIP è stato ricreato dalla repository e controllato: 280 elementi, inclusi 276 PNG con hash corrispondenti e controllo CRC superato.
