# Front sprite ufficiali nelle schermate del giocatore

Squadra, Deposito, Arkadex e Analisi mostrano sempre il front sprite ufficiale
`/sprites/front_sprites/{id}.png`, anche per le specie che hanno animazioni native.
La scelta riguarda sia le miniature sia i ritratti grandi e le evoluzioni note.
Le miniature condivise dell'intestazione e del menù seguono la stessa regola.

Il componente condiviso non consulta il manifest delle animazioni e non carica
`idle-poster.webp`. Dimensioni e limiti dei pixel visibili sono quelli del PNG
ufficiale: il ritratto conserva le proporzioni e centra l'intera figura, compresi
i front sprite rettangolari. Gli asset originali non vengono modificati.

Le animazioni di battaglia e il comando esplicito «Mostra animazione» dell'Arkadex
restano separati dai ritratti statici.

## Verifica

- Tutti i 110 front PNG esistono e corrispondono alla geometria registrata.
- I test dei ritratti verificano il front ufficiale di tutte le 110 specie,
  nelle dimensioni piccola e grande, e l'inquadratura dei PNG rappresentativi.
- Le verifiche browser percorrono tutte le pagine dell'Arkadex e richiedono
  esattamente 110 front PNG e zero poster. Ogni ritratto delle quattro sezioni
  deve mantenere tutti i pixel visibili centrati e senza ritagli.
- La consultazione a 1920×1080 funziona con i media delle animazioni bloccati,
  non modifica il salvataggio e produce quattro schermate di confronto.
- Sono mantenute le verifiche delle finestre da 900, 945 e 1080 pixel di altezza,
  del deposito diretto e della consultazione del giocatore non attivo.
