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
