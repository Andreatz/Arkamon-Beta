# Animazioni frontali: completamento del catalogo 92–110

Importazione del 28 ottobre 2026. Le 19 forme rimanenti portano il catalogo nativo a **110 forme, 550 clip e 52.775 fotogrammi**. Ogni forma dispone di attesa, attacco, colpito, vittoria e KO. L'audit persistente è `animation-source/audits/front-2026-10-28.json`; le evidenze locali sono raccolte in `output/animation-import-2026-10-28/` e non sono incluse nel pacchetto del gioco.

## Sorgenti e conservazione

Le nuove sorgenti comprendono **95 video, 9.108 fotogrammi nativi e 215.541.531 byte**, provenienti da `C:/Users/andre/Desktop/GitHub/Arkamon-Beta/public/sprites/animation/Front`. I filmati sono 1920×1080 a 24 FPS. Sono conservati sia i nomi forniti in `public/sprites/animation/Front/`, sia le copie canoniche in `animation-source/raw/{id}/front/{azione}.mp4`. La verifica confronta dimensioni e SHA-256 di originale, copia e sorgente canonica, e decodifica indipendentemente tutti i frame originali con FFmpeg `framemd5`.

Le dodici clip da **95 frame** sono: tutte le cinque azioni di 107; attacco e KO di 108; colpito e vittoria di 109; attacco, colpito e vittoria di 110. Le altre 83 clip hanno 96 frame. Si mantengono indici e ordine originali, senza interpolazione, riempimento temporale, inversione o sostituzione del finale. Un KO che dissolve il corpo conserva il suo ultimo frame reale, anche quando rimangono soltanto particelle.

Prima dell'importazione è stata salvata la baseline delle **455 clip precedenti e di 6.471 file**: 5.430 pagine, 455 atlanti, 455 poster e 131 PNG frontali numerati. La verifica indipendente è terminata con stato `passed` e zero errori: tutte le voci storiche risultano profondamente identiche e tutti i file confrontati mantengono byte e SHA-256. Questo perimetro non si estende a ogni vecchio JSON del progetto. Squadra, Deposito, Arkadex e Analisi mantengono i PNG ufficiali e la riproduzione nativa separata. Non vengono modificati splash art o layout dell'interfaccia.

## Scala, trasparenza e sincronizzazione

Ogni set usa una scala e un appoggio comuni, un viewport logico 192×192 e una camera costante per l'intera clip. Il canvas aggiunge spazio trasparente per le escursioni e gli effetti originali; il renderer usa il viewport esplicito, senza ridimensionare il corpo in base al padding del singolo attacco. Il fit iniziale del corpo viene applicato a 104 e 107–110 per evitare che rocce orbitanti o particelle determinino la dimensione del personaggio.

Le forme **93, 95–100 e 105–106** usano il fondale blu, preservando verdi e gialli presenti nei personaggi. Le altre usano il verde. L'estrazione è conservativa: alcuni bagliori mescolati con il fondale compresso mantengono lievi bordi oliva. Per esempio, la pulizia aggressiva provata su 101 eliminava il 37,3% dei pixel visibili del campione e parte del bloom; non è stata adottata. I tagli già presenti ai bordi dei video e le dissolvenze originali sono documentati nei report visivi.

I **38 marker** di rilascio dell'attacco e reazione al colpo sono stati individuati su tre fotogrammi originali consecutivi ciascuno, con indici da zero. Per 105, che esegue un affondo fisico senza proiettile, il rilascio corrisponde al primo affondo deciso del tronco. Metadati individuali, set e manifest runtime condividono gli stessi marker e i tempi derivati da 24 FPS.

