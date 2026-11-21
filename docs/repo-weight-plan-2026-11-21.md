# Peso del repository · piano (audit fase 9, 21 novembre 2026)

Misure dall'albero di `main` tramite l'API GitHub (nessun blob scaricato) e dalla dimensione del repository.
Il comando `node scripts/repo-weight-report.mjs` ripete la misura su un clone locale senza modificare nulla.

## Situazione

- **Repository su GitHub: 16,9 GB** (storia compresa). **Checkout di `main`: 19,9 GB**, 29.010 file.
- Il gioco pubblicato usa già il repository come archivio dei media pesanti: `package-web-assets.mjs` copia in `dist/`
  solo l'interfaccia e i ritratti, e fa caricare pagine native, suoni e VFX da `raw.githubusercontent.com/<revisione fissata>/public/`
  (`src/data/media-release.json`). Per questo i media non possono semplicemente sparire dalla storia.

| Cartella | Peso | File | Ruolo |
| --- | ---: | ---: | --- |
| `public/sprites/arkamon` | 6,4 GB | 3.434 | sorgente delle animazioni per specie; in `dist/` va solo `idle-poster.webp` |
| `public/sprites/arkamon-paged` | 5,4 GB | 9.970 | **runtime** (pagine native caricate dal CDN fissato) |
| `animation-source/raw` | 2,3 GB | 1.010 | video grezzi delle animazioni |
| `public/sprites/animation` | 2,3 GB | 1.010 | **copia identica** di `animation-source/raw` (stessi blob) |
| `public/sounds` | 1,0 GB | 5.566 | **runtime** (CDN fissato) |
| `public/vfx` | 0,7 GB | 529 | **runtime** (CDN fissato) |
| `vfx-source` | 0,6 GB | 1.446 | sorgenti e generazioni dei VFX |
| `public/sprites/front_sprites` + `back_sprites` | 0,5 GB | 316 | ritratti; quelli giocabili vanno in `dist/` |
| altro (`public/ui`, sfondi, mappe, docs, `asset-inbox`, `old_files`) | 0,6 GB | — | interfaccia e documentazione |

Per estensione: WebP 11,8 GB · MP4 4,7 GB · PNG 2,1 GB · WAV 0,6 GB · MP3 0,3 GB.

## Interventi proposti, dal più sicuro al più invasivo

1. **Togliere la copia `public/sprites/animation`** (2,3 GB di checkout). Non è letta dal codice né dai pacchetti:
   ha gli stessi blob di `animation-source/raw`. Non riduce la storia (Git conserva un solo blob), ma alleggerisce
   ogni checkout e ogni copia di `public/`. *Non distruttivo.*
2. **Non versionare più i sorgenti nuovi** (`animation-source`, `vfx-source`, `asset-inbox`, frame grezzi di
   `public/sprites/arkamon`): `.gitignore` + archivio esterno (cartella condivisa o asset di una Release). *Non distruttivo*:
   il passato resta nella storia, il futuro smette di crescere.
3. **Spostare i media di runtime su un host dedicato** (Release GitHub a pacchetti da 192 MB già previsti da
   `package-media-release.mjs`, oppure uno storage statico/CDN) e cambiare `mediaBase` in `package-web-assets.mjs`.
   Serve una decisione su dove ospitare circa 7 GB e con quali costi. *Non distruttivo* finché la storia resta.
4. **Git LFS** per `*.webp`, `*.mp4`, `*.wav` nuovi: riduce i clone futuri ma ha quote di banda e spazio a pagamento
   e non toglie nulla dal passato senza riscrivere la storia.
5. **Riscrittura della storia** (`git lfs migrate import` oppure `git filter-repo`) per togliere i sorgenti dal passato.
   È l'unico modo di scendere sotto qualche GB, ma **cambia tutti gli hash**: rompe le revisioni fissate in
   `media-release.json` (il CDN attuale), costringe a riclonare ogni copia e invalida PR aperte. Da fare solo dopo il
   punto 3, con un backup completo (`git clone --mirror`) e una finestra in cui nessuno lavora sul repository.

Conversione degli sprite: le pagine runtime sono già WebP. AVIF ridurrebbe ancora il peso, ma richiede di rigenerare
e rifissare tutte le pagine native e di verificare la decodifica sui dispositivi della diretta: va pianificata insieme al punto 3.

## Decisioni richieste

- Posso togliere `public/sprites/animation` (punto 1) e aggiungere le regole del punto 2?
- Dove ospitare i media di runtime (punto 3): Release GitHub, uno storage esterno, o restare sul repository?
- La riscrittura della storia (punto 5) va fatta? Se sì, quando, e chi deve riclonare.

Nessuna di queste operazioni è stata eseguita: in questa fase c'è solo lo strumento di misura.
