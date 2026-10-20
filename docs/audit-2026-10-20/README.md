# Audit e direzione UI — 20 ottobre 2026

Questa cartella conserva i rapporti finali prodotti durante l'analisi del progetto e la successiva definizione degli asset UI. La base analizzata era il commit `ea4dcab344cf4030757b4c9bb00f4890b4421be4`. I documenti sono ordinati per fase: un rilievo presente nello snapshot iniziale può essere già risolto dagli interventi successivi.

## Stato da consultare per primo

1. [Correzioni implementate](./Fixes-2026-10-20.md): interventi alle regole delle visite fallback, pausa dell'evoluzione, authoring e layout intermedio, con le verifiche di quella fase.
2. [Esempi UI con asset per ruolo](../ui-asset-examples-2026-10-20.md): stato dell'anteprima Borsa, Squadra, Laboratorio e Comandi, più la prima integrazione delle icone e delle frecce nelle schermate reali.
3. [Mappa di utilizzo degli asset](./UI-Asset-Usage-Map-2026-10-20.md) e [specifica dimensionale](./UiFrame-Spec-2026-10-20.md): motivazioni e misure di riferimento per proseguire la migrazione delle superfici.

Gli esempi si aprono con il server locale normale del progetto, alla pagina `/?uiStudioPreview=1&assetExamples=1`. La gallery usa dati dimostrativi e la modalità di anteprima del progetto. La sua implementazione è in [UiAssetExamples.tsx](../../src/ui-studio/UiAssetExamples.tsx) e [assetExamples.css](../../src/ui-studio/assetExamples.css).

Le correzioni documentate non chiudono tutti i rilievi del primo audit. Per esempio, i rilievi sui valori storici di scena, sull'esito del riordino squadra, sulle importazioni concorrenti e sui debiti strutturali restano analisi aperte salvo interventi successivi esplicitamente documentati. La galleria dimostra l'uso degli asset dedicati su esempi confrontabili; non equivale alla migrazione di tutti i pannelli del gioco.

## Rapporti inclusi

| Documento | Fase e perimetro | Origine nella sessione |
|---|---|---|
| [Audit-Completo-2026-10-20.md](./Audit-Completo-2026-10-20.md) | Snapshot iniziale e piano | `outputs/Audit-Completo-2026-10-20.md` |
| [Audit-Codice.md](./Audit-Codice.md) | Snapshot iniziale del codice | `outputs/Audit-Codice.md` |
| [Ampliamento-Audit-Codice.md](./Ampliamento-Audit-Codice.md) | Estensione dello snapshot di codice | `outputs/Ampliamento-Audit-Codice.md` |
| [Copertura-Revisione-Codice.md](./Copertura-Revisione-Codice.md) | Inventario della revisione iniziale | `outputs/Copertura-Revisione-Codice.md` |
| [Audit-UI-Movimento.md](./Audit-UI-Movimento.md) | Snapshot iniziale UI e movimento | `outputs/Audit-UI-Movimento.md` |
| [Mappa-Schermate-Laboratori.md](./Mappa-Schermate-Laboratori.md) | Mappa delle superfici ispezionate | `outputs/Mappa-Schermate-Laboratori.md` |
| [Fixes-2026-10-20.md](./Fixes-2026-10-20.md) | Correzioni successive al primo audit | `outputs/Fixes-2026-10-20.md` |
| [UI-Asset-Usage-Map-2026-10-20.md](./UI-Asset-Usage-Map-2026-10-20.md) | Mappa asset precedente alla gallery | `outputs/UI-Asset-Usage-Map-2026-10-20.md` |
| [UI-Asset-Revision-Comparison-2026-10-20.md](./UI-Asset-Revision-Comparison-2026-10-20.md) | Confronto locale delle revisioni SVG | `outputs/UI-Asset-Revision-Comparison-2026-10-20.md` |
| [UiFrame-Spec-2026-10-20.md](./UiFrame-Spec-2026-10-20.md) | Misure della UI prima degli esempi dedicati | `outputs/UiFrame-Spec-2026-10-20.md` |
| [Riferimenti-RPG.md](./Riferimenti-RPG.md) | Ricerca visiva con provenienza documentata | `work/rpg-references.md` |
| [Laboratori-Verifica-Browser.md](./Laboratori-Verifica-Browser.md) | Visite dei laboratori sullo snapshot iniziale | `work/labs-browser-audit.md` |

L'origine della sessione era la cartella `C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta`; la checkout si trovava nella sua sottocartella `checkout`. I riferimenti assoluti mantenuti nel testo servono a documentare questa provenienza. I link al codice sono stati convertiti in percorsi relativi al repository; i numeri di riga restano riferimenti allo snapshot e possono spostarsi.

## Differenze tra le fasi e limiti delle conclusioni

