# Selezione esatta degli elementi Studio nei test di pubblicazione

La [CI del commit f3ff20be](https://github.com/Andreatz/Arkamon-Beta/actions/runs/42046863711) si è fermata nel gruppo browser generale: 303 prove superate, una fallita e 62 escluse dai rispettivi scenari. Il deploy Pages è stato saltato perché dipende dal successo della verifica completa.

Entrambi i trace del caso fallito mostrano una selezione ambigua nel test `ui-studio-assets.spec.ts`. La ricerca conteneva `layout.mosse-giocatore.command.button.1`, ma il primo risultato era il comando di supporto «Mosse giocatore», con ID `layout.mosse-giocatore.command.button.1.2`. Il test applicava correttamente `infobox.svg` a quel comando e controllava poi lo sfondo del vero pulsante della mossa, ancora sul PNG originale.

La riga di ciascun elemento nell'elenco Studio espone ora il proprio ID registrato in `data-ui-element-id`. Il test usa l'uguaglianza esatta di quell'attributo, controlla lo stato selezionato e verifica lo stesso ID nell'inspector prima di applicare la grafica. Aspetta inoltre che i comandi di supporto siano presenti e controlla che il loro sfondo non cambi quando si modifica il pulsante della mossa. Restano attive le verifiche della grafica applicata, del testo, dell'icona del tipo e del ripristino «Originale».

Gli ID del registry e i layout salvati restano identici. Non vengono cambiate le superfici grafiche, le impostazioni delle animazioni, i media o i criteri della CI; nessun test viene disabilitato e nessuna attesa viene allungata.

Verifiche locali della correzione:

- **20/20** scenari browser dello Studio: asset, contratti, editor, anteprima ed ereditarietà; zero retry o esclusioni.
- **5/5** esecuzioni indipendenti del caso corretto, con due processi e zero retry.
- **49/49** test unitari dello Studio, in nove file.
- TypeScript, build di produzione e budget di avvio superati.
- **3/3** scenari generali sulla nuova build di produzione.

I log locali sono in `output/pages-studio-fix-2026-11-05/`. La verifica locale non sostituisce l'esito della nuova CI o la conferma di aggiornamento del sito Pages, che vengono controllati separatamente dopo il push.
