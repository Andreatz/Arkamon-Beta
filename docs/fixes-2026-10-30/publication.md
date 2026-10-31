# Pubblicazione e verifica remota — 31 ottobre 2026

Il commit `28429b5cde86bd945c4f39eb8b69721d068c37d4` è stato pubblicato su `main`, insieme ai due commit della libreria di animazioni native. Il confronto fra HEAD, `origin/main` e il riferimento remoto GitHub ha confermato la stessa revisione e un checkout pulito.

Il [primo workflow completo](https://github.com/Andreatz/Arkamon-Beta/actions/runs/41076116877) è stato interrotto dal limite di durata del job. L'annotazione GitHub conferma: `The job has exceeded the maximum execution time of 1h5m0s`.

I controlli unitari, i contratti, gli asset, la sicurezza, il catalogo, la build, il budget di avvio, entrambi i gruppi browser, l'unione dei report e i tre test generali sul compilato erano conclusi con successo. Il timeout ha interrotto i test nativi sul compilato, dopo il primo caso superato; questo risultato parziale non certifica l'intero gruppo. Sigillatura, caricamento dell'artefatto e deploy sono stati saltati.

Checkout (9 minuti e 41 secondi) e gruppi browser (26 minuti e 31 secondi più 25 minuti e 43 secondi) hanno consumato quasi tutto il budget. Il limite del job passa da 65 a 90 minuti per lasciare margine alle verifiche finali e al caricamento. Test, criteri di verifica e compilato condiviso restano invariati.

Il nuovo push avvia una nuova esecuzione. Il suo esito e il deploy devono essere verificati separatamente; questo documento non li presenta come conclusi.
