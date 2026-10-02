# Transizioni fra scene

I cambi di schermata usano un portale di energia blu e dorata: nebulosa in rotazione, raggi, scariche e anelli che si espandono. L'evoluzione usa la stessa animazione in violetto, con un ritmo più lento. L'ingresso in battaglia mantiene il video originale e il simbolo VS; il video non compare nei normali passaggi.

| Destinazione | Effetto | Durata indicativa |
| --- | --- | --- |
| Titolo, laboratorio, mappe, città, percorsi e deposito | Portale blu e dorato | 1,43 s |
| Evoluzione | Portale violetto | 1,98 s |
| Battaglia | Video originale, dal secondo 5 al secondo 8 | Circa 3 s, oltre all'eventuale caricamento |

La scena di destinazione viene montata soltanto dopo i primi 180 ms, quando l'effetto copre interamente il gioco. Nel frattempo la città o il percorso in uscita conserva il proprio luogo. La musica segue la scena visualizzata.

Durante il passaggio i controlli della scena sono temporaneamente inattivi. La griglia protegge anche il movimento tramite tastiera; gli strumenti Admin rimangono disponibili. Le richieste ravvicinate usano l'ultima destinazione, e i completamenti di animazioni precedenti vengono ignorati. Un reindirizzamento automatico mantiene la copertura senza esporre una scena vuota.

La preferenza di sistema `prefers-reduced-motion` rende il cambio immediato e salta il video. Se il video di battaglia fallisce o rimane fermo, il portale fornisce una riserva animata e un limite di tempo libera sempre i comandi.

## Modifiche e verifiche

- `src/components/transitions/sceneTransitionProfiles.ts`: tempi, modalità e colore per destinazione.
- `sceneTransitions.css`: portale e riserva animata del video.
- `SceneTransition.tsx`: cambio di scena e blocco temporaneo dei comandi.
- `sceneTransitionState.ts`: coordinamento delle richieste e dei completamenti.
- `SceneNavigationContext.ts`: navigazione visualizzata e stato dei comandi.

Le mappe interne alla griglia mantengono la propria animazione esistente, senza rimontare tutta la scena a ogni turno o movimento. Il VFX Lab resta accessibile tramite `#vfx-lab`. Il catalogo VFX generato non viene modificato.

Eseguire `npm test` e `npm run build` prima del commit. I test del coordinamento verificano il cambio sotto copertura, i cambi di luogo, le richieste multiple, l'annullamento, i reindirizzamenti, i completamenti obsoleti e il movimento ridotto. La verifica visiva nel browser completa questi controlli per i percorsi provati; non equivale a una revisione manuale di tutte le combinazioni di scene.
