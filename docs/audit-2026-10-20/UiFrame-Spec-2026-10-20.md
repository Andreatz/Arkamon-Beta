# Specifica dimensionale SVG UI — 20 ottobre 2026

> Archivio del 20 ottobre 2026: **Misure della UI prima degli esempi dedicati**. Origine nella cartella della sessione: `outputs/UiFrame-Spec-2026-10-20.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Questa specifica riporta le dimensioni effettive misurate nel browser con la UI reale e il fixture DEMO denso. Le misure sono in CSS pixel e sono state raccolte a 1920×1080, 1280×900 e 390×844.

La build deve usare SVG dedicati al rettangolo indicato. Il file deve avere una tela esattamente pari a `larghezza × altezza` della riga corrispondente; il disegno della cornice deve arrivare fino ai bordi della tela, senza `preserveAspectRatio` o `object-fit` usati per deformarlo.

## Famiglie grafiche e margini fissi

| Famiglia | Sorgente runtime attuale | Uso | Margine interno richiesto |
|---|---|---|---|
| Finestra/pannello | `window.svg` (1060×320) | `KitPanel`, pannelli di dettaglio, pannelli menu | 34 px sinistra/destra, 26 px sopra/sotto |
| Comando normale | `command.svg` (880×210) | pulsanti normali, righe, slot e comandi RPG | dipende dal contenitore: 32/15 px nella Player UI, 23/10 px nei `GameButton`, 42/16 px nei comandi RPG e slot |
| Comando selezionato | `selected.svg` (880×210) | pulsanti attivi, schede selezionate, slot selezionati | stessi tre profili del comando normale |

Per una tela di una finestra `W×H`, l’area interna è `W−68 × H−52`. Per una cornice Player UI `W×H`, l’area interna di un pulsante è `W−64 × H−30`. Per un `GameButton` è `W−46 × H−20`. Per un comando con cap largo è `W−84 × H−32`.

## Dimensioni canoniche desktop — 1920×1080

Questi sono i target principali da disegnare per la versione grande.

| Schermata | SVG finestra/pannello | Area interna |
|---|---:|---:|
| Menù Partita · riepilogo viaggio | 1140×650 | 1072×598 |
| Squadra · pannello dettaglio | 633×654 | 565×602 |
| Deposito · box | 1156×600 | 1088×548 |
| Deposito · dettaglio | 642×600 | 574×548 |
| Arkadex · indice | 591×650 | 523×598 |
| Arkadex · dettaglio | 619×650 | 551×598 |
| Analisi · dettaglio | 1079×652 | 1011×600 |
| Borsa · inventario | 848×650 | 780×598 |
| Borsa · dettaglio | 950×650 | 882×598 |

Per i pulsanti Player UI desktop:

| Uso | Stato | Dimensione |
|---|---|---:|
| Selettore G1 | selezionato | 281×50 |
| Selettore G2 | normale | 284×50 |
| Navigazione superiore | selezionato | 292×55 |
| Riprendi il Viaggio | selezionato | 255×48 |
| Azioni Squadra | selezionato/normale | 289×50 |
| Azioni Deposito | selezionato/normale | 291×50 |
| Tab Arkadex | selezionato/normale | 185×44 |
| Riga Arkadex | selezionata/normale | 547×66 |
| Reset filtri Arkadex | normale | 547×40 |
| Mostra animazione | selezionato | 229×52 |
| Paginazione Arkadex | normale | 70×44 |
| Tab Analisi | selezionato | 96×48 |
| Tab Analisi | normale corto | 88×48 |
| Tab Analisi | normale lungo | 154×48 |
| Categoria Borsa | selezionata | 76×48 |
| Categoria Borsa | normale corto/medio/lungo | 74×48 / 91×48 / 104×48 |
| Slot oggetto Borsa | selezionato/normale | 187×225 |

I comandi condivisi `GameButton`, presenti anche fuori dalla Player UI, hanno questi target desktop:

| Uso | Stato | Dimensione |
|---|---|---:|
| Indietro mappa | normale | 230×53 |
| Passa turno | selezionato | 157×53 |
| Vai a punto | normale | 228×48 |
| Interagisci | normale | 150×38 |
| Pulsante Partita flottante | normale | 73×35 |
| Usa oggetto nella Borsa | selezionato | 898×50 |

Il contesto giocatore usa 274×60 con margini 42/16. Gli slot squadra del Deposito usano 175×88 con gli stessi margini 42/16.

## Dimensioni compatte — 1280×900

La variante compatta mantiene le stesse cornici dei bottoni globali, ma riduce i pannelli e alcune griglie.

| Schermata | SVG finestra/pannello |
|---|---:|
| Menù Partita · riepilogo viaggio | 738×483 |
| Squadra · pannello dettaglio | 642×487 |
| Deposito · box | 698×433 |
| Deposito · dettaglio | 468×433 |
| Arkadex · indice | 525×483 |
| Arkadex · dettaglio | 642×483 |
| Analisi · dettaglio | 700×481 |
| Borsa · inventario | 550×483 |
| Borsa · dettaglio | 616×483 |

I target principali dei pulsanti sono:

- Selettori G1/G2: **281×50** e **284×50**.
- Navigazione selezionata: **186×64**.
- Riprendi il Viaggio: **255×48**.
- Azioni Squadra: **293×44**.
- Azioni Deposito: **206×54**.
- Tab Arkadex: **193×40**.
- Riga Arkadex: **489×40**.
- Reset filtri Arkadex: **489×40**.
- Paginazione Arkadex: **70×44**.
- Tab Analisi: **96×48**, **88×48**, **154×48**.
- Categorie Borsa: **76×48**, **74×48**, **91×48**, **104×48**.
- Slot oggetto Borsa: **116×149**.
- Slot squadra del Deposito: **100×74**.
- Contesto giocatore: **274×60**.

I cinque `GameButton` condivisi restano **230×53**, **157×53**, **228×48**, **150×38** e **73×35**. Il pulsante di uso oggetto misura **564×50**.

## Dimensioni telefono — 390×844

La Player UI usa una colonna verticale con larghezza utile 350–352 px.

| Schermata | SVG finestra/pannello |
|---|---:|
| Menù Partita · riepilogo viaggio | 350×1142 |
| Barra superiore delle viste | 352×284 |
| Barra superiore del Menù Partita | 352×239 |
| Barra di navigazione | 352×66 |
| Squadra · cap squadra | 350×85 |
| Squadra · dettaglio | 350×647 |
| Deposito · box | 350×793 |
| Deposito · dettaglio | 350×874 |
| Arkadex · indice | 350×1020 |
| Arkadex · dettaglio | 350×599 |
| Analisi · dettaglio | 350×681 |
| Borsa · inventario | 350×610 |
| Borsa · dettaglio | 350×839 |

Gli slot squadra mobile misurano **352×139**; l’ultimo slot può essere **352×134**. Gli slot del Deposito sono **84×55**.

I pulsanti mobile sono:

- Selettore G1/G2: **175×93** e **177×93**.
- Navigazione: Menù **203×52**, Squadra **159×52**, Deposito **161×52**, Arkadex **162×52**, Analisi **147×52**, Borsa **136×52**.
- Contesto giocatore: **248×66**.
- Riprendi il Viaggio: **251×52**.
- Azioni Squadra: **66×68**.
- Azioni Deposito: **143×68**.
- Reset filtri Arkadex: **298×52**.
- Righe Arkadex: **298×87**.
- Tab Arkadex: selezionata **168×52**, normali **106×52** e **145×52**.
- Mostra animazione: **229×52**.
- Tab Analisi: selezionata **115×52**, normale **176×52**.
- Categorie Borsa: selezionata **94×52**, normali **92×52**, **110×52**, **124×52**.
- Slot oggetto Borsa: **93×114**.
- Pulsante uso oggetto: **298×45**.

I `GameButton` condivisi mobile misurano **94×28**, **64×28**, **120×33**, **150×38** e **73×35**.

## Scene speciali

Le scene fuori dalla Player UI usano gli stessi adapter ma altri rettangoli.

### Evoluzione

| Viewport | Finestra messaggio | Comando `Evolvi!` |
|---|---:|---:|
| 1920×1080 | 996×268 | 260×58 |
| 390×844 | 201×53 | 260×58 |

Il comando `Evolvi!` usa il profilo largo RPG con margini 42/16.

### Lega

| Viewport | Carta giocatore | Percorso | Squadra |
|---|---:|---:|---:|
| 1920×1080 | 326×119 | 585×768 | 1239×768 |
| 390×844 | 118×79 | 362×161 | 362×408 |

I comandi della Lega a 1920×1080 sono **192×56** (`Usa oggetto`), **383×58** (`Affronta il prossimo incontro`) e **275×58** (`Termina il tentativo`). A 390×844 diventano **308×48** e **177×99** per i due comandi principali visibili. Usano il profilo RPG largo 42/16.

La schermata di battaglia pronta non espone una cornice SVG `RpgWindow` o `RpgCommand` nei punti misurati: usa pannelli e controlli CSS propri, quindi non va creata una cornice SVG per quei rettangoli finché non si decide di unificarne il renderer.

## Regola per i file da creare

Userei nomi espliciti, per esempio:

```text
window-menu-desktop-1140x650.svg
window-team-desktop-633x654.svg
window-team-compact-642x487.svg
window-team-mobile-350x647.svg
command-team-action-desktop-289x50.svg
selected-team-action-desktop-289x50.svg
command-team-action-mobile-66x68.svg
window-bag-detail-mobile-350x839.svg
```

Per ogni SVG occorre mantenere la stessa famiglia cromatica e lo stesso profilo di bordo, ma ridisegnare internamente la cornice sulla tela target. Le parti decorative importanti — placche, gemme, rivetti, cursori e indicatori — devono avere coordinate proprie nella nuova tela. Non vanno ottenute stirando l’intero SVG sorgente.

La misurazione completa, con rettangolo, genitore, spessore del bordo e breakpoint, è salvata in [ui-frame-sizes-2026-10-20.json](./README.md#evidenze-locali-non-incluse) (origine locale: `outputs/evidence/ui-frame-sizes-2026-10-20.json`).
