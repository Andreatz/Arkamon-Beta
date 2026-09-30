# Prima selezione visiva VFX

La scrematura considera i 113 asset importati (90 sprite sheet e 23 GIF),
con quattro fotogrammi distribuiti lungo ciascuna animazione. I 29 asset di base
rimangono disponibili come fallback. Non è una validazione finale di tutte le
animazioni in battaglia: i dieci effetti sono stati confermati dall'utente nel Lab,
con le regolazioni riportate sotto. Il mapping runtime per archetipo/intensità
applica ora queste scelte a 49 delle 220 mosse, mantenendo le assegnazioni
specifiche già esistenti.

## Selezione ridotta

Nel VFX Lab **Solo selezione consigliata**, attivo all'apertura, mostra
18 effetti: i 10 **Confermati** dall'utente riportati sotto e le 8 **Proposte**
del secondo giro. Il filtro Categoria permette di confrontare una famiglia
alla volta. Le proposte non vengono assegnate automaticamente alle mosse.

| Famiglia / ruolo | Effetto | Stato | Posizione | Zoom | Motivo |
| --- | --- | --- | --- | --- | --- |
| Elettro leggero | ChargedCannon Blue Hit | Confermato | target | 1.25× | Scarica ciano compatta, 417 ms |
| Elettro medio | Spark 0 | Confermato | target | 1.5× | Scelta dell'utente |
| Elettro forte | Tynus Lightning 2 | Confermato | target | 1.5× | Scelta dell'utente; non limitato alle Supreme |
| Psico leggero | FinalBoss MiniTail Hit | Confermato | target | 1.25× | Lampo viola compatto, 333 ms |
| Psico medio | Hekaton 1001 Explosion | Confermato | target | 1.25× | Nucleo viola e orbite luminose, 292 ms |
| Psico forte | LadderPuzzle Shock | Confermato | center | 1.5× | Scelta dell'utente |
| Taglio leggero | OverSwingDouble 0 | Confermato | target | 1× | Doppio arco rosso-bianco, 292 ms |
| Taglio medio | GIF 27c650209255d638948a6215ffea9c78 | Confermato | target | 1.25× | Tre artigli chiari, 400 ms |
| Impatto leggero | TJRJump | Confermato | target | 1× | Anello bianco direzionale, 458 ms |
| Impatto medio | Lynn HitHard Hit | Confermato | target | 1× | Stella giallo-bianca e anello, 333 ms |

Gli zoom sono relativi alla scala originale; il Lab mostra la scala effettiva.
Le scelte sono salvate in `src/components/vfx/vfxCuration.ts`.

## Secondo giro: Fuoco, Acqua e cure

Queste sono proposte editoriali dopo la scrematura visiva, non conferme dell'utente.
Posizione e zoom sono punti di partenza per il confronto nel Lab.

| Ruolo proposto | Effetto | Posizione | Zoom | Da valutare |
| --- | --- | --- | --- | --- |
| Fuoco leggero | Mitra Aura F 2 | target | 1.25× | Piccola fiamma verticale; coda breve, 292 ms |
| Fuoco medio | CannonJump | target | 1.25× | Esplosione verticale arancione; molto rapida, 292 ms |
| Fuoco forte | Mitra Aura F 0 | target | 1.25× | Esplosione ampia e fiamme residue, 625 ms |
| Acqua leggero | WaterSmash1 | target | 1.5× | Impatto compatto e gocce; sorgente 130 × 114, 542 ms |
| Acqua medio | GIF 59ad165cefdf8a14f3b4e35ad7e8e8a8 | target | 1.25× | Vortice circolare azzurro, 400 ms |
| Acqua forte | Shark Kick Effect | target | 1.25× | Arco con spruzzi e pinne: potrebbe essere più adatto ai tagli Acqua, 720 ms |
| Cura leggera | Lynn Heal SpecialAffected | self | 1.25× | Scie verdi sottili, 375 ms |
| Cura ampia | Lynn Heal Effect | self | 1× | Vegetazione e luce verde: valutare se riservarla alle cure Erba, 708 ms |

Per il confronto mantieni **Solo selezione consigliata** e scegli `fire`, `water`
o `heal`. Fissa il primo effetto come riferimento e usa **Successivo** per gli
altri. **Ripeti automaticamente** aiuta a leggere gli effetti più brevi.
Per ogni proposta sono sufficienti conferma/scarto, ruolo, zoom e posizione.
Le due GIF Acqua usano già screen per fondere il nero con la scena.

