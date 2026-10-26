# Preparazione alla pubblicazione — 26 ottobre 2026

Questo documento integra l'audit locale dopo la richiesta «Pusha tutto». I campi di pubblicazione in `verification.json` e le frasi «nessun commit/push» degli altri rapporti descrivono la fase di audit precedente, non lo stato successivo del repository remoto.

## Allineamento del repository

Prima di preparare il commit è stato recuperato e integrato con fast-forward l'aggiornamento remoto `6936c3821c1376eb18c8fef999b45e622d7955ce`. I suoi 201 percorsi comprendono documentazione, mappe, video sorgente, sprite e SVG; non cambia codice applicativo, manifest nativo o workflow e non si sovrappone ai file modificati dall'audit. Nessun asset aggiunto nel frattempo è stato rimosso.

La rigenerazione del catalogo Studio con questi file porta il totale da **842 a 970 immagini**. Restano tutte le 181 immagini UI fornite e le 110 splash; la libreria continua a montare solo 24 anteprime per pagina. I conteggi 842 nei rapporti precedenti sono quelli effettivamente verificati nella fase di audit.

Il manifest delle animazioni native e la relativa impronta sono invariati: il riferimento media resta `11eb8edfcaad86d2d6d59fcdfbc77682d1dc8367`. Le splash vengono incluse direttamente nel pacchetto web corrente; non richiedono un nuovo riferimento alle pagine native. I video sorgente appena aggiunti restano conservati: questo push non dichiara di averli convertiti in nuove animazioni native.

## Verifiche dopo l'allineamento

- Test del catalogo Studio: **2/2 riusciti**.
- Verifica dei PNG forniti e del catalogo splash: **57/57 riusciti**.
- Browser reale, libreria paginata e sostituzione/applicazione/ricarica della cornice PNG: **2/2 riusciti**, con catalogo da 970 immagini.
- TypeScript e build web: **riusciti**, 455 clip native, pacchetto locale **802,9 MiB**, entro il limite previsto di 900 MiB. L'aumento rispetto agli 784,1 MiB dell'audit deriva dagli asset remoti appena integrati. Rimane l'avviso già documentato sul bundle iniziale.
- Il controllo dei file da pubblicare non rileva output QA o build accidentalmente versionati, file oltre 100 MiB o candidati ai pattern controllati di credenziali. Tutti i 110 SHA-256 delle splash corrispondono al catalogo, inclusi Chimzap 037 e 038.
- Controllo del diff preparato per il commit: riuscito.

Le suite complessive dell'audit (**4.175 test unitari** e **19 scenari Studio**, oltre agli altri controlli) restano documentate separatamente in `verification.json`. Non vengono dichiarate rieseguite integralmente dopo il solo allineamento degli asset; sono stati ripetuti i controlli pertinenti sopra.

Log e screenshot locali sono conservati nella cartella ignorata `output/audit-2026-10-26/`, con prefisso `publication-`. La revisione effettivamente pubblicata e lo stato di GitHub Actions devono essere letti dal repository remoto: build locale, push e deploy sono verifiche distinte.
