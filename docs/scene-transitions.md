# Transizioni Arkamon: il D6 custodisce la creatura

La transizione tra scene usa un oggetto riconoscibile: un dado D6 cremisi e nero, con sei punti sulla faccia chiara e il simbolo circolare fornito dall'utente sul medaglione superiore (anello rosso, centro nero e segno bianco). Il dado entra con un lancio, rimbalza, si assesta e si apre esattamente lungo la linea nera centrale originale. Si solleva l'intera metà superiore; le fossette attraversate dalla linea vengono divise tra le due metà, senza un secondo taglio più in alto. Un breve bagliore accompagna il logo ufficiale e l'arrivo alla nuova scena. Il percorso a caselle sullo sfondo collega l'oggetto all'esplorazione da boardgame.

Il movimento è decorativo: non estrae risultati, non consuma dadi o turni e non cambia lo stato della partita. Il simbolo unisce i due elementi del gioco: le creature custodite e il viaggio guidato dai D6.

## Versione precedente ibernata

Il portale di energia è conservato integralmente in [archive/scene-transitions/energy-portal-v1](../archive/scene-transitions/energy-portal-v1/README.md), con i nove file originali e un manifesto SHA-256. Nessun file attivo importa quell'archivio. I suoi due test conservano il contenuto originale con estensione `.test.ts.snapshot`, così restano esclusi dalla scoperta automatica. Il README descrive il ripristino.

La versione ibernata non appare nemmeno come riserva in caso di errore del video di battaglia.

## Illustrazioni e risorse

Le due pose sono state modificate con il generatore di immagini integrato. Gli originali, i prompt completi, il riferimento del simbolo conservato senza modifiche e la provenienza sono in [art-source/transitions/arkamon-d6](../art-source/transitions/arkamon-d6/prompts.md). La normalizzazione conserva il disegno: stesso fattore di scala per entrambe le pose, margini trasparenti su una tela 1024 × 1024 e WebP senza perdita.

Le risorse usate dal gioco sono:

- `public/ui/transitions/arkamon-d6-closed.webp`
- `public/ui/transitions/arkamon-d6-open.webp`
- Il logo esistente `public/ui/logo_arkamon.png`, senza modifiche.

Le pose vengono precaricate e decodificate all'apertura dell'app. Se una posa non si carica, resta visibile il dado chiuso oppure una faccia a sei punti. Il percorso e i nodi sono elementi vettoriali decorativi.

## Integrazione

Il coordinatore delle scene mantiene l'ultima scena presentata durante la copertura e applica la nuova navigazione quando l'overlay è opaco. Conserva il payload della scena uscente, impedisce clic e tasti di movimento durante il passaggio e rilascia il blocco alla fine. Un secondo cambio di scena mentre l'overlay è già visibile mantiene la copertura.

- Mappe, città, laboratorio, deposito e schermate: D6, circa 1,84 secondi complessivi.
- Evoluzione: stesso D6, circa 2,14 secondi, leggero aumento della luminosità senza cambiare il colore del marchio.
- Battaglia: mantiene soltanto il segmento finale del video VS esistente (secondi 5–8). Il D6 non viene montato e non compare durante copertura, attesa, riproduzione o errore. Una copertura scura accompagna l'attesa; un limite temporale o un errore libera sempre la navigazione senza introdurre l'animazione del dado.

La preferenza di movimento ridotto viene rispettata dal coordinatore: il cambio scena è immediato e non riproduce la transizione. L'anteprima offre in quel caso una vista statica.

## Anteprima

In sviluppo aprire `http://localhost:3000/#transition-lab`. Il pulsante **Riproduci** mostra l'overlay reale per mappe, evoluzione o battaglia. La pagina non avvia una partita e non cambia il salvataggio. Il pulsante e il selettore restano disabilitati durante la riproduzione.

La pagina è riservata allo sviluppo, come il VFX Lab. Per la verifica eseguire `npm test` e `npm run build` e controllare la riproduzione nel browser. I test dell'archivio confrontano i nove file byte per byte e controllano che la vecchia grafica non sia attiva. I test delle immagini verificano provenienza, integrità, simbolo di riferimento e trasparenza effettiva dei WebP. I test di rendering dell'overlay verificano che la battaglia non monti le immagini o altri elementi del dado e che mappe ed evoluzione mantengano le due pose.
