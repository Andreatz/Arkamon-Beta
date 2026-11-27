# Transizioni di scena

Versione del 27 novembre 2026. Solo l'inizio e la fine della battaglia hanno una regia: due clip generate con Flow (lotto 5, prompt nel documento di progetto «arkamon-prompt-transizioni»). Ogni altro cambio di scena è una dissolvenza semplice fra le due scene.

| Passaggio | Regia | Come |
|---|---|---|
| → Battaglia | `encounter`, clip `tx-incontro` | Schegge a spirale chiudono lo schermo al nero; al nero (1,54 s) la clip si ferma e parte la Carta VS, che poi si apre in due sulla battaglia. Suoni `transition.encounter`, `battle.encounter`. |
| Battaglia → luogo, Lega, mappa… | `radiance`, clip `tx-luce` | La luce esplode; sotto il bianco pieno (0,92 s) la scena cambia e la clip prosegue aprendosi su quella nuova. Suono `transition.radiance`. |
| Battaglia → evoluzione | `radiance`, clip `tx-luce` | Come sopra, ma al bianco la clip si ferma e parte il dado. |
| Tutti gli altri | `dissolve` | Dissolvenza incrociata di 520 ms (View Transitions API). Suono `transition.whoosh`. |
| Deposito, stessa scena, primo caricamento, evoluzione fuori battaglia | nessuna | Overlay classico (elemento condiviso, velo breve, dado). |

Le durate seguono la velocità di regia (lab: normale, veloce, rallentatori).

## Clip

- `public/ui/transitions/tx-*.mp4`: H.264 con l'alfa «impilato» (in alto il colore premoltiplicato, in basso l'opacità), 1280×720 per metà. `TransitionClip.tsx` le compone in WebGL sopra la scena, quindi funzionano uguali in Chrome, Safari e nell'app desktop.
- `src/data/transitionClips.json`: durata e istante di copertura di ciascuna clip, scritti dallo script.
- La clip guida il cambio di scena: al fotogramma di copertura chiama `onCovered`; con `clip` aspetta che la scena di arrivo sia pronta (al massimo 2,5 s) restando ferma sulla copertura, poi riparte.
- Ripieghi: senza WebGL, o se il video non parte entro 1,5 s, un velo scuro (incontro) o chiaro (luce) fa lo stesso percorso in meno di un secondo. Un limite assoluto (durata + 4 s) chiude comunque la transizione.
- Le clip si scaricano in cache 2,5 s dopo l'avvio, così la prima battaglia non le aspetta.

Rigenerare dopo una nuova consegna di Flow:

```bash
python3 scripts/transitions/build-clips.py --incontro tx_incontro.mp4 --luce tx_luce.mp4
```

Lo script scarta l'audio di Flow, toglie il verde con una chiave fatta a mano (quella di ffmpeg rendeva trasparenti i neri) e, per la luce, forza l'opacità piena nei fotogrammi del bianco. I fotogrammi di inizio, fine e copertura sono in testa allo script: vanno rimisurati se cambia la clip.

## Dove guardare

- `cinematicTransitions.ts`: scelta della regia per coppia di scene.
- `SceneTransition.tsx`: stati (copertura, sequenza dedicata, rivelazione), View Transition della dissolvenza, montaggio della clip.
- `sceneTransitionProfiles.ts`: overlay e ripieghi (velo nero o bianco senza View Transitions API).
- Laboratorio: `dev.html#transition-lab`.
