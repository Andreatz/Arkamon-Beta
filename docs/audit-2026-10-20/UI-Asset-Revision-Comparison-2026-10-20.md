# Confronto tra asset allegati e asset della build

> Archivio del 20 ottobre 2026: **Confronto locale delle revisioni SVG**. Origine nella cartella della sessione: `outputs/UI-Asset-Revision-Comparison-2026-10-20.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Ho controllato anche la copia indicata negli allegati, `C:\\Users\\andre\\Desktop\\GitHub\\Arkamon-Beta`.

- La copia Desktop contiene **414 SVG** sotto `public/ui`.
- Di questi, **240** sono nella struttura `public/ui/studio` richiesta dall’elenco allegato: 56 Blu, 56 Scuro, 14 Comuni, 98 individuali, 13 progression e 3 runtime.
- La copia Desktop include anche **126** SVG nelle cartelle legacy `public/ui/blu`, `public/ui/scuro` e `public/ui/comuni` e **48** SVG `player-kit`.
- La checkout della build contiene **288 SVG**: 224 Studio (`Blu`, `Scuro`, `Comuni`, `individuali`), 48 `player-kit`, 13 `progression` e 3 `runtime`.
- Tutti i file omonimi della struttura `public/ui/studio` hanno lo stesso `viewBox` tra Desktop e checkout; anche il conteggio di `path` e `g` coincide. Le differenze SHA-256 osservate su 119 file sono quindi differenze di contenuto testuale/metadata della revisione, non di tela o geometria rilevata dall’audit.

Per la resa della build ho usato la checkout, perché è quella che contiene il codice runtime analizzato. Per la disponibilità artistica ho considerato l’elenco Desktop: le categorie e le conclusioni della [mappa di utilizzo](./UI-Asset-Usage-Map-2026-10-20.md) valgono per entrambi i set Studio; prima di creare gli SVG finali conviene però copiare nella checkout la revisione Desktop scelta e registrarla come sorgente canonica.
