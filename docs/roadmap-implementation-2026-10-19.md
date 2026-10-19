# Attuazione della roadmap Arkamon

19 ottobre 2026. Base di lavoro: `7a9cd6f899fe0501043b6f617eea226a9381cc82`, branch `feat/audit-roadmap-2026-10-18`.

Questa consegna applica la roadmap del dossier locale `output/fresh-audit-2026-10-18/roadmap.md`. Gli interventi riguardano il software mostrato in live: gestione RPG, mappe, battaglia, presentazione e authoring. Storia e interpretazione restano al Game Master. Nessun media nativo è stato rigenerato e nessuna nuova release degli asset è stata prodotta.

## Stato dei pacchetti

| Fase | Implementazione |
|---|---|
| F0 — Integrità | Recupero delle identità duplicate nei backup; riferimenti ambigui alla battaglia/evoluzione invalidati senza premi; preflight della griglia prima di consumare punto e turno; Diario corretto per starter in deposito e stati della Lega; prerequisiti impossibili filtrati; Pordenone senza attività fittizie; manifest aggiornato atomicamente conservando le altre clip; guida dei ruoli QR allineata. |
| F1–F2 — Composizione e kit | Squadra, Battaglia e Mappa ricomposte usando il kit Scuro/Blu/Comuni, Norwester e sprite ufficiali. Finestre, comandi, selezione, meter, ritratto e navigazione spaziale condivisi. Adattatori SVG riproducibili mantengono gli originali. |
| F3 — Contesto gestionale | Selezione, box, filtri, pagine e oggetti ricordati per giocatore e revisione della campagna. Squadra→Analisi/Borsa/Deposito conserva la provenienza; Esc torna al contesto precedente con ripristino del focus. Le frecce selezionano e Invio conferma; in modalità spostamento le frecce non effettuano scambi. Gli input mantengono i tasti nativi. |
| F4 — Presentazione della live | World distinto dall’HUD, shake circoscritto, hit-stop solo visivo, ultimo risultato persistente, banner sfida senza sovrapposizione. Borsa battaglia con quattro oggetti per pagina e sei bersagli. Mappa con destinazione, costo e conferma esplicita. Barra identità/turno unica per il layout predefinito; override storici personalizzati rispettati. |
| F5 — Gestione e progresso | Sei righe Squadra; 35 posti Deposito e sei membri; Arkadex di 110 specie su 19 pagine; Analisi senza EXP; Borsa con anteprima dal motore; Negozio in due aree e quantità unica; sei utility e carta allenatore; Gara/Ripresa con pagine. Titolo, starter, Lega ed evoluzione raccordati al kit. Otto medaglie e cinque emblemi geometrici nuovi. |
| F6 — Media | Scheduler audio comune con cue/ritardo/cancellazione; preferenze nelle preview; movimento ridotto con segnale statico; priorità dei combattenti e riserve differite; budget decodificato e diagnostica. Laboratorio con fermo, primo/ultimo/step/seek del fotogramma sorgente e coda dei sette raccordi da valutare artisticamente. |
| F7 — Authoring e regia | Studio sulla vista reale anche per città/percorso/deposito; runtime senza observer quando non ci sono override. Progetto visivo versionato con bozza, confronto, applicazione, import/export, ripristino e journal di recupero. Bozze VFX persistenti e audio applicato conservato fra modifiche. Presentazione pubblica esplicita e limitata alla scheda scelta. |
| F8 — Collaudo | 3.341 test su 161 file; 69 scenari desktop e nove con viewport mobile; TypeScript e compilazione; nove regressioni sicurezza e 276 voci VFX. Osservazione delle sette gestioni e mappa/battaglia a 1080p, lettura delle tre composizioni a 960×540, tavola kit chiaro/scuro e proporzioni 100–150%, 14 campioni contrasto sopra 4,5:1. Esiti consolidati nel verbale locale di verifica. |

## Come usare le nuove funzioni

### Gioco e consultazione

Aprire **Partita** per le sei gestioni. Il Negozio continua ad aprirsi esclusivamente dal pallino configurato sulla mappa. Il comando visibile di uscita è **Riprendi il Viaggio**.

Nella Squadra, selezionare un compagno e usare **Analizza Arkamon**, **Apri borsa** o **Apri deposito**. Esc ripercorre queste aperture contestuali e rimette il focus sul comando d’origine. La barra superiore seleziona una sezione direttamente; Esc da una sezione principale chiude la gestione. Registro, Backup, Impostazioni, Gara, Ripresa e Sfide restano accessibili dalle sei utility del Menù.

La Borsa mostra bersaglio, stato e HP prima/dopo. L’anteprima usa `resolveItemEffect`, come il consumo reale. La consultazione non consuma risorse. Il riordino e gli scambi restano soggetti a turno, Lega, battaglia e cap; l’EXP non è visualizzata né accumulata.

### Progetto visivo

