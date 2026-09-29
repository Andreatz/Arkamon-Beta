# Prima selezione visiva VFX

La scrematura considera i 113 asset importati (90 sprite sheet e 23 GIF),
con quattro fotogrammi distribuiti lungo ciascuna animazione. I 29 asset di base
rimangono disponibili come fallback. Non è una validazione finale di tutte le
animazioni in battaglia: le proposte vanno confrontate nel Lab e poi provate
su mosse rappresentative. Non sono state modificate le associazioni delle mosse.

## Selezione ridotta

Nel VFX Lab **Solo selezione consigliata**, attivo all'apertura, mostra questi
10 effetti. **Confermato** indica una scelta espressa dall'utente; **Proposta**
indica una selezione preliminare dell'assistente, non ancora approvata.

| Famiglia / ruolo | Effetto | Stato | Posizione | Zoom | Motivo |
| --- | --- | --- | --- | --- | --- |
| Elettro leggero | ChargedCannon Blue Hit | Proposta | target | 1.25× | Scarica ciano compatta, 417 ms |
| Elettro medio | Spark 0 | Confermato | target | 1.5× | Scelta dell'utente |
| Elettro forte | Tynus Lightning 2 | Confermato | target | 1.5× | Scelta dell'utente; non limitato alle Supreme |
| Psico leggero | FinalBoss MiniTail Hit | Proposta | target | 1× | Lampo viola compatto, 333 ms |
| Psico medio | Hekaton 1001 Explosion | Proposta | target | 1.5× | Nucleo viola e orbite luminose, 292 ms |
| Psico centrale, intensità da definire | LadderPuzzle Shock | Confermato | center | 1.5× | Scelta dell'utente |
| Taglio leggero | GIF 27c650209255d638948a6215ffea9c78 | Proposta | target | 0.75× | Tre artigli chiari, 400 ms |
| Taglio medio | OverSwingDouble 0 | Proposta | target | 1.25× | Doppio arco rosso-bianco, 292 ms |
| Impatto leggero | TJRJump | Proposta | target | 1.25× | Anello bianco direzionale, 458 ms |
| Impatto medio | Lynn HitHard Hit | Proposta | target | 1.25× | Stella giallo-bianca e anello, 333 ms |

Gli zoom sono relativi alla scala originale; il Lab mostra la scala effettiva.
Le proposte sono salvate in `src/components/vfx/vfxCuration.ts`. L'intensità
di LadderPuzzle Shock resta volutamente indefinita.

## Riserve e riclassificazioni

- **ItemLevelUp** contiene la scritta LEVEL UP: utile per UI, non per mosse generiche.
- **Hekaton 1011 Hit** contiene un portale e una sagoma: spostato da fisico a Psico/aura.
- **Lynn SneakAttackHit** ha un impatto nero/viola/verde: spostato dai tagli a Oscurità/impatto.
- **FieldGimmick Thunder** rimane un'alternativa Elettro con nuvola e detriti, fuori dalla selezione ridotta.
- **Hekaton 1001 Explosion** è viola con orbite, quindi proposto come Psico invece di Fuoco.
- I sei dadi, le evocazioni riconoscibili e gli effetti molto scenografici restano
  fuori da questa prima selezione delle quattro famiglie.
- GIF con fondali colorati/gradienti, come **Dmitry Sarkisov Ssss**, restano
  fuori dalla selezione: screen elimina il nero puro, non rende trasparente un gradiente.

## Fondi neri e compositing

La fusione va applicata al contenitore esterno di `MoveVfxLayer`, che può fondersi
con la scena. Applicarla solo all'immagine sotto un contenitore animato e isolato
lasciava visibile il rettangolo nero, anche con blendMode già impostato a screen.

Quattro GIF segnalano alpha nei metadati ma conservano fondali opachi nei frame.
Le correzioni manuali sono in `vfxPresentationOverrides.ts` e vengono applicate
alla composizione del manifest runtime. Le vere immagini trasparenti mantengono
normal; un override Admin o di recipe resta prioritario. Gli originali e il file
`generatedVfxAssets.ts` non vengono modificati.

Questa è una correzione di visualizzazione, non una conversione dei file in RGBA.

## Passaggio successivo

Confermare o correggere soltanto le sette proposte, poi creare il mapping
archetipo/intensità e provarlo su mosse rappresentative. Le tre scelte già
confermate non richiedono un'altra approvazione.
