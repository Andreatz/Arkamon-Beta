# Modulo di regia (`src/motion`)

Fondamenta della presentazione cinematografica: token di movimento, cinepresa,
palco a livelli, effetti a schermo intero e sequenziatore. Nessuna dipendenza
nuova: usa framer-motion, già presente. Il modulo non decide mai un esito di
gioco; mette in scena risultati già calcolati dal motore.

Anteprima: `npm run dev`, poi `http://localhost:3000/#stage-lab`
(Admin → *Apri un laboratorio* → *Cinepresa e sequenze*).

## Token (`tokens.ts`)

```ts
import { motionTransition, resolveDuration } from '@/motion'
const { reducedMotion, speed } = useGameMotionPreferences()

<motion.div transition={motionTransition('base', 'out', { reducedMotion, speed })} />
```

- Durate: `instant` 90, `fast` 160, `base` 240, `slow` 400, `scene` 700 ms.
- Curve: `linear`, `out`, `in`, `inOut`, `back`. Molle: `snappy`, `soft`, `heavy`.
- `resolveDuration` scala con la velocità e si annulla con il movimento ridotto;
  `resolveHold` conserva i tempi di lettura.
- In CSS: `transition: transform var(--motion-fast) var(--ease-out);`.
  `<MotionRoot />` aggiorna `--motion-scale` (1 normale, 0.5 rapida, 0 ridotto).
  Un test verifica che `index.css` e `tokens.ts` restino allineati.

## Palco e cinepresa (`Stage.tsx`, `useCameraRig.ts`, `camera.ts`)

```tsx
const rig = useCameraRig({ focusPoints: { enemy: { x: 0.73, y: 0.36 } } })

<Stage rig={rig} className="absolute inset-0">
  <StageLayer depth={0.6} bleed={1.08} className="bg-cover" style={{ backgroundImage }} />
  <StageLayer>{/* attori: piano focale, nessuna trasformazione a riposo */}</StageLayer>
  <StageLayer depth={1.4} bleed={1.2}>{/* nebbia, luce, particelle */}</StageLayer>
</Stage>
{/* l'HUD resta fuori dal palco */}

await rig.camera.to({ focus: 'enemy', zoom: 1.3 })   // carrellata
rig.camera.impact(danno / hpMax)                      // shake proporzionale
await rig.camera.punch()                              // colpo di zoom
await rig.camera.reset()
```

- `depth` 1 è il piano focale; sotto 1 il livello è lontano e si muove meno,
  sopra 1 è un primo piano: è questo che produce la parallasse.
- `bleed` allarga un livello per coprire i bordi durante shake e panoramiche.
- A zoom 1 la camera non può traslare: il mondo copre sempre tutto il palco.
- Con il movimento ridotto la camera resta a riposo e non scuote.

## Effetti a schermo intero (`ScreenFx.tsx`)

```tsx
const fx = useScreenFx()
<ScreenFxLayer fx={fx} />

await fx.cover('black')   // dissolvenza al nero (o 'white')
await fx.reveal()
await fx.flash()          // lampo
await fx.letterbox(true)  // bande cinematografiche
```

## Sequenziatore (`director.ts`, `useDirector.ts`)

```ts
const director = useDirector('Attacco in corso')

const playback = director.play(guard(seq(
  par(call(() => fx.letterbox(true)), call(() => camera.to({ focus: 'player', zoom: 1.28 }))),
  hold(380),
  call(() => camera.to({ focus: 'enemy', zoom: 1.4, ms: 200, ease: 'inOut' })),
  par(call(() => fx.flash()), call(() => camera.impact(0.85)),
      tween({ ms: 520, from: 1, to: 0.35, update: setHp })),
  hold(520),
  par(call(() => fx.letterbox(false)), call(() => camera.reset())),
), () => fx.clear()))

await playback.finished   // 'completed' | 'cancelled'
```

- `seq`, `par`, `stagger`, `wait` (decorativa), `hold` (tempo di lettura),
  `call` (attende la promessa restituita), `tween`, `when`, `guard` (pulizia
  garantita anche in caso di annullamento).
- `useDirector` segue velocità e movimento ridotto, si ferma con la pausa di
  regia, segnala alla regia che una sequenza è in corso e annulla tutto allo
  smontaggio della scena.

## Dove è già in uso

`BattagliaScene` monta il mondo di battaglia in uno `<Stage>`: il fondale è un
livello lontano con margine e lo shake dei colpi passa da `battleRig.camera`.

La regia dell'attacco vive in `src/components/battle`:

- `battleCinematics.ts` — scelte pure: inquadrature, intensità della scossa
  (`damageTrauma`), dimensione dei dadi, tono di efficacia.
- `useBattleCinematics.ts` — aggancia cinepresa ed effetti ai momenti della
  sequenza d'attacco: `attackStart`, `release`, `impact`, `diceStart`,
  `damageReveal`, `attackEnd`, `outcome`. Nessuna chiamata blocca o modifica
  il flusso di gioco; nell'editor dei layout e nelle anteprime è inerte.
- `BattleCinematicLayer.tsx` — fascia con il nome della mossa e numero del danno.