| Forma | Nome | Canvas | Rilascio attacco | Reazione colpo |
|---|---|---:|---:|---:|
| 92 | Pyrodil | 640 | 27 | 19 |
| 93 | Pyrodil | 576 | 39 | 19 |
| 94 | Pyrodil | 320 | 43 | 13 |
| 95 | Beestrix | 576 | 31 | 15 |
| 96 | Beestrix | 512 | 27 | 18 |
| 97 | Beestrix | 448 | 43 | 16 |
| 98 | Grooty | 512 | 51 | 14 |
| 99 | Ervys | 576 | 27 | 17 |
| 100 | Ervys | 448 | 46 | 9 |
| 101 | Xesar | 512 | 36 | 12 |
| 102 | Xesar | 448 | 18 | 27 |
| 103 | Boomrock | 576 | 40 | 12 |
| 104 | Boomrock | 576 | 31 | 17 |
| 105 | Zoorian | 448 | 29 | 25 |
| 106 | Zoorian | 512 | 33 | 39 |
| 107 | Ao-shin | 384 | 39 | 26 |
| 108 | Aka-shin | 320 | 54 | 21 |
| 109 | Oniros | 512 | 32 | 21 |
| 110 | Voider | 576 | 39 | 15 |

I raccordi dell'attesa di 93 e 94 superano la soglia diagnostica di discontinuità e sono aggiunti alla coda di revisione. Questo segnala il raccordo della sorgente: non si inventano frame per nasconderlo.

## Verifiche e stato di consegna

La revisione visiva è completa per le 19 forme e usa tavole campionate su sfondi chiari e scuri, confronti delle pose e fotogrammi consecutivi dei marker. Non equivale all'osservazione manuale di tutti i 9.108 fotogrammi. Il convertitore verifica il confronto RGBA completo dell'atlante; il generatore delle pagine verifica tutti i pixel visibili e l'alpha. L'audit indipendente ha verificato provenienza, campionamento, geometrie, impronte di ognuna delle **655 nuove pagine**, poster/primo frame, ultimo frame e celle inutilizzate trasparenti per tutte le 95 clip. Il totale è **6.085 pagine**. Le pagine mantengono il limite di 16 MiB decodificati; le prove del renderer verificano cache e concorrenza.

| Controllo | Esito locale |
|---|---|
| Provenienza e decodifica | 95 sorgenti e 9.108 frame, 285 copie confrontate; superato |
| Conservazione storica | 455 voci identiche e 6.471 file, 6.218.940.303 byte confrontati; superato |
| Poster, atlas e pagine | 95 clip e 655 nuove pagine; superato, zero errori nell'audit indipendente |
| Revisione visiva | Tutte le 19 forme, cinque azioni, confronti chiari/scuri e 38 marker; completata nei limiti del campionamento dichiarato |
| Regressioni Python | 36/36 superate |
| Suite unitaria completa | **5.117/5.117 test in 176 file**, codice 0 |
| TypeScript | `tsc --noEmit`, codice 0 |
| Browser sorgente | **34 superati, otto skip mobile dichiarati, zero errori o flaky**, codice 0; 19 forme desktop, 11 mobile e quattro duelli |
| Build e browser del bundle compilato | In corso; risultati registrati dopo il pin degli asset |

Il primo giro unitario ha avuto un timeout di cinque secondi nel controllo dell'indice audio, durante una verifica media concorrente; le evidenze sono conservate come `vitest-full-first.log/.json`. Senza modificare codice o timeout, il test isolato è passato (5/5, indicizzazione 770 ms) e l'intera suite successiva è passata senza quella contesa. Non si sommano i tentativi al totale di 5.117.

Nessun push o deploy è implicito nella conversione locale. Le prove qui riportate riguardano l'importazione e le sue regressioni; non sono una nuova esecuzione di ogni scenario E2E dell'intero progetto.

Le nuove prove sono `e2e/native-import-92-110.spec.ts` (tutte le 19 forme su desktop, undici su viewport mobile e due confronti reali nel laboratorio su entrambi) e `e2e-native-release/native-catalog.spec.ts` (le quattro forme più recenti e due confronti nel bundle di produzione). Quest'ultima serve localmente soltanto i media della revisione esatta dichiarata dalla build, verificandone inventario, dimensioni e impronte. **Certifica il bundle con il trasporto locale verificato, non la disponibilità della revisione su GitHub/CDN.** Il bundle resta invariato.

Il pin della libreria media richiede l'ordine già previsto dal progetto: commit degli asset e del manifest completo, `npm run media:pin`, quindi build rigorosa e registrazione del pin. Il lettore del manifest Git usa ora un buffer di 16 MiB, sufficiente per il catalogo completo; due test verificano sia un manifest oltre 4 MiB sia il rifiuto delle modifiche non registrate. Questo evita di allentare il controllo di corrispondenza tra manifest e revisione.
