# Audit dei ruoli degli asset UI

Generato il 2026-10-20T18:07:44.215Z. Asset SVG analizzati: **288**.

Questo audit distingue la presenza nel catalogo dalla possibilità di sostituire una superficie runtime. `direct-target` significa montaggio diretto come SVG/immagine completa; `direct-target-or-9slice` significa che l’asset può essere usato direttamente quando la dimensione è nota oppure con un renderer 9-slice dedicato; `catalog-only` significa che non è stato assegnato con sufficiente certezza.

## panel-surface (4)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/box-1.svg` | 0 0 1060 320 | 3.313 | direct-target-or-9slice | high | Superficie di pannello; interna relativamente neutra ma con ornamenti laterali. |
| `public/ui/studio/Blu/box-2.svg` | 0 0 1060 330 | 3.212 | direct-target-or-9slice | high | Superficie di pannello; interna relativamente neutra ma con ornamenti laterali. |
| `public/ui/studio/Scuro/box-1.svg` | 0 0 1060 320 | 3.313 | direct-target-or-9slice | high | Superficie di pannello; interna relativamente neutra ma con ornamenti laterali. |
| `public/ui/studio/Scuro/box-2.svg` | 0 0 1060 330 | 3.212 | direct-target-or-9slice | high | Superficie di pannello; interna relativamente neutra ma con ornamenti laterali. |

## inventory-surface (2)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/box-inventario.svg` | 0 0 960 600 | 1.6 | direct-target | high | Pannello inventario composto; richiede rapporto vicino al viewBox o variante per breakpoint. |
| `public/ui/studio/Scuro/box-inventario.svg` | 0 0 1060 650 | 1.631 | direct-target | high | Pannello inventario composto; richiede rapporto vicino al viewBox o variante per breakpoint. |

## dialog-or-context-surface (11)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/dialogo-bianco.svg` | 0 0 860 460 | 1.87 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Blu/dialogo-scuro.svg` | 0 0 860 460 | 1.87 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Comuni/capsula-lab-blu.svg` | 0 0 880 360 | 2.444 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Comuni/capsula-lab-nera.svg` | 0 0 880 360 | 2.444 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Comuni/capsula-lab-viola.svg` | 0 0 880 360 | 2.444 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Comuni/dialogo-lab.svg` | 0 0 880 360 | 2.444 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Comuni/infobox.svg` | 0 0 900 280 | 3.214 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Comuni/nuova-partita.svg` | 0 0 840 220 | 3.818 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Comuni/percorso.svg` | 0 0 920 270 | 3.407 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Scuro/dialogo-bianco.svg` | 0 0 820 430 | 1.907 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |
| `public/ui/studio/Scuro/dialogo-scuro.svg` | 0 0 820 430 | 1.907 | direct-target | high | Composizione semantica completa; assegnare alla schermata/contesto corrispondente. |

## banner-surface (6)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/banner-azioni.svg` | 0 0 920 390 | 2.359 | direct-target | high | Banner completo con decorazioni interne; non adatto a 9-slice. |
| `public/ui/studio/Blu/banner-qr.svg` | 0 0 960 560 | 1.714 | direct-target | high | Banner completo con decorazioni interne; non adatto a 9-slice. |
| `public/ui/studio/Blu/banner.svg` | 0 0 920 340 | 2.706 | direct-target | high | Banner completo con decorazioni interne; non adatto a 9-slice. |
| `public/ui/studio/Scuro/banner-azioni.svg` | 0 0 1060 420 | 2.524 | direct-target | high | Banner completo con decorazioni interne; non adatto a 9-slice. |
| `public/ui/studio/Scuro/banner-qr.svg` | 0 0 1060 620 | 1.71 | direct-target | high | Banner completo con decorazioni interne; non adatto a 9-slice. |
| `public/ui/studio/Scuro/banner.svg` | 0 0 1060 380 | 2.789 | direct-target | high | Banner completo con decorazioni interne; non adatto a 9-slice. |

## bar-surface (4)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/barra-bianca.svg` | 0 0 920 190 | 4.842 | direct-target-or-repeat | high | Barra orizzontale; può essere montata come immagine completa o con centro ripetibile se separato. |
| `public/ui/studio/Blu/barra-scura.svg` | 0 0 920 190 | 4.842 | direct-target-or-repeat | high | Barra orizzontale; può essere montata come immagine completa o con centro ripetibile se separato. |
| `public/ui/studio/Scuro/barra-bianca.svg` | 0 0 920 190 | 4.842 | direct-target-or-repeat | high | Barra orizzontale; può essere montata come immagine completa o con centro ripetibile se separato. |
| `public/ui/studio/Scuro/barra-scura.svg` | 0 0 920 190 | 4.842 | direct-target-or-repeat | high | Barra orizzontale; può essere montata come immagine completa o con centro ripetibile se separato. |