Il danno compare soltanto in `damageReveal`, cioè dopo che i dadi lo hanno
rivelato: la regola "nessun KO prima dei dadi" resta valida.

### Momenti speciali (Fase 2)

- **Mossa Suprema** — `attackStart({ suprema: true, speciesId })` mostra prima
  `SupremeCutIn` (illustrazione dell'Arkamon in una fascia diagonale, linee di
  velocità nel colore del tipo) e si risolve a fine stacco: solo allora parte
  l'animazione dell'attacco. Con il movimento ridotto lo stacco non c'è.
- **Cattura** — `capture(plan)` mette in scena un esito già deciso dal motore:
  lancio, assorbimento, una oscillazione per dado (`battleCapture.ts`), esito.
  La sfera si apre al primo dado che porta la somma oltre la soglia. Una
  cattura riuscita è salvata prima dell'animazione.
- **Evoluzione** — `evolutionChoreography.ts` calcola l'alternanza sempre più
  rapida delle sagome; `EvoluzioneScene` aggiunge vortice, lampo bianco e
  rivelazione con l'illustrazione della nuova specie.
- **Scheda VS** — modalità di transizione `battle-vs` (`BattleVsCard.tsx`):
  i due lati entrano in diagonale con l'illustrazione del primo Arkamon. La
  modalità `battle-video` resta supportata ma non è più usata.

## Transizioni di scena (Fase 3)

`getSceneTransitionProfile(arrivo, partenza)` in `src/components/transitions/sceneTransitionProfiles.ts`
sceglie la transizione dalla coppia di scene:

| Passaggio | Modalità |
|---|---|
| Mappa principale → città/percorso | `zoom-in`: la mappa entra nel nodo, l'iride si chiude su di esso, la mappa locale si assesta dallo stesso punto |
| Città/percorso → mappa principale | `zoom-out`: la mappa riparte stretta sul luogo lasciato e si allarga |
| Mappa locale → mappa locale | `diagonal` |
| Mappa principale ↔ Deposito | `shared` (View Transitions API; senza supporto `fade`) |
| Fine battaglia o evoluzione, Lega | `white` |
| Dal titolo | `brush` · dal laboratorio `iris` · verso il titolo `fade` |
| Battaglia / evoluzione | `battle-vs` / `arkamon-dice` (invariati) |

Per agganciare un punto di fuga basta `data-transition-anchor="<nome luogo>"` su un elemento della scena;
per un elemento condiviso `data-shared-element="<nome>"` sia nella scena che esce sia in quella che entra.

`SceneTransition` precarica modulo e sfondo della scena di arrivo (`prepareScene` in `App.tsx`) e rivela
solo quando sono pronti (limite 2,5 s). Prima di animare attende che la scena sia davvero pronta: due
fotogrammi, oppure `Animation.ready` per lo zoom, così un primo fotogramma lento non taglia l'animazione.
`#transition-lab` mostra ogni modalità.

I dialoghi (`GameDialog`) segnano `html[data-arka-dialog-open]`: la scena arretra, il dialogo sale, il Menù
Partita entra a cascata dai bordi e le tessere del menù principale si accendono in sequenza
(`src/components/ui/gameDialogMotion.css`). Tutte le durate passano per `--motion-scale`.

## Interfaccia viva (Fase 4)

Moduli in `src/motion/ui/` e `src/input/`:

- `AnimatedNumber` — numeri che contano fino al nuovo valore (monete nel Menù Partita, nel negozio e sulla
  mappa; livello e HP nella Squadra). Al montaggio mostra subito il valore; con `key` per creatura o
  giocatore non conta fra due entità diverse.
- `TiltController` — un solo ascoltatore globale: tessere e carte (`.pu-menu-tile`, `.ref-trainer-card`,
  `.pu-team-slot`, `[data-tilt]`…) si inclinano verso il puntatore con le proprietà `rotate`/`scale`,
  che si sommano al `transform` dei fogli esistenti; riflesso `.arka-tilt-glare` e icona sollevata.
- `SelectionCursor scope={ref}` — cornice dorata unica che scivola verso l'elemento sotto il puntatore o
  con il fuoco (tastiera, gamepad). Usata nel Menù Partita e nel titolo.
- Menù Partita: `navigationDirection` sceglie scorrimento avanti/indietro fra schede e ribaltamento al
  cambio giocatore (`data-nav-direction` su `.pu-content`); Pagina su/giù cambia scheda; la splash art ha
  una deriva lenta e un lampo nel colore del tipo (`--arka-type-*`) al cambio creatura; le medaglie
  ottenute si incastonano.
- `src/components/ui/gameControls.css` — pelle unica dei controlli nativi (tendine, interruttori, cursori,
  campi, scelta file) a specificità zero; `useConfirmDialog` sostituisce `window.confirm` (Nuova Partita).
- `GamepadBridge` — mappatura standard: croce/levetta = frecce (con ripetizione), A conferma, B indietro,
  Start menù, LB/RB schede, vibrazione breve; senza un gestore delle frecce sposta il fuoco
  geometricamente. Con il gamepad attivo `html[data-input-mode="gamepad"]` e i suggerimenti a schermo.