Nessuna proposta ha `battleArchetype` o `reviewed: true`. Le 49 associazioni
confermate e le assegnazioni esistenti di Fuoco, Acqua e cure restano invariate.
La classificazione leggera/ampia delle cure serve al confronto visivo: non
introduce nuovi livelli di guarigione nelle regole del gioco.

Verifica del secondo giro: 406/406 test e build superati; le otto proposte
caricano nel Lab e sono state controllate da entrambi i lati (16 anteprime).
I filtri mostrano 3 Fuoco, 3 Acqua e 2 cure. La console del Lab non segnala
errori; il mapping runtime continua a usare 49 mosse confermate e zero proposte.

## Riserve e riclassificazioni

- **ItemLevelUp** contiene la scritta LEVEL UP: utile per UI, non per mosse generiche.
- **Hekaton 1011 Hit** contiene un portale e una sagoma: spostato da fisico a Psico/aura.
- **Lynn SneakAttackHit** ha un impatto nero/viola/verde: spostato dai tagli a Oscurità/impatto.
- **FieldGimmick Thunder** rimane un'alternativa Elettro con nuvola e detriti, fuori dalla selezione ridotta.
- **Hekaton 1001 Explosion** è viola con orbite, confermato come Psico invece di Fuoco.
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

## Collegamento alle mosse

Ogni selezione confermata dichiara `battleArchetype` e `intensity` nella curation.
I tag descrittivi non determinano il mapping: la GIF con gli artigli, ad esempio,
ha anche il tag physical ma appartiene al ruolo slash, non blunt.
Solo voci confermate e preferred con un ruolo esplicito possono sostituire il
fallback. Le combinazioni ancora senza scelta, come slash/heavy e blunt/heavy,
mantengono gli effetti precedenti.

Precedenza: override temporaneo Admin → assegnazione specifica per ID mossa →
selezione confermata per archetipo/intensità → fallback precedente. Cure, stati,
Supreme, raggi e tempeste mantengono i propri profili e recipe. Il tipo Elettro
da solo non sostituisce, ad esempio, un archetipo storm con un impatto electric.

Le regolazioni di posizione e zoom vengono applicate una sola volta agli asset
automatici, partendo dal manifest originale. Il Lab e la battaglia condividono
lo stesso helper di calibrazione. Gli override espliciti restano prioritari.
Durata e istante d'impatto vengono dall'asset selezionato; i dieci effetti
confermati sono riprodotti singolarmente, senza aggiungere recipe non valutate.

Mosse rappresentative per verificare tutti i ruoli:

| Ruolo | Mossa | Effetto |
| --- | --- | --- |
| Psico leggero | #118 Penna Arcobaleno | MiniTail Hit |
| Psico medio | #119 Ali Elusive | Hekaton Explosion |
| Psico forte | #44 Collasso nervoso | LadderPuzzle Shock |
| Elettro leggero | #38 Scossa | ChargedCannon Blue Hit |
| Elettro medio | #5 Voltaggio | Spark 0 |
| Elettro forte | #6 Alta tensione | Tynus Lightning 2 |
| Slash leggero | #70 Puntura anestetica | OverSwingDouble 0 |
| Slash medio | #130 Pinna Rotante | GIF con tre artigli |
| Fisico leggero | #29 Colpo felpato | TJRJump |
| Fisico medio | #129 Colpo Rabbioso | Lynn HitHard Hit |

Scossa, Alta tensione, Colpo felpato e Collasso nervoso ricevono ora un livello
visivo esplicito per coprire i ruoli mancanti nei profili precedenti. È una
classificazione editoriale iniziale delle mosse, distinta dalla conferma visiva
degli asset: non cambia danni, dadi o progressione. Le altre intensità restano
quelle già definite nei profili.

## Verifica e passo successivo

I test coprono i dieci ruoli, la calibrazione, i tempi, l'assenza di mutazioni del
manifest e la precedenza degli override. Nel browser sono state controllate
tutte e dieci le anteprime da entrambi i lati, inclusa la rimozione a fine effetto.
Una battaglia PvP locale Psycroak/Teslat ha verificato Collasso nervoso dal lato A
e Alta tensione dal lato B, con danno e passaggio di turno. Nessun errore di
caricamento degli asset; la console segnala un warning React sui ref di
`BattleLayoutItem` dentro `AnimatePresence/PopChild`, in codice non modificato
da questo intervento. La build passa con il warning già presente sulla dimensione
del bundle principale (oltre 600 kB).
La verifica non equivale a una revisione estetica completa delle 49 mosse.

Il prossimo passo è raccogliere le scelte visive sulle otto proposte del secondo
giro; solo dopo la conferma si aggiungeranno i rispettivi ruoli nel mapping.