## button-surface (8)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/bottone-bianco.svg` | 0 0 880 210 | 4.19 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |
| `public/ui/studio/Blu/bottone-selezionato.svg` | 0 0 880 210 | 4.19 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |
| `public/ui/studio/Blu/bottone.svg` | 0 0 880 210 | 4.19 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |
| `public/ui/studio/Comuni/bottone-bronzo.svg` | 0 0 920 190 | 4.842 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |
| `public/ui/studio/Comuni/bottone-grigio.svg` | 0 0 920 190 | 4.842 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |
| `public/ui/studio/Scuro/bottone-bianco.svg` | 0 0 880 210 | 4.19 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |
| `public/ui/studio/Scuro/bottone-selezionato.svg` | 0 0 880 210 | 4.19 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |
| `public/ui/studio/Scuro/bottone.svg` | 0 0 880 210 | 4.19 | direct-target-or-9slice | high | Pulsante orizzontale; assegnare stati normal/selected/disabled espliciti. |

## control-surface (40)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/button-chiusura-rosso.svg` | 0 0 220 220 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/button-chiusura.svg` | 0 0 220 220 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/button-circolare-check.svg` | 0 0 220 220 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/button-circolare-off.svg` | 0 0 160 160 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/button-circolare-on.svg` | 0 0 160 160 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/checkbox.svg` | 0 0 960 340 | 2.824 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/checker-off.svg` | 0 0 210 180 | 1.167 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/chiusura.svg` | 0 0 320 320 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/pulsante-checkbox.svg` | 0 0 210 185 | 1.135 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/pulsante-freccia-destra.svg` | 0 0 430 190 | 2.263 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/pulsante-freccia-sinistra.svg` | 0 0 430 190 | 2.263 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/pulsante-fuga.svg` | 0 0 220 225 | 0.978 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/pulsante-negozio.svg` | 0 0 210 190 | 1.105 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/pulsanti-connessione.svg` | 0 0 1380 195 | 7.077 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/pulsanti-sistema.svg` | 0 0 1460 190 | 7.684 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/selettore-numerico.svg` | 0 0 640 160 | 4 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/slider-orizzontale.svg` | 0 0 760 150 | 5.067 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/slider-verticale.svg` | 0 0 140 340 | 0.412 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/toggle-off.svg` | 0 0 340 175 | 1.943 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Blu/toggle-on.svg` | 0 0 340 175 | 1.943 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/button-chiusura-rosso.svg` | 0 0 280 280 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/button-chiusura.svg` | 0 0 280 280 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/button-circolare-check.svg` | 0 0 280 280 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/button-circolare-off.svg` | 0 0 240 240 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/button-circolare-on.svg` | 0 0 240 240 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/checkbox.svg` | 0 0 960 340 | 2.824 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/checker-off.svg` | 0 0 260 220 | 1.182 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/chiusura.svg` | 0 0 320 320 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/pulsante-checkbox.svg` | 0 0 260 220 | 1.182 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/pulsante-freccia-destra.svg` | 0 0 260 220 | 1.182 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/pulsante-freccia-sinistra.svg` | 0 0 260 220 | 1.182 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/pulsante-fuga.svg` | 0 0 280 280 | 1 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/pulsante-negozio.svg` | 0 0 260 220 | 1.182 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/pulsanti-connessione.svg` | 0 0 1620 220 | 7.364 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/pulsanti-sistema.svg` | 0 0 1640 210 | 7.81 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/selettore-numerico.svg` | 0 0 920 230 | 4 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/slider-orizzontale.svg` | 0 0 920 190 | 4.842 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/slider-verticale.svg` | 0 0 220 560 | 0.393 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/toggle-off.svg` | 0 0 460 240 | 1.917 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |
| `public/ui/studio/Scuro/toggle-on.svg` | 0 0 460 240 | 1.917 | direct-target | high | Controllo con geometria e contenuto propri; non deve ereditare la famiglia command. |

