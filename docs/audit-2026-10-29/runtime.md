# Audit in lettura — runtime, regia e rilascio — 29 ottobre 2026

Checkout: C:/Users/andre/Documents/Codex/2026-10-19/https-github-com-andreatz-arkamon-beta/checkout.
Nessun sorgente, test di prodotto o stato Git modificato. Letti i rapporti strutturali del 26 ottobre prima di cercare regressioni. Non considerate bug le modifiche strutturali non ancora versionate, la natura online dei media pesanti, il pin locale non ancora pubblicato e i limiti visivi originali dei video.

## R1 — P2 — la build accetta una revisione CDN diversa dal pin verificato

- Riferimenti: vite.config.ts:17–23; scripts/package-web-assets.mjs:28–31.
- Trigger: un ambiente conserva VITE_MEDIA_REVISION con un vecchio SHA, oppure viene fornito uno SHA diverso dal pin, mentre il manifest locale resta corretto.
- Causa: la configurazione usa l'override come indirizzo runtime; il confezionamento controlla versione e hash del manifest del pin, ma non confronta pinned.revision con revision.
- Effetto: la build supera i controlli locali e produce URL per pagine native, suoni e VFX in una revisione che non contiene necessariamente quei file. I nuovi asset cadono in fallback/404. I test normali usano il server sorgente e non lo rilevano; la prova compilata delle nuove animazioni è separata dalla CI.
- Prova eseguita: node output/audit-2026-10-29/runtime/probe-pin-override.mjs. Fixture con metadati completi delle cinque azioni e requireComplete=true: pin aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, revisione richiesta bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb, confezionamento riuscito e mediaBase punta a bbbb. Risultato persistente in pin-fixture/result.json. Solo fixture locale; nessuna chiamata CDN.
- Correzione proposta: rifiutare differenze tra la revisione passata e pinned.revision nel percorso completo; se l'override è una funzione necessaria, richiedere un manifest/fingerprint associato a quella stessa revisione.

## R2 — P2 — gli upload dello Studio spariscono nella Browser Source con profilo separato

- Riferimenti: src/regia/publicSnapshot.ts:26–33; src/regia/BroadcastView.tsx:20–27; src/ui-studio/mediaStorage.ts:24–31 e 109–113.
- Trigger: importare e applicare un PNG/SVG come cornice HP o sfondo battaglia; aprire il visualizzatore con il relay in un profilo OBS/BrowserContext indipendente.
- Causa: la fotografia pubblica copia source='ui-media:<id>'. Il visualizzatore prova resolveUiMediaSource nel proprio IndexedDB, privo dei file del profilo della console. Nessun contenuto o URL accessibile dal visualizzatore viene trasferito dal relay. Il fallimento viene ignorato.
- Effetto: il collegamento dichiara connesso e continua a mostrare la partita, ma cornici/sfondo personalizzati non sono quelli della console. Il tema confezionato funziona: il problema riguarda specificamente gli upload utente.
- Evidenza browser eseguita: node output/audit-2026-10-29/runtime/probe-obs.mjs, server QA isolato 3069, due BrowserContext nuovi a 1366x768, importUiMedia/updateDesign e relay reali. Console: cornici magenta importate effettivamente nel CSS come data:image/svg+xml; viewer connesso: cornice /ui/hp_bar_enemy.png e resolveUiMediaSource restituisce "File importato non trovato". Screenshot console-custom-ui.png e obs-missing-custom-ui.png, dettagli in obs-browser/report.json. Il viewer conserva zero pulsanti e nessun salvataggio. Il riferimento sfondo importato manca analogamente nell'archivio viewer, ma il livello di sfondo della console resta dietro il mondo Venezia: la prova visiva conclusiva riguarda le cornici HP.
- Correzione proposta: rendere disponibili solo i media grafici pubblici selezionati mediante URL/capacità confinata e byte limitati, oppure risolvere contenuti pubblici appropriati prima della trasmissione. Evitare di esporre l'intero archivio Studio o di allargare indiscriminatamente il limite snapshot da 2 MiB.

## R3 — P2 — regia e console usano velocità di animazione indipendenti

