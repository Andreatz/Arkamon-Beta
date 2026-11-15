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
I punti `player` ed `enemy` sono già registrati per le inquadrature della Fase 1.