## portrait-or-selection-frame (12)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/cornice-arkamon.svg` | 0 0 560 540 | 1.037 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Blu/cornice-piccola-selezionata.svg` | 0 0 220 220 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Blu/cornice-piccola.svg` | 0 0 220 220 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Blu/cornice-ritratto.svg` | 0 0 500 540 | 0.926 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Blu/cornice-selezione.svg` | 0 0 240 240 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Blu/cornice.svg` | 0 0 420 420 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Scuro/cornice-arkamon.svg` | 0 0 540 520 | 1.038 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Scuro/cornice-piccola-selezionata.svg` | 0 0 260 260 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Scuro/cornice-piccola.svg` | 0 0 260 260 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Scuro/cornice-ritratto.svg` | 0 0 540 580 | 0.931 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Scuro/cornice-selezione.svg` | 0 0 280 280 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |
| `public/ui/studio/Scuro/cornice.svg` | 0 0 520 520 | 1 | direct-target | high | Cornice per ritratto, selezione o slot; scala proporzionale, mai come pannello. |

## battle-hud (3)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Comuni/barra-giocatore.svg` | 0 0 1000 245 | 4.082 | direct-target | high | HUD di battaglia con contenuto interno; usare come composizione completa. |
| `public/ui/studio/Comuni/hp-bar-enemy.svg` | 0 0 1020 220 | 4.636 | direct-target | high | HUD di battaglia con contenuto interno; usare come composizione completa. |
| `public/ui/studio/Comuni/hp-bar.svg` | 0 0 1020 220 | 4.636 | direct-target | high | HUD di battaglia con contenuto interno; usare come composizione completa. |

## player-kit-surface (10)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/player-kit/card-default.svg` | 0 0 813 266 | 3.056 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/card-portrait.svg` | 0 0 433 458 | 0.945 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/card-selected-cyan.svg` | 0 0 554 247 | 2.243 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/card-selected-violet.svg` | 0 0 565 254 | 2.224 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/panel-medium.svg` | 0 0 1161 423 | 2.745 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/panel-wide.svg` | 0 0 2026 709 | 2.858 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/row-blank.svg` | 0 0 1661 169 | 9.828 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/slot-cyan.svg` | 0 0 272 273 | 0.996 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/slot-default.svg` | 0 0 272 270 | 1.007 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/slot-selected.svg` | 0 0 263 273 | 0.963 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |

## player-kit-control (12)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/player-kit/button-default.svg` | 0 0 657 213 | 3.085 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/button-primary.svg` | 0 0 646 192 | 3.365 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/circle-cyan.svg` | 0 0 282 276 | 1.022 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/circle-default.svg` | 0 0 272 272 | 1 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/circle-selected.svg` | 0 0 275 276 | 0.996 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/command-cancel.svg` | 0 0 450 155 | 2.903 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/command-close.svg` | 0 0 163 146 | 1.116 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/command-confirm.svg` | 0 0 505 155 | 3.258 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/command-left.svg` | 0 0 148 146 | 1.014 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/command-pass.svg` | 0 0 580 156 | 3.718 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/command-right.svg` | 0 0 149 145 | 1.028 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/command-settings.svg` | 0 0 168 147 | 1.143 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |

## decor-or-icon (32)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/divisore-orizzontale.svg` | 0 0 700 240 | 2.917 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/gemma.svg` | 0 0 240 240 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icona-generica-accesa.svg` | 0 0 210 210 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icona-generica.svg` | 0 0 210 210 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icona-home.svg` | 0 0 220 235 | 0.936 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icona-movimenti.svg` | 0 0 220 220 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icona-zaino.svg` | 0 0 220 235 | 0.936 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icone-menu.svg` | 0 0 1140 1140 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icone-mosse.svg` | 0 0 1200 190 | 6.316 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icone-stati.svg` | 0 0 1050 700 | 1.5 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icone-tipi-mosse.svg` | 0 0 1120 600 | 1.867 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/icone.svg` | 0 0 1380 190 | 7.263 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/indicatore-circolare-acceso.svg` | 0 0 280 140 | 2 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/indicatore-circolare-spento.svg` | 0 0 280 140 | 2 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/monete.svg` | 0 0 540 155 | 3.484 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Blu/squadra.svg` | 0 0 1100 240 | 4.583 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/divisore-orizzontale.svg` | 0 0 840 140 | 6 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/gemma.svg` | 0 0 280 280 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icona-generica-accesa.svg` | 0 0 260 260 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icona-generica.svg` | 0 0 260 260 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icona-home.svg` | 0 0 280 300 | 0.933 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icona-movimenti.svg` | 0 0 280 280 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icona-zaino.svg` | 0 0 280 300 | 0.933 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icone-menu.svg` | 0 0 1140 1140 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icone-mosse.svg` | 0 0 1440 240 | 6 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icone-stati.svg` | 0 0 1080 680 | 1.588 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icone-tipi-mosse.svg` | 0 0 1200 640 | 1.875 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/icone.svg` | 0 0 1220 165 | 7.394 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/indicatore-circolare-acceso.svg` | 0 0 200 200 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/indicatore-circolare-spento.svg` | 0 0 200 200 | 1 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/monete.svg` | 0 0 760 210 | 3.619 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |
| `public/ui/studio/Scuro/squadra.svg` | 0 0 1100 240 | 4.583 | direct-target | high | Decorazione/indicatore/asset composito; va posizionato come elemento indipendente. |