- L'audit iniziale riporta 3.856 test superati; il rapporto delle correzioni riporta 3.858 test superati. Sono esecuzioni di fasi diverse, con test aggiunti successivamente. I 19 test della gallery sono una verifica mirata distinta dalla suite completa.
- I risultati E2E dell'audit iniziale includono casi falliti e saltati. Il successivo passaggio del test Arkastore e delle verifiche UI mirate non certifica la risoluzione degli altri casi.
- La mappa degli asset descrive il renderer prima dell'integrazione di icone e frecce specifiche. Per il collegamento finale di questi controlli fare riferimento al documento degli esempi UI e al codice corrente.
- Il confronto Desktop/checkout rileva uguali `viewBox` e conteggi di elementi, ma questi dati da soli non dimostrano l'identità dei tracciati, degli attributi o della resa. Le revisioni con SHA-256 diverso richiedono un confronto del contenuto o visivo prima di essere dichiarate equivalenti. La copia Desktop non è pubblicata da questo archivio.
- Le dimensioni della specifica sono misure CSS a viewport dichiarati e con fixture DEMO. Sono riferimenti per quelle composizioni; non congelano tutte le dimensioni possibili di una UI responsive.
- I rapporti di ricerca visiva distinguono le schermate osservate dai timing proposti. I riferimenti esterni restano link alle fonti; nessuna immagine di altri giochi viene aggiunta al progetto.

## Evidenze locali non incluse

Le registrazioni grezze, gli screenshot di verifica, i trace, i log, le fixture DEMO generate, i bundle e gli helper specifici del computer restano nell'area locale della sessione. I rapporti ne mantengono i nomi originali per rendere riconoscibile la provenienza; un link che arriva a questa sezione indica un'evidenza locale non presente nel repository. Il presente archivio non pretende di offrire una riproduzione autonoma di tutti gli audit storici.

L'inventario strutturato SVG e il foglio visivo già presenti nella checkout rimangono collegati dalla [mappa degli asset](./UI-Asset-Usage-Map-2026-10-20.md), nella cartella [outputs](../../outputs/UI-Asset-Role-Audit-2026-10-20.md). Sono evidenze specifiche dell'analisi degli asset, separate dai trace della navigazione.

Il rapporto sperimentale `UiFrame-Adaptive-2026-10-20.md` è escluso perché descriveva il metodo `border-image-repeat: round`, poi rifiutato e ripristinato. Non rappresenta la soluzione corrente.

## Impronte dei documenti originali

Le impronte seguenti si riferiscono ai byte originali prima della conversione dei link, della normalizzazione degli a capo e degli spazi finali e dell'aggiunta della nota di archivio. Il contenuto analitico dei rapporti è preservato; le precisazioni di stato sono raccolte in questo README.

| Documento originale | SHA-256 |
|---|---|
| `outputs/Audit-Completo-2026-10-20.md` | `4a24e508827b10ceac176f9359a964d5188d67037daf3820093cca02a074efc1` |
| `outputs/Audit-Codice.md` | `2a35978746710bac8510bd59121c53c2b247f4c8939bcf1d5e685f39510ebc37` |
| `outputs/Ampliamento-Audit-Codice.md` | `1697c42e37c7e79f7aaa7600747b3687243aadf1456eadf72e9551260770ae73` |
| `outputs/Copertura-Revisione-Codice.md` | `11e9f43362ba707378987f54b09f456a36fa9b5480b78d39219036cfd12dadf3` |
| `outputs/Audit-UI-Movimento.md` | `ec4d507df98d7aca081d8e636e93932e63905c6508cb99094f9f953901c2ecb5` |
| `outputs/Mappa-Schermate-Laboratori.md` | `868f50ac91d3a554f08517c268c48bac01f2433f9b182b205b90ca22aba94e6c` |
| `outputs/Fixes-2026-10-20.md` | `0feed76c86edd84b62a6750369d13a3f40be7936b5f40d2d58de5ae8bfee598e` |
| `outputs/UI-Asset-Usage-Map-2026-10-20.md` | `f9fe511f5f11ca0b90be352b78734b20fe1bb0630b323139b5696f3c25efa53a` |
| `outputs/UI-Asset-Revision-Comparison-2026-10-20.md` | `2da49959529e73c1f256d0ea5e1436ee4210c72a0f1ca30028987cb43c6d1b1e` |
| `outputs/UiFrame-Spec-2026-10-20.md` | `9cb451fe3821e48041564ee11e4975dda53deb513c57fcb94b12ee1d7059198f` |
| `work/rpg-references.md` | `f701763d0ae0f741ddf514d9af34fb8a0c440cb6314c02ecbf3bc422e9533c3c` |
| `work/labs-browser-audit.md` | `6989f335371ca098632a3e69f7acb62fde33f3a130615256aec33102e3cd9238` |
