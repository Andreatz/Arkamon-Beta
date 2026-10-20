# Mappa degli asset UI realmente utilizzabili

> Archivio del 20 ottobre 2026: **Mappa asset precedente alla gallery**. Origine nella cartella della sessione: `outputs/UI-Asset-Usage-Map-2026-10-20.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Questa mappa risponde alla domanda: quali file possono sostituire le tre superfici comuni `window`, `command` e `selected`, e quali invece devono essere montati come widget indipendenti.

## Criterio

Un asset è **superficie diretta** quando contiene una cornice completa e può essere montato come SVG autonomo nel rettangolo del componente. È **candidato a cornice** quando può fornire il disegno di un pannello o pulsante, ma deve essere ricomposto su una tela SVG dedicata alla dimensione reale. È **specializzato** quando contiene già una griglia, un testo, una barra HP, una coppia di pulsanti o altri elementi che non devono essere stirati né trasformati in `border-image`. È **solo icona/decorazione** quando non deve dipingere il fondo del componente.

Il catalogo della checkout analizzata contiene **288 SVG**. La classificazione strutturata è in [ui-asset-role-audit-2026-10-20.json](../../outputs/evidence/ui-asset-role-audit-2026-10-20.json); la resa visiva dei principali candidati è in [ui-asset-role-sheet-2026-10-20.png](../../outputs/evidence/ui-asset-role-sheet-2026-10-20.png). La copia Desktop allegata contiene 414 SVG complessivi; il confronto è in [UI-Asset-Revision-Comparison-2026-10-20.md](./UI-Asset-Revision-Comparison-2026-10-20.md).

## Asset che possono sostituire una superficie comune

| Ruolo reale | Asset da usare | ViewBox | Uso corretto | Stato rispetto al runtime |
|---|---|---:|---|---|
| Pannello largo vuoto | [`Scuro/box-1.svg`](../../public/ui/studio/Scuro/box-1.svg) / [`Blu/box-1.svg`](../../public/ui/studio/Blu/box-1.svg) | 1060×320 | Scheda, dettaglio o contenitore largo con area centrale libera | È la sorgente dell’attuale `window.svg`; oggi viene ancora consumato tramite il trio comune |
| Pannello largo con spalla laterale | [`Scuro/box-2.svg`](../../public/ui/studio/Scuro/box-2.svg) / [`Blu/box-2.svg`](../../public/ui/studio/Blu/box-2.svg) | 1060×330 | Pannello con rail laterale, lista + dettaglio, toolbar verticale | Non montato come ruolo autonomo |
| Pannello inventario a griglia | [`Scuro/box-inventario.svg`](../../public/ui/studio/Scuro/box-inventario.svg) / [`Blu/box-inventario.svg`](../../public/ui/studio/Blu/box-inventario.svg) | 1060×650 / 960×600 | Inventario composto con griglia già disegnata | Non va usato per l’attuale griglia Deposito 7×5: la griglia interna è parte dell’asset |
| Dialogo scuro | [`Scuro/dialogo-scuro.svg`](../../public/ui/studio/Scuro/dialogo-scuro.svg) | 820×430 | Finestra testuale con coda fumetto | Sostituisce una finestra solo quando il contenuto è davvero un dialogo |
| Dialogo chiaro | [`Scuro/dialogo-bianco.svg`](../../public/ui/studio/Scuro/dialogo-bianco.svg) / [`Blu/dialogo-bianco.svg`](../../public/ui/studio/Blu/dialogo-bianco.svg) | 820×430 / 860×460 | Conferma, messaggio o tooltip largo | Superficie completa, non cornice elastica |
| Banner base | [`Scuro/banner.svg`](../../public/ui/studio/Scuro/banner.svg) / [`Blu/banner.svg`](../../public/ui/studio/Blu/banner.svg) | 1060×380 / 920×340 | Finestra con targa superiore e chiusura | Composizione con dettagli fissi; va assegnata a una schermata/banner |
| Banner azioni | [`Scuro/banner-azioni.svg`](../../public/ui/studio/Scuro/banner-azioni.svg) / [`Blu/banner-azioni.svg`](../../public/ui/studio/Blu/banner-azioni.svg) | 1060×420 / 920×390 | Banner che contiene due zone d’azione interne | Non è un pannello generico: le due placche sono già nel disegno |
| Banner QR | [`Scuro/banner-qr.svg`](../../public/ui/studio/Scuro/banner-qr.svg) / [`Blu/banner-qr.svg`](../../public/ui/studio/Blu/banner-qr.svg) | 1060×620 / 960×560 | Schermata QR/connessione con riquadri e badge | Solo schermata QR/connessione |
| Barra orizzontale | [`Scuro/barra-scura.svg`](../../public/ui/studio/Scuro/barra-scura.svg), [`Scuro/barra-bianca.svg`](../../public/ui/studio/Scuro/barra-bianca.svg) | 920×190 | Header, barra di sezione, fascia con contenuto centrale | Candidata a superficie diretta o a composizione con centro separato |
| Pulsante normale | [`Scuro/bottone.svg`](../../public/ui/studio/Scuro/bottone.svg) / [`Blu/bottone.svg`](../../public/ui/studio/Blu/bottone.svg) | 880×210 | Comando orizzontale senza stato selezionato | È la sorgente dell’attuale `command.svg` |
| Pulsante selezionato | [`Scuro/bottone-selezionato.svg`](../../public/ui/studio/Scuro/bottone-selezionato.svg) / [`Blu/bottone-selezionato.svg`](../../public/ui/studio/Blu/bottone-selezionato.svg) | 880×210 | Tab, azione primaria, riga attiva | È la sorgente dell’attuale `selected.svg` |
| Pulsante chiaro | [`Scuro/bottone-bianco.svg`](../../public/ui/studio/Scuro/bottone-bianco.svg) / [`Blu/bottone-bianco.svg`](../../public/ui/studio/Blu/bottone-bianco.svg) | 880×210 | Stato chiaro o azione secondaria ad alto contrasto | Non assegnato a un ruolo runtime dedicato |
| Pulsante bronzo/grigio | [`Comuni/bottone-bronzo.svg`](../../public/ui/studio/Comuni/bottone-bronzo.svg), [`Comuni/bottone-grigio.svg`](../../public/ui/studio/Comuni/bottone-grigio.svg) | 920×190 | Stati semantici di azione, conferma o disabilitazione | Candidati migliori per distinguere le azioni condivise dai comandi RPG |
| Cornice ritratto | [`Scuro/cornice-arkamon.svg`](../../public/ui/studio/Scuro/cornice-arkamon.svg), [`Scuro/cornice-ritratto.svg`](../../public/ui/studio/Scuro/cornice-ritratto.svg) | 540×520 / 540×580 | Ritratto grande e hero del compagno | La prima è già usata come `RPG_SKINS.portrait` |
| Cornice slot | [`Scuro/cornice-piccola.svg`](../../public/ui/studio/Scuro/cornice-piccola.svg), [`Scuro/cornice-piccola-selezionata.svg`](../../public/ui/studio/Scuro/cornice-piccola-selezionata.svg), [`Scuro/cornice-selezione.svg`](../../public/ui/studio/Scuro/cornice-selezione.svg) | 260×260 / 260×260 / 280×280 | Slot squadra, selezione, mini-ritratto | Deve essere montata come cornice quadrata indipendente |

## Asset utilizzabili come controlli autonomi

Questi file non devono ereditare il ruolo `command`: contengono la propria geometria e il proprio significato.

| Controllo | Asset Blu | Asset Scuro | Uso |
|---|---|---|---|
| Chiusura normale/rossa | `button-chiusura.svg`, `button-chiusura-rosso.svg` | `button-chiusura.svg`, `button-chiusura-rosso.svg` | Chiudi finestra, annulla o uscita distruttiva |
| Conferma circolare | `button-circolare-check.svg`, `button-circolare-on.svg`, `button-circolare-off.svg` | stesse varianti | Check, stato attivo/inattivo, conferma compatta |
| Freccia pagina | `pulsante-freccia-sinistra.svg`, `pulsante-freccia-destra.svg` | stesse varianti | Paginazione e cambio box |
| Fuga/negozio | `pulsante-fuga.svg`, `pulsante-negozio.svg` | stesse varianti | Azioni contestuali con icona propria |
| Toggle | `toggle-on.svg`, `toggle-off.svg` | `toggle-on.svg`, `toggle-off.svg` | Impostazioni binarie |
| Stepper numerico | `selettore-numerico.svg` | `selettore-numerico.svg` | Meno + display + più già composti |
| Checkbox | `checkbox.svg`, `pulsante-checkbox.svg`, `checker-off.svg` | stesse varianti | Selezione e filtri |
| Slider | `slider-orizzontale.svg`, `slider-verticale.svg` | stesse varianti | Valori continui; serve un thumb/track runtime separato se il valore è dinamico |
| Indicatore | `indicatore-circolare-acceso.svg`, `indicatore-circolare-spento.svg` | stesse varianti | Stato di collegamento o presenza |

## Asset specializzati che non vanno trasformati in pannelli generici

| Asset | Perché è specializzato | Destinazione consigliata |
|---|---|---|
| `Comuni/dialogo-lab.svg` | Include etichetta `PROFESSORE`, testo dimostrativo e indicatore di avanzamento | [`LaboratorioScene.tsx`](../../src/scenes/LaboratorioScene.tsx), dialoghi/tutorial |
| `Comuni/capsula-lab-blu.svg`, `capsula-lab-nera.svg`, `capsula-lab-viola.svg` | È una macchina/capsula verticale, non una superficie | Laboratorio: oggetto decorativo o slot di laboratorio |
| `Comuni/infobox.svg` | Ha una testata e un layout interno già definito | Informazioni contestuali, guida, obiettivo corrente |
| `Comuni/nuova-partita.svg` | Contiene già la scritta `NUOVA PARTITA` | Titolo/azione iniziale fissa; non usarlo per etichette arbitrarie |
| `Comuni/percorso.svg` | Contiene `PERCORSO 1` e `2 AZIONI RIMASTE` | Percorso con testo fisso oppure variante SVG dedicata per ogni stato |
| `Comuni/barra-giocatore.svg` | Barra HP completa con badge, livello e segmento inferiore | HUD giocatore in battaglia |
| `Comuni/hp-bar.svg`, `hp-bar-enemy.svg` | Sono composizioni HP lato giocatore/nemico | HUD battaglia; non `RpgWindow` |
| `Comuni/giocatore1.svg`, `giocatore2.svg` | Emblemi circolari del giocatore | Selettore giocatore, badge, profilo |
| `Blu/Scuro/squadra.svg` | Contiene sei slot già disposti in una striscia | Riepilogo squadra a sei posti; non singolo slot |
| `Blu/Scuro/pulsanti-connessione.svg` | Contiene una serie di otto simboli di connessione | Sprite/strip: va ritagliato o convertito in singoli asset |
| `Blu/Scuro/pulsanti-sistema.svg` | Contiene una serie di icone di sistema | Sprite/strip: va ritagliato o convertito in singoli asset |
| `Blu/Scuro/icone.svg`, `icone-menu.svg`, `icone-mosse.svg`, `icone-stati.svg`, `icone-tipi-mosse.svg` | Sono fogli o strisce di più icone | Catalogo di icone; non superficie UI |

## Asset individuali da collegare ai dati di gioco

La cartella `studio/individuali` contiene le varianti che rendono davvero specifica l’interfaccia:

- `menu/*`: icone di Arkadex, Deposito, Diario, Analisi, Negozio, Sfide, Salvataggio e Impostazioni;
- `tipo/*`: icone dei tipi Arkamon;
- `stato/*`: paralisi, veleno, sonno, confusione e KO;
- `motivo-mossa/*`: motivi di tipo/elemento delle mosse;
- `connessione/*`: connesso, disconnesso, errore, attesa e riconnessione;
- `sistema/*`: audio, musica, pausa, play, salva, ricarica e schermo intero;
- `quantita/*`: meno, display e più per il controllo quantità.

Questi file devono essere assegnati a `KitIcon`, badge, indicatori e controlli singoli. Non sostituiscono un pannello e non devono finire nel ruolo `window`, `command` o `selected`.

## Collegamento con il codice attuale

Oggi il collegamento effettivo è concentrato in pochi punti:

1. [`src/components/rpg/index.tsx`](../../src/components/rpg/index.tsx) espone solo `RPG_SKINS.window`, `command`, `selected` e `portrait`.
2. [`src/player-ui/kit.tsx`](../../src/player-ui/kit.tsx) converte `panel-*`, `card-*`, `slot-*` e pulsanti in `RpgFrame`; così `panel-wide`, `card-default`, `slot-default`, `card-selected-cyan` e `card-selected-violet` non vengono usati come asset distinti.
3. [`src/components/ui/GameButton.tsx`](../../src/components/ui/GameButton.tsx) usa `RpgFrame` per default/primary e `player-kit/command-cancel.svg` per il solo tono danger; gli asset Studio `button-chiusura-rosso.svg`, `pulsante-fuga.svg` e `bottone-grigio.svg` non sono collegati.
4. [`scripts/build-rpg-svg-adapters.mjs`](../../scripts/build-rpg-svg-adapters.mjs) genera gli adapter runtime. Questo è il punto in cui la ricchezza degli asset viene ridotta alle tre famiglie comuni.
5. [`src/ui-studio/UiDesignRuntime.tsx`](../../src/ui-studio/UiDesignRuntime.tsx) può già applicare un asset scelto dal catalogo, ma lo monta come sfondo della superficie trovata. Per asset compositi il ruolo deve diventare esplicito; altrimenti `background-size: fill` o il `border-image` deformano l’intera composizione.

## Mappa di sostituzione prioritaria

| Priorità | Componenti | Asset da collegare | Risultato |
|---:|---|---|---|
| 1 | `KitPanel` e `KitFrame panel-*` | `player-kit/panel-wide.svg`, `player-kit/panel-medium.svg`, poi varianti Studio `box-1`, `box-2`, `box-inventario` | Pannelli distinti per largo, medio, inventario e deposito |
| 2 | `KitButton` e tab | `player-kit/button-default.svg`, `button-primary.svg`, `card-default.svg`, `card-selected-*`, `slot-*` | Normal, attivo, card e slot non condividono più una cornice |
| 3 | `GameButton` | `bottone.svg`, `bottone-selezionato.svg`, `bottone-grigio.svg`, `button-chiusura-rosso.svg`, frecce dedicate | Azione primaria, secondaria, distruttiva e navigazione riconoscibili |
| 4 | Laboratorio, dialoghi e notifiche | `dialogo-lab.svg`, `capsula-lab-*`, `dialogo-bianco/scuro.svg`, `infobox.svg` | Le scene narrative usano la loro composizione reale |
| 5 | Battaglia | `barra-giocatore.svg`, `hp-bar.svg`, `hp-bar-enemy.svg` | HUD HP dedicato, senza forzare una finestra RPG |
| 6 | Menu e sistema | `individuali/*/menu`, `individuali/*/sistema`, `pulsanti-connessione`, `pulsanti-sistema` estratti in singoli file | Le icone effettive diventano selezionabili dal runtime |

## Decisione tecnica

La soluzione corretta non è scegliere un quarto nome per il trio. È passare da una mappa globale per famiglia a una mappa per **ruolo + schermata + breakpoint + stato**. Per esempio:

```text
player.menu.journey.desktop.surface      -> window-menu-1140x650.svg
player.team.detail.desktop.surface      -> window-team-633x654.svg
player.deposit.grid.desktop.surface     -> window-deposit-grid-1156x600.svg
player.bag.slot.desktop.normal           -> slot-bag-187x225.svg
player.bag.slot.desktop.selected         -> slot-bag-selected-187x225.svg
shared.command.desktop.primary           -> command-primary-157x53.svg
shared.command.mobile.back               -> command-back-94x28.svg
battle.player.hp                         -> battle-hp-player-1020x220.svg
laboratory.dialog                        -> dialogo-lab-<target>.svg
```

Gli asset esistenti sono quindi utilizzabili in modo concreto, ma per i rettangoli misurati dalla UI occorre creare le varianti finali con tela esatta. Il browser deve montarle come elemento diretto (`img`/`background` dedicato) o tramite un 9-slice dichiarato per quello specifico ruolo; non deve riutilizzare un unico `window`, `command` o `selected` per geometrie incompatibili.

Le tele finali da consegnare al reparto grafico sono elencate nella [specifica dimensionale completa](./UiFrame-Spec-2026-10-20.md), con desktop 1920×1080, compatto 1280×900, telefono 390×844 e le scene speciali Evoluzione/Lega.
