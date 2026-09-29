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

## Confronto VFX in sviluppo

Nel tab `VFX`, usa **Confronta effetti nel VFX Lab** per aprire il laboratorio
in una nuova scheda. È disponibile solo con il server di sviluppo, all'indirizzo
`/#vfx-lab` (mantieni l'eventuale percorso base dell'applicazione).

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
Admin, movimento, scala base, offset e specchiatura. La scala di confronto `1×`
mantiene quella dell'asset; la posizione predefinita rispetta il suo anchor.
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
