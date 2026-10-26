# Arkamon-Beta: Audit Tecnico, UX/UI Redesign & Twitch Broadcast Strategy

> **Autore dell'analisi:** Antigravity (Pair Programming AI) per conto del Canale Twitch **Arkanight**  
> **Ruoli ricoperti:** CTO, Senior Full-Stack Developer, QA Lead, Product Manager & Game Designer  
> **Data:** Ottobre 2026  
> **Repository di riferimento:** [Arkamon-Beta (GitHub)](https://github.com/Andreatz/Arkamon-Beta)  

---

## 1. Visione del Format & Regole Fondamentali

Il progetto **Arkamon** rappresenta una sintesi originale tra:
1. **Monster Collector** (cattura, crescita, debolezze di tipo in stile Pokémon).
2. **Tabletop RPG / D&D** (gestione del master, narrazione a voce, prove ed eventi esterni al software).
3. **Boardgame / Gioco dell'Oca** (movimento su mappa a nodi e budget di azioni).

### La Struttura della Diretta su Arkanight
* **Livio:** Game Master, conduttore, regista e voce narrante. Gestisce il ritmo della trasmissione e le interazioni D&D non codificate a schermo.
* **Melia (G1) & Maggi (G2):** I due allenatori in gara. Competono per chi completerà per primo la regione, raccoglierà le medaglie e sconfiggerà la Lega Arkamon.
* **Ospiti Discord (Capipalestra, Rivale, Superquattro):** Amici e membri della community che entrano in diretta vocale su Discord e controllano i loro mostri in tempo reale tramite **codice QR**.
* **Pubblico di Twitch (Chat):** Interagisce tramite codice QR **esclusivamente** per scegliere la mossa degli **allenatori normali (NPC)**. Nessun'altra interferenza diretta sul gioco è consentita.
* **Ruolo del Software:** Companion visuale di supporto televisivo per mostrare spostamenti su mappa, combattimenti a turni, inventario, squadra e statistiche.

---

## 2. Valutazione Multidisciplinare del Progetto (Scala 1–10)

### **Voto Complessivo: 7.8 / 10**

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TABELLA DI VALUTAZIONE                          │
├──────────────────────────────────────┬───────┬─────────────────────────┤
│ Ambito                               │ Voto  │ Stato                   │
├──────────────────────────────────────┼───────┼─────────────────────────┤
│ Architettura del Software (CTO)      │ 8.0   │ Solido ma monolitico    │
│ Qualità del Codice & QA (QA Lead)    │ 9.5   │ Eccellenza assoluta     │
│ Game Design & Meccaniche             │ 8.0   │ Equilibrato e chiaro    │
│ UX/UI & Visual Identity              │ 6.0   │ Disomogeneo, basso cto  │
│ Broadcast & Twitch Readiness         │ 7.5   │ Alto potenziale, grezzo │
└──────────────────────────────────────┴───────┴─────────────────────────┘
```

### Dettaglio delle Valutazioni

#### A. Architettura del Software (CTO) — Voto: 8.0/10
* **Punti di Forza:**
  * Separazione netta di `battleEngine.ts` come motore puro privo di dipendenze React. I calcoli (danno D6, STAB, stati, Mossa Suprema) sono deterministici e testabili con seed RNG.
  * Presenza di **Tauri 2.0** (`src-tauri/`) che permette un eseguibile nativo Windows (`arkamon.exe`), riducendo al minimo l'overhead del browser durante l'encoding di OBS.
  * Dati statici altamente strutturati (110 creature, 229 mosse runtime, database mappe).
* **Debito Tecnico:**
  * **God Components:** `BattagliaScene.tsx` conta oltre 1.860 righe e 84KB. Condensa logica di voting, animazione VFX, audio, dadi e dialoghi in un unico file.
  * **Monolite Store:** `gameStore.ts` (~50KB) raccoglie stato overworld, nodi locali, giocatori 1 e 2, inventario e checkpoint in un unico file.
  * **Rischio Persistenza Live:** L'affidamento a `localStorage` espone al rischio di perdita accidentale dei dati in diretta. È fondamentale introdurre l'auto-salvataggio nativo su file system JSON tramite Tauri.

#### B. Qualità del Codice & QA (QA Lead) — Voto: 9.5/10
* Oltre **2.300 test automatici** in 107 file (Vitest + Playwright + controlli accessibilità Axe).
* Gestione scrupolosa di edge cases complessi: doppio KO, priorità della Mossa Suprema, cap di 5 livelli, tick progressivo del veleno (10%→20%→30%) e risveglio a turni.
* Copertura sia su logica di dominio che su asset runtime (decodifica e fingerprint PNG per spritesheet).

#### C. Game Design & Meccaniche — Voto: 8.0/10
* L'integrazione del dado D6 sul danno garantisce imprevedibilità controllata senza frustrazione.
* La **Mossa Suprema** (danno raddoppiato al costo del 50% degli HP massimi) genera picchi di rischio/ricompensa ideali per lo spettacolo streaming.
* Il cap di progressione a 5 livelli impedisce a un giocatore di sbilanciare la corsa rispetto all'altro.
* **Area di miglioramento:** Necessità di dare più fisicità visiva e impatto teatrale al lancio dei dadi a schermo.

#### D. UX/UI & Visual Identity — Voto: 6.0/10
* È l'area con il maggiore margine di crescita. Attualmente convivono 3 stili contrastanti: cornici sci-fi metalliche scure, carte abilità in stile pietra/fantasy, e mappe e sfondi illustrati ad acquerello/anime.
* Contrasti tipografici inadatti alla compressione streaming (testi scuri su sfondi semitrasparenti scuri).
* Mancanza di un linguaggio visivo diegetico da console portatile (Handheld retro-moderno).

#### E. Broadcast & Twitch Readiness — Voto: 7.5/10
* Il format con ospiti Discord via QR e votazione chat per gli NPC è eccellente e coinvolgente.
* Mancano le "Safe Zones" per le webcam degli streamer nel layout di gioco e un cruscotto dedicato al Game Master per velocizzare le prove D&D narrate.

---

## 3. Analisi Critica dei 5 Screenshot di Gioco

### 1. Laboratorio del Professore (Selezione Starter)
* **Criticità:**
  * Contrasto debole della dicitura `"MAGGI, SCEGLI IL TUO STARTER"`, posizionata sopra l'illuminazione dell'incubatrice.
  * Le 3 card degli starter (`Vyrath`, `Darklaw`, `Felyss`) appaiono come rettangoli trasparenti piatti, privi di rilievo e di indicatori statistici immediati.
  * Disconnessione visiva tra lo sfondo high-tech cibernetico e gli avatar caldi e illustrati di Livio e Maggi.
* **Intervento Consigliato:**
  * Introdurre un'interfaccia da "Console Olografica da Laboratorio" con pod circolari illuminati da faretti verticali.
  * Schede starter arricchite con badge metallico per il tipo (Normale, Oscurità, Psico) e anteprima radar/barre delle statistiche base (HP, Attacco, Velocità).

### 2. Scena di Battaglia (Wormaren vs Vyrath)
* **Criticità:**
  * **Illegibilità in Streaming:** I pulsanti delle mosse (*Soffio*, *Brezza Profumata*) hanno scritte grigio scuro su bottoni grigi semitrasparenti. Su schermi smartphone compressi a 6000 kbps, le mosse risultano quasi invisibili.
  * **Mossa Suprema:** Compare come un blocco arancione piatto in basso a destra. Non comunica la drammaticità di una manovra d'emergenza che dimezza gli HP.
  * **Tiro dei Dadi Fluttuante:** I due D6 blu traslucidi appaiono sospesi a mezz'aria senza una superficie d'appoggio fisica né un'animazione di rimbalzo scenografica.
  * **Contesto Giocatore Assente:** Non è indicato graficamente a schermo se a combattere in quel momento sia Melia o Maggi.
* **Intervento Consigliato:**
  * **Battle HUD in stile Nintendo DS moderno:** Bottoni mossa con plastica satinata, profili LED colorati corrispondenti all'elemento (verde vivace, ciano, rosso fuoco) e testo in grassetto ad altissimo contrasto.
  * **Vassoio Olografico per Dadi (Dice Tray):** Vassoio 3D delimitato in cui i dadi rotolano con fisica, particelle di impatto e indicazione chiara del conteggio (`Base + STAB + Bonus = Totale`).
  * **Badge Streamer Attivo:** Riquadro fisso in alto a sinistra con avatar del giocatore attivo (es. `[G1 · MELIA]`), riserve della squadra e inventario Arkaball.

### 3. Mappa Locale (Percorso 1 - Tabellone a Nodi)
* **Punti di Forza:** L'illustrazione isometrica stile Mario Party / overworld Pokémon è visivamente eccellente e perfetta per il format.
* **Criticità:**
  * **Tutti i nodi sono identici (cerchi rossi con bordo bianco):** Spettatori e giocatori non possono distinguere cosa nasconde ogni casella.
  * La dicitura in basso a sinistra (*"PUNTO 46 - INTERAZIONE DA DEFINIRE - VA A PUNTO 44"*) restituisce una sensazione di prototipo di sviluppo.
* **Intervento Consigliato:**
  * **Iconografia Distintiva per Nodi:**
    * 🌿 *Erba Alta / Zampa:* Incontro selvatico.
    * ⚔️ *Spade Incrociate:* Allenatore NPC o Capopalestra.
    * ❓ *Punto Interrogativo Dorato:* Evento narrativo D&D interpretato da Livio.
    * 🎒 *Zaino / Forziere:* Oggetto trovato sul percorso.
    * ⛺ *Tenda / Falò:* Punto di bivacco e recupero HP.
  * **Path Highlighting:** Scia luminosa tratteggiata che evidenzia i nodi legalmente raggiungibili con le azioni correnti.

### 4. Arkadex & Gestione Squadra
* **Criticità:**
  * La struttura a tre colonne è funzionale, ma ha l'aspetto di una dashboard software aziendale/SaaS in dark mode.
  * Manca il calore e la diegesi di un vero strumento d'esplorazione tecnologico (il Pokédex tascabile).
* **Intervento Consigliato:**
  * Trasformare l'Arkadex in una **scocca metallica a doppio schermo da viaggio** (ispirata alla console DS), con texture satinata, cerniera centrale virtuale, spie luminose a LED e un lettore olografico che analizza il modello del mostro selezionato con wireframe ed effetti particellari.

---

## 4. Nuove Funzionalità per lo Streaming Twitch

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARCHITETTURA DI DIRETTA                         │
│                                                                        │
│       ┌──────────────┐                  ┌──────────────┐               │
│       │  G1 (MELIA)  │◄── GARA LEGA ───►│  G2 (MAGGI)  │               │
│       └──────┬───────┘                  └──────┬───────┘               │
│              │                                 │                       │
│              └──────────────┬──────────────────┘                       │
│                             │                                          │
│                    ┌────────▼────────┐                                 │
│                    │   LIVIO (GM)    │                                 │
│                    │ Regia & D&D TTRPG│                                 │
│                    └────────┬────────┘                                 │
│                             │                                          │
│        ┌────────────────────┴────────────────────┐                     │
│        ▼                                         ▼                     │
│  [QR OSPITI DISCORD]                      [QR CHAT TWITCH]             │
│  Capipalestra / Super4                    Solo Allenatori NPC          │
│  Controllo Boss Remoto                    Votazione Mosse in Live      │
└────────────────────────────────────────────────────────────────────────┘
```

### A. Console GM su Secondo Monitor per Livio (Dual-Screen Setup)
Per consentire a Livio di condurre senza rallentare la narrazione con calcoli o finestre di codice:
1. **D&D Roll Master:** Pulsante rapido per lanciare prove di abilità a schermo con d20 o d6 (es. *"Melia tenta di forzare una porta: CD 14"*). Il risultato compare con un jingle trionfale o drammatico.
2. **Ambiente & Meteo Dinamico:** Selettore per cambiare all'istante l'atmosfera della mappa locale (Pioggia, Buio, Tempesta di Sabbia, Sole Cocente), con variazioni audio e filtri grafici su schermo.
3. **Soundboard Integrata:** Riproduzione di fanfare, battiti cardiaci per gli HP bassi e suoni di colpo critico con un singolo clic.

### B. Safe Zones Broadcast per le Webcam (Layout OBS-Ready)
* Configurare un'opzione di visualizzazione con layout calibrato per l'inserimento di 3 webcam senza sovrapporsi ai comandi:
  * **Top-Center:** Webcam di Livio (Il Master).
  * **Top-Left:** Webcam di Melia (G1) con bordo color magenta.
  * **Top-Right:** Webcam di Maggi (G2) con bordo color ciano.
  * **Area Centrale e Inferiore:** Tabellone di gioco, carte mosse, dadi e log di battaglia.

### C. Live Chat Hivemind Gauge (Votazione Allenatori Normali)
Durante le battaglie contro gli NPC in cui la chat prende il controllo del rivale:
* **Barra Percentuale in Tempo Reale:** Quando la chat inquadra il QR e vota, lo schermo mostra le barre di preferenza delle 4 mosse che fluttuano in diretta (es. *Morso 54%, Braciere 26%, Ruggito 12%, Turbosabbia 8%*).
* **Contatore Votanti:** Visualizzazione del numero di spettatori attivi (es. *"148 spettatori stanno controllando il Pigliamosche"*), che gratifica la community e stimola la partecipazione.
* **Auto-Fallback:** Se alla scadenza del timer (15s) non ci sono voti o si verifica un ritardo di connessione, subentra immediatamente l'IA senza bloccare la trasmissione.

### D. Gamepad Mobile Touch per Ospiti Discord (Capipalestra e Superquattro)
L'ospite collegato su Discord che inquadra il QR riceve sul proprio smartphone una web app ottimizzata:
* Schermata in stile console touch con le sue 6 creature, barre HP chiare e pulsanti per attaccare o effettuare lo switch strategico.
* Calcolo automatico delle efficacie di tipo visibili prima della conferma della mossa.
* **Banner di Presentazione Boss:** Quando il capopalestra entra in scena, a video parte una schermata speciale *"SFIDANTE IN ARRIVO"* con il ritratto dell'ospite e la sua citazione personalizzata.

---

## 5. Piano Operativo di Sviluppo (Roadmap)

```mermaid
flowchart TD
    subgraph Sprint 1: Visual & Layout
        A1[Contrasti Colore & Bottoni Mosse] --> A2[Iconografia Specifica Nodi Mappa]
        A2 --> A3[Preset Risoluzione OBS con Safe Zones Webcam]
    end

    subgraph Sprint 2: Game Feel & Dinamismo
        B1[Vassoio 3D per Lancio Dadi D6] --> B2[Anime Cut-In per Mossa Suprema]
        B2 --> B3[Hivemind Gauge Voti Chat in Battaglia]
    end

    subgraph Sprint 3: Architettura & GM Tools
        C1[Scomposizione di BattagliaScene.tsx] --> C2[Console Regia Privata per Livio]
        C2 --> C3[Auto-Snapshot Salvataggio su Disco Tauri]
    end

    Sprint 1 --> Sprint 2 --> Sprint 3
```

### Riepilogo Fasi Operative
1. **Fase 1 (Massima Priorità per la Diretta):**
   * Risolvere il contrasto delle carte abilità in combattimento.
   * Assegnare icone grafiche esplicative ai nodi delle mappe locali.
   * Definire gli spazi per le webcam del trio Arkanight.
2. **Fase 2 (Coinvolgimento e Spettacolo):**
   * Arricchire l'animazione dei dadi D6 con vassoio e particelle.
   * Aggiungere la barra animata dei voti per la chat.
   * Creare il banner d'ingresso personalizzato per i Capipalestra ospiti su Discord.
3. **Fase 3 (Stabilità e Manutenibilità):**
   * Suddividere `BattagliaScene.tsx` in hook e componenti specializzati.
   * Creare la console comandi rapida per Livio.
   * Implementare il salvataggio automatico di sicurezza su disco locale via Tauri.
