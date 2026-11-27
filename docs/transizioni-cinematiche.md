# Transizioni cinematografiche

Rifatte il 27 novembre 2026, sopra la libreria della Fase 3. Prima ogni cambio di scena passava per un velo opaco: la scena vecchia spariva, quella nuova compariva da sotto. Ora le due scene convivono.

## Come funziona

Ogni passaggio ha due tempi:

1. **Anticipazione**, sulla scena viva. La camera si muove (`[data-scene-motion='cx-<tipo>']`), mentre sopra entra il livello effetti `CinematicFx`: nuvole, luce, polvere d'oro, spirale, scie.
2. **Passaggio di consegne**:
   - **`snapshot`**: la View Transitions API fotografa l'ultimo fotogramma della scena che esce e lo anima sopra quella che entra, già viva (`html[data-arka-tx='<tipo>']::view-transition-old/new(root)`). Il livello effetti ha un nome proprio (`arka-tx-fx`) e resta vivo sopra entrambe.
   - **`overlay`**: l'anticipazione chiude lo schermo e parte la sequenza dedicata (Carta VS, dado dell'evoluzione). Alla fine la Carta VS si apre in due sulla battaglia.

Il passaggio aspetta che la scena di arrivo sia pronta (modulo e sfondo), poi che le animazioni dell'anticipazione finiscano davvero. Se partono in ritardo l'attesa ha un margine di 650 ms; la rivelazione ne ha uno di 1,6 s, poi salta all'ultimo fotogramma. Il gioco non resta mai bloccato.

## Regie

| Passaggio | Tipo | Anticipazione | Rivelazione | Suono |
|---|---|---|---|---|
| Mappa → città o percorso | `sky-dive` | Spinta sul luogo, anello d'oro, nuvole che lo incorniciano | La vista vecchia continua a tuffarsi e svanisce; le nuvole passano accanto alla camera; il luogo si assesta dall'alto | `transition.dive` |
| Città o percorso → mappa | `sky-rise` | La camera si alza, le nuvole salgono | Il luogo si allontana; la mappa si apre dal punto appena lasciato | `transition.rise` |
| Luogo → luogo | `whip` | Caricamento all'indietro, scie | Panoramica a frusta nella direzione del viaggio, letta sulla mappa principale | `transition.whip` |
| → Battaglia | `encounter` → Carta VS | Doppio lampo, scossa, spirale di lame che inghiotte la scena | Carta VS; poi le due metà si aprono sulla battaglia | `transition.encounter`, `battle.encounter` |
| Battaglia o evoluzione → luogo | `radiance` | Bagliore e raggi | La scena si scioglie nel bianco; la nuova riaffiora dalla luce con il pulviscolo | `transition.radiance` |
| Battaglia → evoluzione | `radiance` → dado | Bagliore | Sequenza del dado | `transition.radiance` |
| → Lega | `radiance` | Come sopra, più lunga | Come sopra | `transition.radiance` |
| Titolo → gioco | `gold-burst` | Spinta sul logo, scintille che si raccolgono | Il logo esplode in polvere d'oro, la camera ci passa attraverso | `transition.sparkle` |
| Laboratorio → mappa | `golden-iris` | Scintilla al centro | Cerchio d'oro che si allarga sulla mappa | `transition.iris` |
| → Titolo | `curtain` | Bande nere | La partita si spegne, il titolo affiora dal buio | `transition.curtain` |
| Altri passaggi | `dissolve` | Respiro leggero | Dissolvenza incrociata con una lama di luce | `transition.whoosh` |

Restano classici: il Deposito (elemento condiviso), la stessa scena, il primo caricamento, il movimento ridotto (nessuna transizione) e i browser senza View Transitions API.

## File

- `src/components/transitions/cinematicTransitions.ts`: scelta della regia per coppia di scene, direzione del viaggio.
- `src/components/transitions/CinematicFx.tsx`: livello effetti.
- `src/components/transitions/cinematicTransitions.css`: anticipazioni, effetti, keyframes delle istantanee, apertura della Carta VS.
- `src/components/transitions/SceneTransition.tsx`: regia dei tempi e View Transition.
- `src/data/mainMapCoords.ts`: coordinate dei luoghi (spostate dalla scena della mappa).
- `public/ui/transitions/cloud-{1,2,3}.webp`: nuvole dipinte, generate da `python3 scripts/transitions/generate-clouds.py`.
- Suoni `transition.*` in `scripts/audio/generate-sfx.py`.

## Laboratorio

`dev.html#transition-lab` usa lo stesso `SceneTransition` del gioco su scene finte, con il rallentatore (½ e ¼). La View Transition fotografa l'intera pagina, quindi nel laboratorio anche l'intestazione si muove.

## Verifiche

- Test: `src/components/transitions/__tests__/cinematicTransitions.test.ts`, più i profili esistenti.
- Nel browser: la riproduzione accelerata ricavata dal rallentatore del laboratorio, e la registrazione dei fotogrammi nel gioco vero (mappa → Venezia, risalita, frusta, incontro, fine battaglia, titolo, sipario).
- Gli ambienti senza GPU (CI, questo container) rasterizzano su CPU: i tempi reali vi risultano più lunghi del previsto. Il margine di sicurezza tiene comunque il gioco sbloccato.