1. Modificare UI/font/sfondi/menù nello Studio. Preparare le associazioni nei laboratori audio/VFX.
2. Aprire **Progetto** nello Studio oppure **Admin → Progetto visivo**. Acquisire le impostazioni e le bozze. Nello Studio viene acquisita anche la bozza UI ancora non applicata; nell’Admin viene usato il layout già applicato.
3. Controllare il riepilogo e scegliere **Applica progetto al gioco**. Il salvataggio della campagna non fa parte del pacchetto.
4. **Esporta pacchetto** comprende immagini e font caricati nello Studio. Audio/VFX già presenti nel gioco sono riferimenti ai media locali, quindi il file non è una release media autonoma.
5. L’importazione prepara una bozza validata. **Ripristina progetto precedente** ripristina UI, associazioni VFX e audio. Un journal recupera applicazioni interrotte prima che gli store si inizializzino.

Le associazioni audio applicate costituiscono la base del laboratorio: cambiare una sola scelta non elimina le altre personalizzazioni. Il validatore del tema è ora indipendente dal componente dell’Admin, con export compatibile per i chiamanti storici.

### Presentazione in onda

**Presenta scheda selezionata** invia alla vista In onda soltanto il dettaglio attualmente scelto. Squadra/Deposito/Analisi condividono un esemplare, Arkadex una specie già vista, Borsa/Negozio la descrizione dell’oggetto, Menù una carta di progresso. Non vengono inviati deposito completo, inventario, quantità possedute, ID delle istanze, EXP, editor o credenziali.

La selezione pubblica è fissata dal click del GM: scegliere privatamente altro non rivela automaticamente la nuova scheda. **Nascondi dalla live**, cambio sezione/giocatore, chiusura, cambio scena e nuova campagna ritirano la presentazione. La vista In onda resta passiva; pausa e controllo della sessione continuano a funzionare.

Il collegamento della vista In onda è locale allo stesso browser/profilo. Non certifica una Browser Source OBS in un profilo distinto. Ospiti privati e voto del pubblico conservano i ruoli stabiliti dal format.

## Integrità e prestazioni

Il checkpoint principale viene scritto immediatamente. Le copie di recupero sono validate in cache, accorpate e differite; durante cue e transizioni attendono che la regia sia libera. Ownership, revisione e ripristino invalidano il lavoro divenuto obsoleto.

La prova automatica `e2e/checkpoint-performance.spec.ts` usa campagne da 12, 212 e 2.112 creature, cinque click reali di cambio turno e storage del browser. Il JSON prodotto distingue tempo del gestore sincrono, singola scrittura principale, scrittura di recupero e ritardo rispetto al comando. Non misura FPS, GPU, rendering complessivo o un confronto storico browser prima/dopo.

Il ripristino della campagna ha un journal distinto dal progetto visivo e passa dal controllo della sessione. Arresti simulati, quota esaurita, conflitti e identità duplicate hanno regressioni dedicate. La pipeline delle animazioni è verificata su cartelle temporanee: una conversione filtrata conserva il resto del manifest, e un errore non pubblica un catalogo parziale.

## Raccordi artistici e prove di release

I sette idle 15, 16, 17, 18, 31, 50 e 59 hanno una coda di revisione e controlli del fotogramma originale. Rimangono **Da osservare** finché non viene completata una valutazione artistica su chiaro/scuro/battaglia; un rapporto statistico del raccordo non viene trasformato automaticamente in un giudizio di qualità. La consegna non taglia né ricostruisce i loro fotogrammi.

Anche la revisione artistica delle associazioni audio e del mix con le vere voci/musica della live resta aperta. Scheduler, ritardi, cancellazione e persistenza sono collaudati; il collaudo tecnico non equivale all’ascolto critico. Le migliorie dell’inspector Admin sono circoscritte a navigazione e dimensioni dei campi; non costituiscono una riprogettazione completa dei dodici editor.

Il funzionamento locale è distinto dal collaudo remoto di telefoni, ospiti Discord, OBS/Twitch, hosting e installer. Il test privato remoto richiede l’ambiente esterno configurato. La build di verifica locale non copia i 6,69 GiB di `public/` e non è un pacchetto distribuibile autonomo; la visita locale legge i media effettivi dalla cartella originale. Prima della pubblicazione serve la verifica dell’artefatto completo e del percorso base dell’hosting.

## File e verifiche riproducibili

- Gestione e kit: `src/player-ui/`, `src/components/rpg/`, `src/components/ui/GameButton.tsx`.
- Presentazione/authoring: `src/presentation/`, `src/regia/`, `src/ui-studio/`.
- Persistenza: `src/save/restoreJournal.ts`, `src/save/durableWrites.ts`, `src/save/gamePersistence.ts`.
- Media: `docs/battle-presentation.md`, `src/components/battle/useBattleAssetReadiness.ts`, `scripts/arkamon-manifest-publication.mjs`.
- Rigenerazione adattatori: `node scripts/build-rpg-svg-adapters.mjs` (include copie sorgente dei template HP per import Vite corretti).
- QA locale e immagini: `output/implementation-2026-10-19/`; il verbale consolidato indica i log finali e i tentativi precedenti corretti durante il collaudo.
- Galleria: `output/implementation-2026-10-19/index.html`; verbale: `verification.md`. Nel run finale con 2.112 creature, handler cambio turno mediano 13,8 ms (p95 18,2 ms); scrittura principale mediana 0,6 ms, recovery differita di circa 366 ms dopo l’handler. Non è una misura FPS.

Nessun commit, push o deploy viene attestato da questa consegna locale.