## progression-emblem (13)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/progression/gym-1.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/gym-2.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/gym-3.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/gym-4.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/gym-5.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/gym-6.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/gym-7.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/gym-8.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/league-1.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/league-2.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/league-3.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/league-4.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |
| `public/ui/studio/progression/league-5.svg` | 0 0 128 128 | 1 | direct-target | high | Emblema di percorso/lega; montaggio diretto con dimensione fissa. |

## individual-art (98)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/individuali/Blu/connessione/bloccato.svg` | 486 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/connessione/connesso.svg` | -24 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/connessione/disconnesso.svg` | 316 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/connessione/errore.svg` | 1166 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/connessione/in-attesa.svg` | 656 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/connessione/in-connessione.svg` | 146 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/connessione/link.svg` | 826 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/connessione/riconnetti.svg` | 996 -18.5 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/analisi.svg` | 768 23 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/arkadex.svg` | 28 23 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/cronache.svg` | 28 763 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/deposito.svg` | 398 23 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/diario.svg` | 28 393 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/impostazioni.svg` | 768 393 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/negozio.svg` | 768 763 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/salvataggio.svg` | 398 393 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/menu/sfide.svg` | 398 763 344 361 | 0.953 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/motivo-mossa/acqua.svg` | 316 -21 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/motivo-mossa/aria.svg` | 486 -21 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/motivo-mossa/erba.svg` | -24 -21 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/motivo-mossa/fuoco.svg` | 146 -21 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/motivo-mossa/neutro.svg` | 996 -21 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/motivo-mossa/oscurita.svg` | 826 -21 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/motivo-mossa/terra.svg` | 656 -21 228 232 | 0.983 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/quantita/display.svg` | 154 -18 332 196 | 1.694 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/quantita/meno.svg` | -18 -18 256 196 | 1.306 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/quantita/piu.svg` | 402 -18 256 196 | 1.306 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/audio-off.svg` | 910 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/audio-on.svg` | 754 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/cartella.svg` | 130 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/musica.svg` | 1066 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/pausa.svg` | 442 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/play.svg` | 598 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/ricarica.svg` | 286 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/salva.svg` | -26 -15 216 220 | 0.982 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/sistema/schermo-intero.svg` | 1230.6 -22.6 230.8 235.2 | 0.981 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/stato/addormentato.svg` | 666 -9 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/stato/avvelenato.svg` | 161 321 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/stato/confuso.svg` | 331 -9 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/stato/ko.svg` | 501 321 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/stato/paralizzato.svg` | -4 -9 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/acqua.svg` | -7 278 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/elettro.svg` | 263 -2 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/erba.svg` | 263 278 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/fuoco.svg` | 533 -2 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/normale.svg` | -7 -2 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/oscurita.svg` | 533 278 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/psico.svg` | 803 278 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Blu/tipo/terra.svg` | 803 -2 324 324 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/bloccato.svg` | 576 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/connesso.svg` | -24 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/disconnesso.svg` | 376 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/errore.svg` | 1376 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/in-attesa.svg` | 776 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/in-connessione.svg` | 176 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/link.svg` | 976 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/connessione/riconnetti.svg` | 1176 -19 258 258 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/analisi.svg` | 770 25 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/arkadex.svg` | 30 25 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/cronache.svg` | 30 765 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/deposito.svg` | 400 25 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/diario.svg` | 30 395 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/impostazioni.svg` | 770 395 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/negozio.svg` | 770 765 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/salvataggio.svg` | 400 395 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/menu/sfide.svg` | 400 765 340 357 | 0.952 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/motivo-mossa/acqua.svg` | 380 -10 260 260 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/motivo-mossa/aria.svg` | 580 -10 260 260 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/motivo-mossa/erba.svg` | -20 -10 260 260 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/motivo-mossa/fuoco.svg` | 180 -10 260 260 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/motivo-mossa/neutro.svg` | 1180 -10 260 260 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/motivo-mossa/oscurita.svg` | 980 -10 260 260 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/motivo-mossa/terra.svg` | 780 -10 260 260 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/quantita/display.svg` | 235 -9 450 248 | 1.815 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/quantita/meno.svg` | -13 -9 340 248 | 1.371 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/quantita/piu.svg` | 593 -9 340 248 | 1.371 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/audio-off.svg` | 1053 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/audio-on.svg` | 873 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/cartella.svg` | 153 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/musica.svg` | 1233 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/pausa.svg` | 513 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/play.svg` | 693 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/ricarica.svg` | 333 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/salva.svg` | -27 -17 244 244 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/sistema/schermo-intero.svg` | 1414 -21 252 252 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/stato/addormentato.svg` | 691 -4 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/stato/avvelenato.svg` | 171 301 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/stato/confuso.svg` | 346 -4 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/stato/ko.svg` | 521 301 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/stato/paralizzato.svg` | 1 -4 388 388 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/acqua.svg` | -12 293 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/elettro.svg` | 278 -7 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/erba.svg` | 278 293 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/fuoco.svg` | 568 -7 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/normale.svg` | -12 -7 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/oscurita.svg` | 568 293 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/psico.svg` | 858 293 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |
| `public/ui/studio/individuali/Scuro/tipo/terra.svg` | 858 -7 354 354 | 1 | individual-only | high | Asset specifico a tipo/stato/creatura; non è una superficie UI sostituibile. |

