# Modalita Admin Grafica

Arkamon include una modalita admin locale per modificare l'aspetto del gioco senza cambiare manualmente i file CSS o TSX.

## Come attivarla

Premi `CTRL + SHIFT + A` dentro il gioco.

In sviluppo l'admin e' abilitato di default. In produzione non mostra pulsanti finche non viene attivato con la scorciatoia.

## Cosa modifica

La V1 modifica:

- colori globali del tema;
- colori delle barre HP;
- raggio di pannelli e bottoni;
- opacita dei pannelli;
- intensita delle ombre;
- scala click dei bottoni;
- scala dello stage 16:9;
- posizione e dimensione degli elementi principali di battaglia, mappa, deposito ed evoluzione;
- posizione dei pallini della mappa principale;
- preset grafici;
- import/export JSON del tema.
- selezione di asset gia presenti in `public/`.

Il tab **Interazioni** configura le attività dei pallini delle mappe locali: dialoghi, cure, incontri, requisiti, costi, ricompense e tappe collegate. I numeri sono visibili solo nell’editor. Il catalogo si salva separatamente dal tema ed è incluso nel backup completo della partita. Vedi [guida agli strumenti della partita](./player-tools.md).

## Confronto VFX in sviluppo

Nel tab `VFX`, usa **Confronta effetti nel VFX Lab** per aprire il laboratorio
in una nuova scheda. È disponibile solo con il server di sviluppo, all'indirizzo
`/#vfx-lab` (mantieni l'eventuale percorso base dell'applicazione).

Il Lab apre con **Solo selezione consigliata** attivo: mostra le scelte confermate
e le proposte della scrematura, distinguendole dalle riserve. **Azzera filtri**
riporta all'intero catalogo. La selezione è documentata in
[VFX_CURATION_REVIEW.md](./VFX_CURATION_REVIEW.md).

1. Scegli una categoria e attiva **Solo candidati** per vedere la prima selezione
   del catalogo, inclusi effetti preferiti e speciali. Puoi combinare questi filtri
   con ricerca e formato.
2. Seleziona un effetto e premi **Fissa come riferimento**.
3. Scegli un altro effetto dall'elenco, oppure usa **Precedente** / **Successivo**.
4. Usa **Replay sincronizzato** per riprodurli insieme. Lato, posizione, scala e
   sfondo sono condivisi. Su schermi stretti le anteprime sono disposte in verticale.
5. Attiva **Ripeti automaticamente** per un confronto continuo: ogni ciclo aspetta
   la fine dell'effetto più lungo. La preferenza di movimento ridotto disabilita
   la ripetizione automatica.

Il Lab usa lo stesso renderer VFX della battaglia, compresi gli anchor del layout
Admin, movimento, scala base, offset e specchiatura. La modalità **Salvata / originale**
applica le regolazioni della curation, se presenti, altrimenti quelle dell'asset.
Le scelte manuali di posizione e scala sostituiscono le regolazioni salvate:
`1×` mantiene la scala originale e `1.5×` non viene applicato due volte.
Anche la selezione di un asset nell'Admin VFX parte dalle regolazioni salvate,
che rimangono modificabili nei campi Scala e Anchor.
Le dieci scelte confermate di Psico, Elettro, tagli e impatti fisici sono anche
collegate automaticamente alle mosse con archetipo e intensità corrispondenti.
Gli override Admin e le assegnazioni specifiche per mossa hanno precedenza;
**Ripristina mossa** rimuove l'override temporaneo e torna alla scelta automatica
o all'assegnazione specifica esistente. Esempi di mosse per ogni ruolo sono in
[VFX_CURATION_REVIEW.md](./VFX_CURATION_REVIEW.md#collegamento-alle-mosse).
Le anteprime mostrano categorie, priorità e note della curation. Un filtro non
cancella l'effetto selezionato né il riferimento.

Il confronto non crea override delle mosse. Selezione, riferimento e controlli
durano fino al refresh; il catalogo iniziale rimane in
`src/components/vfx/vfxCuration.ts`. Il file `generatedVfxAssets.ts` resta gestito
esclusivamente dalla pipeline di generazione.

## Dove salva

Il tema viene salvato con Zustand persist nella chiave:

```text
arkamon-admin-theme
```

Il salvataggio grafico e' separato dal salvataggio partita, che resta nella chiave:

```text
arkamon-save
```

## Import ed export

Nel tab `Import/Export` puoi copiare il JSON corrente, scaricarlo come `arkamon-theme.json` o incollare un JSON valido per importare un tema.

L'import controlla struttura minima, colori hex e valori numerici UI. Un JSON errato mostra un messaggio e non modifica il gioco.

## Limiti GitHub Pages

GitHub Pages pubblica solo frontend statico: non esiste autenticazione reale lato client. La scorciatoia nasconde l'admin, ma non e' una misura di sicurezza forte.

Per sicurezza reale servirebbe un backend, una build desktop con storage controllato o un flag di build separato.

## Come disattivarla

Chiudi il pannello con `Chiudi` oppure premi di nuovo `CTRL + SHIFT + A`.

Per tornare all'aspetto iniziale usa `Ripristina Arkamon Classico` nel tab `Preset`, oppure i pulsanti di ripristino del tab `Layout`.