- Riferimenti: src/regia/publicSnapshot.ts:28–33; src/regia/BroadcastView.tsx:79–84; src/settings/gamePreferences.ts:46–51; src/components/vfx/useVfxPlaybackPreferences.ts.
- Trigger: console con animazioni veloci e profilo OBS nuovo, che usa normal.
- Causa: la fotografia pubblica trasmette nomi/replay delle animazioni ed effetti, ma non la velocità attiva. I renderer della regia leggono il proprio useGamePreferences. Per esempio una clip nativa da 96 frame a 24 FPS dura 2 secondi nella console fast e 4 secondi nella regia normal.
- Effetto: HP e stato del turno pubblici avanzano secondo la console, mentre azioni/VFX del viewer restano indietro o vengono interrotti dalla successiva azione. Non è il normale ritardo di rete: il rapporto tra le durate è sistematicamente 2:1.
- Evidenza browser: nella stessa battaglia reale della prova OBS, la console usa fast e il renderer nativo idle della forma 13 espone 48 FPS; il viewer nuovo usa normal e 24 FPS. Misurati anche i frame: console +39, viewer +31 in circa 1,65 secondi, con stalli di pagina sotto il carico del giro completo parallelo. Non si presenta questo campione come misura fisica di fluidità o rapporto 2:1: quello è il rapporto delle velocità configurate e delle durate teoriche. Anche le calibrazioni VFX Admin sono lette dal profilo locale e non sono trasferite con l'effetto, ma quel caso non è stato ampliato in un finding separato.
- Correzione proposta: includere le impostazioni pubbliche effettive della sequenza e passarle ai renderer attraverso un contesto di presentazione, conservando le preferenze private del viewer.

## R4 — P2, copertura del rilascio — le sei prove native sul compilato non fanno parte del gate

- Riferimenti: .github/workflows/ci.yml:81–87; playwright.release.config.ts:4; playwright.native-release.config.ts:6–10; e2e-native-release/native-catalog.spec.ts.
- I due gruppi della suite ordinaria includono e2e/; la prova compilata del workflow include solo e2e-release/. Le sei prove e2e-native-release/ sono raccolte esclusivamente dal loro config dedicato, non chiamato dal workflow e non incluso nella ricevuta seal.
- Effetto: le cinque azioni dei nuovi 107–110 e i due duelli contro il vero bundle con pin/fingerprint sono stati provati localmente, ma una futura regressione esclusiva della build può superare la pubblicazione automatica.
- Correzione proposta: eseguire il gruppo compilato nativo sullo stesso dist prima della sigillatura e conservarne esito/hash nel gate; mantenere distinta la verifica di trasporto locale dall'effettiva disponibilità online del CDN.

## Osservazione secondaria, non inclusa nei tre bug principali

GifVfx.tsx riproduce GIF in un img e non applica speed, mentre SpriteMoveVfx.tsx:24–25 dimezza impatto/durata nella modalità fast. Se un GIF legacy viene scelto esplicitamente come override Admin, si può vedere solo la prima metà del suo ciclo prima della rimozione del layer. I 276 VFX moveset principali usano sprite sheet e non hanno questa specifica limitazione. Va verificato nel laboratorio prima di promuoverlo a finding aggiuntivo.

## Perimetro ispezionato senza nuovi bug dimostrati

- Cache nativa con lease, limite 16 MiB/pagina, due decoder, budget 32/64 MiB, timeout e fallback; renderer paginato, gate di reazione e clock; separazione back statico/front nativo.
- Audio scheduler, canali/mute, preparazione immagini e VFX, composizioni.
- Audience API, cancellazione/recupero idempotente, polling, sessioni private; launcher isolato del backend e workflow manuale. Nessuna credenziale o infrastruttura di produzione usata.
- Tauri: separazione risorse, validazione percorsi, letture limitate e range, CSP/configurazione, prove browser desktop documentate. Nessuna build/installazione nativa avviata.
- Confezionamento selettivo, pin, controllo completezza native metadata, sigillatura SHA, inventario dei percorsi di test/CI.
- L'esistenza delle prove e dei dati importati è verificata nel checkout corrente; le suite e le evidenze storiche del 26/28 ottobre non sono state rietichettate come nuovi test di questo audit.
- Prova browser OBS: zero pageerror; 13 requestfailed conservati nel rapporto (12 POST relay net::ERR_ABORTED e un video transizione abortito; nessuna pagina nativa fallita). Non descritta come prova priva di qualsiasi errore di trasporto. Tutti i browser/context/relay della fixture sono stati chiusi e non è stato aperto un profilo utente.