## player-kit-icon (26)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/player-kit/icon-activity.svg` | 0 0 175 200 | 0.875 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-analysis.svg` | 0 0 242 241 | 1.004 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-bag.svg` | 0 0 194 206 | 0.942 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-book.svg` | 0 0 239 241 | 0.992 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-box.svg` | 0 0 202 211 | 0.957 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-home.svg` | 0 0 199 202 | 0.985 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-map.svg` | 0 0 197 198 | 0.995 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-options.svg` | 0 0 197 201 | 0.98 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-shop.svg` | 0 0 235 241 | 0.975 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/icon-team.svg` | 0 0 205 210 | 0.976 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/item-antidote.svg` | 0 0 192 258 | 0.744 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/item-coin.svg` | 0 0 181 184 | 0.984 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/item-potion.svg` | 6 10 177 251.472 | 0.704 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/item-revive.svg` | 0 0 214 219 | 0.977 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/item-sphere.svg` | 0 0 249 251 | 0.992 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/item-superpotion.svg` | 0 0 185 258 | 0.717 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/map-pin.svg` | 0 0 142 187 | 0.759 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/reward-badge.svg` | 0 0 128 128 | 1 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-dark.svg` | 0 0 237 244 | 0.971 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-earth.svg` | 0 0 238 245 | 0.971 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-electric.svg` | 0 0 247 250 | 0.988 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-fire.svg` | 0 0 242 247 | 0.98 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-grass.svg` | 0 0 252 252 | 1 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-normal.svg` | 0 0 241 246 | 0.98 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-psychic.svg` | 0 0 241 247 | 0.976 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |
| `public/ui/player-kit/type-water.svg` | 0 0 249 252 | 0.988 | direct-target | high | Già progettato per il renderer PlayerUi; non va usato come semplice border-image generico. |

## other (5)

| Asset | ViewBox | Rapporto | Suitability | Confidenza | Nota |
|---|---:|---:|---|---|---|
| `public/ui/studio/Blu/divisori-orizzontali.svg` | 0 0 800 260 | 3.077 | catalog-only | medium |  |
| `public/ui/studio/Comuni/giocatore1.svg` | 0 0 500 500 | 1 | catalog-only | medium |  |
| `public/ui/studio/Comuni/giocatore2.svg` | 0 0 500 500 | 1 | catalog-only | medium |  |
| `public/ui/studio/runtime/window.svg` | 0 0 1060 320 | 3.313 | catalog-only | medium |  |
| `public/ui/studio/Scuro/divisori-orizzontali.svg` | 0 0 920 280 | 3.286 | catalog-only | medium |  |

## Regola di integrazione

Gli asset con decorazioni interne, testi, gemme o icone non devono essere passati al vecchio trio `window/command/selected` come semplici `border-image`: il renderer li deformerebbe o li duplichererebbe. Per questi asset la sostituzione corretta è una destinazione esplicita per ruolo e schermata, con dimensioni target e, quando serve, una variante per breakpoint.
