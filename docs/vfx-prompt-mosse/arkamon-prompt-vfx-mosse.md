# Arkamon · Prompt VFX di tutte le mosse

27 novembre 2026. Prompt per tutte le **515 mosse** degli Arkamon, con i due metodi scelti:

1. **ImageGen (ChatGPT): 9 pose chiave** in un foglio 3×3. I fotogrammi intermedi li calcolo io, così l'effetto gira a 24 fps.
2. **Gemini: una clip** (MP4 se puoi, altrimenti GIF). La scontorno e la trasformo nello sprite del gioco.

I prompt sono in inglese perché i modelli rispondono meglio. Le istruzioni per te sono in italiano. Le mosse sono divise per tipo in otto file, nel repository in `docs/vfx-prompt-mosse/` e allegati in chat:

| Tipo | Mosse | Documento |
|---|---:|---|
| Normale | 76 | `arkamon-prompt-vfx-normale.md` |
| Fuoco | 80 | `arkamon-prompt-vfx-fuoco.md` |
| Acqua | 67 | `arkamon-prompt-vfx-acqua.md` |
| Erba | 61 | `arkamon-prompt-vfx-erba.md` |
| Elettro | 48 | `arkamon-prompt-vfx-elettro.md` |
| Terra | 60 | `arkamon-prompt-vfx-terra.md` |
| Psico | 58 | `arkamon-prompt-vfx-psico.md` |
| Oscurità | 65 | `arkamon-prompt-vfx-oscurita.md` |

## Come procedere

1. **Una conversazione per serie.** Apri una conversazione nuova con ChatGPT o con Gemini e incolla **una volta** il blocco comune dello strumento. Poi manda **una mossa per messaggio**, copiando il suo blocco. Tieni nella stessa conversazione le mosse di uno stesso Arkamon o di uno stesso tipo: lo stile resta uniforme. Dopo 10–15 mosse apri una conversazione nuova e incolla di nuovo il blocco comune.
2. **Allegati facoltativi.** Puoi allegare lo sprite dell'Arkamon (`public/sprites/front_sprites/<numero>.png`) e uno degli esempi di stile (foglio MapleStory o GIF anime). Servono solo per colori e stile.
3. **Sfondo.** Ogni blocco comincia con la riga BACKGROUND:
   - **verde** per la maggior parte degli effetti;
   - **magenta** per quelli con foglie, erba o verde, che su fondo verde sparirebbero;
   - **nero** solo per gli effetti fatti di sola luce.

   ImageGen deve comunque provare a dare lo sfondo trasparente: il colore serve solo se la trasparenza non arriva. Conteggi: 393 verde, 110 magenta, 12 nero.
4. **Rigenera se:**
   - la griglia non è regolare o le pose cambiano scala o centro (ImageGen);
   - la camera si muove o l'effetto è piccolo nel quadro (Gemini);
   - lo sfondo non è uniforme;
   - compaiono la creatura, un volto, scritte o un terreno.

   Frase utile per ImageGen: *«Rifallo con 9 celle identiche, stessa scala e stesso centro, nessun elemento che esce dalla cella»*.
5. **Consegna.**
   - ImageGen: `asset-inbox/vfx/imagegen/<id>_<mossa>.png`
   - Gemini: `asset-inbox/vfx/gemini/<id>_<mossa>.mp4` (oppure `.gif`)

   Il nome del file è indicato sopra ogni blocco, per esempio `004_carica_ossidrica`. Se fai più versioni, aggiungi `_a`, `_b`. Puoi anche mandarmele qui.
6. **Priorità.** Gli starter (Vyrath, Darklaw, Felyss) e gli Arkamon che si incontrano per primi. Le 8 mosse pilota sono già nel gioco: rifalle solo se vuoi provare Gemini anche su di loro.

**Cosa faccio io con le consegne:**
- tolgo lo sfondo e allineo le pose;
- calcolo gli intermedi per ImageGen;
- ritaglio un quadrato stabile per Gemini;
- imposto l'impatto (fermo immagine e scossa), la scala e la posizione;
- scelgo la versione migliore per ogni mossa e la provo nel VFX Lab.

In tutto ci sono 515 mosse: conviene procedere a lotti, per esempio un tipo alla volta.

## Blocco comune · ImageGen

Da incollare una volta all'inizio della conversazione con ChatGPT.

```
Create the KEY POSES of a 2D special-attack effect for a fantasy creature-battle video game.
The game will generate the in-between frames from your key poses, so think like an animation key artist.

STYLE: hand-drawn Japanese anime effects animation and Korean MMO skill effects: bold readable silhouettes,
crisp clean edges, flat cel-shaded colour with one or two shadow tones, bright highlight shapes, thin glowing
rim lines, layered secondary elements (sparks, debris, smoke puffs, particles). Rich in detail but readable.
No 3D render, no photorealism, no motion blur, no text, no numbers, no ground or scenery.

SHEET: one square image, a regular 3 x 3 grid of 9 equal square cells, no borders or gaps drawn between
cells. The cells are consecutive key poses in reading order (left to right, top to bottom):
1 anticipation begins, 2-3 build-up, 4 impact (largest, brightest), 5-6 follow-through, 7-8 dissipation,
9 last faint particles.
- Same scale and same centre point in every cell; nothing crosses the edge of its cell.
- The effect fills most of the cell at the impact pose.
- Continuity: the SAME elements move, grow and fade from one pose to the next; do not make new elements
  pop up in unrelated places, so that in-betweens can be drawn smoothly.
- Background: transparent (alpha). If transparency is not possible, use the flat colour given in the
  BACKGROUND line of the move, filling everything outside the effect.
- The creature named below is only a reference for colours and motifs: do NOT draw the creature, nor any
  face, character or text. If I attach images, use them only as colour and style references.

I will now send one move per message. For each message, generate one sheet.
```

## Blocco comune · Gemini

Da incollare una volta all'inizio della conversazione con Gemini.

```
Make a short animated clip of a 2D special-attack effect for a fantasy creature-battle video game.

STYLE: hand-drawn Japanese anime effects animation and Korean MMO skill effects: bold readable silhouettes,
crisp clean edges, flat cel-shaded colour with one or two shadow tones, bright highlight shapes, thin glowing
rim lines, layered secondary elements (sparks, debris, smoke puffs, particles) each moving on its own arc.
Rich in detail but readable. Snappy anticipation, a strong impact frame, then follow-through and a clean
dissipation. No 3D render, no photorealism, no motion blur, no film grain.

CAMERA AND FRAME
- 16:9, highest resolution available, locked-off camera: no camera movement, zoom, pan or shake.
- The effect is centred and LARGE: at its biggest it fills about three quarters of the frame height.
  Nothing touches or leaves the frame edges.
- The background is the single flat colour of the BACKGROUND line, evenly lit, with no gradient, shadow,
  vignette or texture. The effect never uses that colour.
- Nothing else in the frame: no ground plane, no scenery, no characters, no creatures, no faces, no text.
  The creature named below is only a reference for colours and motifs: do NOT show it.

TIMING
- Half a second of empty background, then about 1.5 to 2 seconds of effect (2.5 for a SUPREME move),
  then it fades away COMPLETELY and the background stays empty until the end.

I will now send one move per message. For each message, make one clip.
```

Il file `prompt-vfx-mosse.csv` contiene gli stessi prompt già completi (blocco comune più mossa), una riga per mossa e per strumento: è utile se vuoi automatizzare.
