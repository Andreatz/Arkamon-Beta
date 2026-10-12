# Priorità dell’audit sviluppate il 12 ottobre 2026

Questa consegna implementa le otto priorità della sezione «Priorità rimaste» nell’audit del 12 ottobre. Le idee di brainstorming sono proposte separate. Font originali, asset delle mosse, regole di danno, HP residui, cap di cinque livelli ed EXP non accumulabile sono conservati.

## Comportamento consegnato

| Priorità | Risultato |
| --- | --- |
| Distribuzione web | Il pacchetto Pages contiene interfaccia, mappe, sfondi, audio selezionato, PNG e poster necessari: circa **569 MiB**, con un limite di build di **900 MiB**. Atlanti e video sorgenti sono esclusi. Pagine native, libreria VFX e libreria suoni sono servite da URL vincolati a uno SHA immutabile; è disponibile un override per una distribuzione CDN. |
| Memoria delle animazioni | **160 clip, 15.354 frame, 2.120 pagine lossless**. Ogni pagina decodifica al massimo **16 MiB**; la cache comune usa **64 MiB** in Standard e **32 MiB** in Memoria ridotta. Automatica sceglie il budget in base al layout e alla memoria dichiarata dal dispositivo. |
| Backend voti | Next **15.5.27** e React **19.3.0** stabili, dipendenze bloccate e regressioni di voto/Lotto Wars. Aggiornamento nella [PR Arkanight #9](https://github.com/Andreatz/Arkanight/pull/9), con CI superata sullo SHA `35592e40df1457e0fc45d5f10c0a0e3810231aa4`. |
| Primo accesso ai due QR | Bootstrap firmato, cookie HttpOnly e identità comune serializzata fra schede. Il join non sostituisce il cookie. Web Locks su HTTPS/localhost, SharedWorker come alternativa LAN e procedura sequenziale esplicita quando entrambe le primitive mancano. Nessun token privato consegnato al JavaScript del pubblico. |
| Salvataggi | Scrittura del checkpoint prima della pubblicazione. Fine battaglia, premi, oggetti, nomi, incontri e passaggio di turno/navigazione sono atomici. Una scrittura rifiutata conserva la prima operazione pendente e blocca altri aggiornamenti; il retry non ripete premi o dadi. Sono disponibili due copie automatiche dei precedenti checkpoint e recupero con anteprima/conferma. |
| Fanta v2 | Nuove sfide con regole aggiornate; CURA, CURA_PCT e status puri sono esclusi dal calcolo dell’attacco offensivo. V1 resta riproducibile tramite catalogo congelato. Versione conservata in condivisione, retry e risultati; classifiche distinte. Leafrex: **21 → 19**; Beestrix: **15 → 12** crediti. |
| Avvio | Scene e pannello Admin caricati quando vengono aperti. Il bundle principale passa da **1.421,30 kB / 238,91 kB gzip** a circa **792,88 kB / 122,91 kB gzip**. Il catalogo editoriale VFX runtime passa da 289.122 a **27.726 byte**, con controllo di sincronizzazione. |
| Toolchain | Aggiornamenti compatibili di esbuild e selector parser; stack frontend React 18/Vite 7/Tailwind 3 conservato. Guard locale verificato per l’annidamento patologico di braces, applicato nel postinstall con controllo di versione e hash delle sorgenti. Audit di produzione a **zero** in entrambi i progetti. |

## Asset e release

La revisione nativa è `7f0c93114684929e1b678855ab74fe1297281e8f`. `src/data/media-release.json` conserva SHA della revisione e impronta canonica del manifest. Il confezionamento controlla la presenza, il nome esatto, la dimensione e lo SHA-256 di ogni pagina; una conversione parziale o un manifest non vincolato impediscono la build.

La [release in bozza](https://github.com/Andreatz/Arkamon-Beta/releases/tag/untagged-8992bd9b77d975e73efb) contiene sette tar nativi entro 192 MiB, un tar con 163 metadati e tre file indice/checksum. Tutte le 2.120 pagine sono verificate; 27 pagine campione e tutti i metadati sono estratti e confrontati. I sorgenti restano intatti. Vedere [rapporto delle animazioni](arkamon-native-pages-2026-10-12.md).

Per rigenerare: `npm run animations:pages`, quindi commit dei file generati, `npm run media:pin` e commit del nuovo pin. `npm run media:release` produce gli archivi fuori dal checkout. `GITHUB_PAGES=true npm run build` produce il pacchetto separato; `VITE_MEDIA_BASE_URL` può indirizzare una copia della stessa struttura su una CDN. Le build locali/desktop conservano l’uso dei percorsi locali. Il file `dist/media-release.json` elenca risorse locali, esterne e sorgenti esclusi.

Il repository pubblico rende raggiungibili gli URL raw della revisione. È stata verificata una pagina reale con risposta 200, `image/webp` e CORS `*`, e il browser ha disegnato pixel leggibili nel canvas senza contaminazione CORS. Questo servizio ha limiti di traffico: il pin evita cambiamenti imprevisti dei file ma non promette banda illimitata o disponibilità continua. I link degli archivi non sono usati direttamente come immagini.

## Salvataggi e recupero

«Salvataggio da completare» offre **Riprova salvataggio**, **Scarica progressi conservati** e **Annulla operazione**. Il download comprende anche catalogo delle interazioni e archivio replay. Un checkpoint successivo non può sostituire il retry dell’oggetto o del premio fallito. Un retry dopo ripristino di un’altra generazione di campagna viene scartato. Le battaglie ricostruiscono gli snapshot locali dal checkpoint scritto.

Le copie automatiche sono i due checkpoint precedenti della campagna; le sfide non le sovrascrivono. La quota delle copie non blocca un salvataggio principale riuscito: compare un avviso nel pannello Backup. Un salvataggio corrotto non viene sostituito silenziosamente. Il lettore esamina al massimo otto candidati e propone fino a due copie valide; l’anteprima precede la checkbox e il ripristino. Gli export completi vanno conservati anche fuori dal browser.

Le prove includono un browser che nega l’accesso a `localStorage` già al primo import: il Titolo rimane disponibile, le operazioni vengono rifiutate senza modificare il dominio e il Backup resta scaricabile senza crash. La finestra sovrapposta sospende il focus trap del pannello sottostante.

## Verifica e limiti

La suite completa passa **2.542 test in 123 file**, oltre a **9 test security**. Le regressioni coprono archivi reali, getter storage bloccato, nomi atomici, due varianti di passaggio turno, oggetti e serializzazione canonica. Il risultato del commit consegnato è riportato dalla CI della pull request.

Le prove browser usano Chromium con contesti isolati, desktop 1920×1080 e Pixel 7 emulato, senza leggere o sostituire i progressi del browser abituale. Coprono UI, stato su disco, quote rifiutate, retry, ricarica, focus, cap, condivisione/versioni, pagine lente e due creature simultanee. La build con `/Arkamon-Beta/` è stata provata nel browser usando asset remoti reali: cattura salvata e ripresa, Deposito con ritratti caricati, geometria 1896×1056 senza scroll, nessun errore JavaScript e nessun chunk battaglia/Admin/nativo richiesto al Titolo.

L’audit completo npm conserva **cinque avvisi high** nella catena degli strumenti Tailwind/braces. L’[advisory ufficiale](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) non indica una release upstream corretta. La mitigazione locale limita profondità, lunghezza, nodi e cicli prima della ricorsione, e non nasconde l’advisory né garantisce un limite generale a espansioni combinatorie. Vedere [guard degli strumenti](braces-security-guard.md).

Il limite 32/64 MiB riguarda le pagine della cache, non canvas, GPU o tutta la memoria del browser. Le prove mobile sono emulazione, non un profilo su un telefono fisico. Next e il bootstrap sono verificati su HTTP locale e con storage privato di test/CAS simulata; non sono una certificazione del database remoto o del deploy Vercel. Il connettore Supabase disponibile non espone il progetto della configurazione backend in questa sessione: nessuna modifica, riattivazione o migrazione remota è stata eseguita.

Commit, pull request, release in bozza, merge, deploy Pages e installer sono livelli distinti. Questa consegna pubblica il lavoro per la revisione e non integra automaticamente i rami né cambia il sito o il backend di produzione.
