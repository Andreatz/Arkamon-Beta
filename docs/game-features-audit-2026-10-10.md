# Verifica di Arkadex, Arkastore, registro e sfide — 10 ottobre 2026

La consegna comprende le cinque funzioni richieste: Arkadex, negozi, registro complessivo del match, sfide a seed/Fanta-Team Builder e differenza massima di cinque livelli in squadra. La [guida d’uso](./arkadex-arkastore-challenges.md) documenta controlli, prezzi e regole v1.

## Dati e integrazione

- Arkadex e registro fanno parte del salvataggio e del backup completo della campagna. I vecchi file restano validi: la collezione ricostruisce soltanto scoperte certe, senza inventare la cronologia precedente.
- Inventario esteso a sette oggetti, con recupero dei salvataggi delle Masterball precedenti. Il checkout e le cure esplicite verificano la scrittura prima della pubblicazione in memoria; quota o spazio bloccato conservano saldo, HP, oggetti, turno e registro.
- La Borsa in battaglia conserva consumo, cura, cronaca, status e prossimo turno nello stesso aggiornamento. La ricarica non consuma un secondo oggetto né ripete la cura.
- Il cap considera anche i membri KO; catture incompatibili vanno nel deposito, nuovi scambi incompatibili sono rifiutati, XP conservata oltre la fascia. I vecchi livelli e HP restano intatti, con avviso e riordino prima di un nuovo incontro.
- Le sfide conservano la campagna in un contenitore separato. Ogni tiro reale usa il generatore versionato; anteprime e animazioni non ne cambiano il cursore. La classifica confronta la stessa configurazione, con un contatore d’azioni indipendente dal limite della cronaca.
- I nuovi pannelli Arkadex, registro, Borsa e sfide si caricano quando vengono aperti. Nessun asset originale, video grezzo o atlas è stato convertito o inserito nella release.

## Correzioni emerse nella revisione

1. La persistenza delle sfide manteneva un adattatore anche negli ambienti senza browser: ora conserva il comportamento precedente in assenza di localStorage, lasciando visibili i veri errori di quota nel browser.
2. Un contenitore attivo con RNG corrotto poteva ripristinare la stessa vecchia campagna a ogni riavvio. Ora il recupero salva la campagna e ritira quel contenitore prima degli avanzamenti successivi.
3. Un risultato soltanto in memoria dopo quota esaurita poteva essere considerato già salvato. Ora il retry riscrive il risultato prima di chiudere lo scontro, con lo stesso ID e senza duplicare data o risultato.
4. Il banner della sfida e la scena avevano la stessa chiave di rimontaggio: un banner poteva rimanere sullo schermo dopo l’uscita. Le due chiavi sono distinte; il browser verifica rimozione del banner e ritorno alla campagna.
5. Il registro/Arkadex sono protetti da riferimenti legacy incompleti. I controlli con testo dinamico hanno nomi accessibili stabili.
6. La Borsa aveva un salto nella gerarchia dei titoli; il catalogo Fanta pieno aveva solo pulsanti disabilitati in un’area scorrevole. Ora i titoli sono consecutivi e il catalogo riceve il focus anche a squadra completa.
7. Il premio del rivale per un KO da status ignorava la fascia di squadra nelle sfide. Ora segue il cap anche in quel percorso; la prova browser verifica veleno, XP conservata al livello 25 con compagni al 20 e HP residui senza cura.

## Evidenza automatica

- **1.897 test Vitest passati in 103 file**, inclusi i casi economici, di cap, recupero, isolamento della campagna, generazione di squadre per 120 seed, duplicati e retry.
- **TypeScript e build di produzione passati.** Il modulo principale resta grande, come documentato negli audit precedenti; l’ottimizzazione degli asset è rinviata per richiesta dell’utente.
- **40 prove browser passate**: suite completa iniziale di 36, due prove aggiuntive sul cap e due sul KO da veleno del rivale, tutte desktop/mobile. I contesti isolati non leggono i salvataggi del browser abituale. La CI riesegue insieme tutte le 40 prove sul commit della pull request.

## Flussi browser dei nuovi contenuti

- Due starter scelti nella UI, Arkadex separati, ricerca che nasconde specie sconosciute e controlli axe.
- Registro d’avvio/starter, filtri G1/G2 ed esportazione effettiva JSON e testo.
- Cattura con Masterball, scoperta persistente, registro senza duplicati e Arkadex del secondo giocatore invariato.
- KO reale, crescita al livello 15, evoluzione dalla UI, HP residui conservati e due stadi ottenuti nell’Arkadex.
- Arkastore: carrello insufficiente senza addebito, acquisto multiplo, passaggi del turno, ricarica, Antiparalisi e Pozione esplicite, secondo inventario invariato, axe e schermate.
- Borsa in battaglia: HP 3 → 6, consumo di una Pozione, passaggio al rivale, ricarica senza doppia cura e cronaca unica.
- Sfida a seed: sei membri per lato, primo attacco reale, ricarica di HP/cursore/cronaca, campagna preservata e stesso attacco con gli stessi dadi al nuovo tentativo.
- Fanta-Team: sei specie entro 100 crediti, settimo slot impedito, sostituzione, condivisione, import valido/non valido, persistenza e axe.
- Risultato concluso recuperato da fixture: Prosegui registra una sola conclusione e ripristina la campagna. Questa prova non equivale a giocare tutti i sei KO.
- Cap: KO con livello 10 e compagno al 5, XP conservata senza livello 11 o cura; scambio reale con specie al 20 rifiutato, collezione e HP invariati dopo reload.
- Cap del rivale nelle sfide: KO da veleno del giocatore, premio XP del rivale fermo al livello 25 con compagni al 20, HP 3 conservati e ripresa senza duplicare il premio.

La suite include anche i flussi precedenti: backup/ripristino, interazioni, Suprema senza anticipare il KO, deposito e ripresa del voto. Il voto usa risposte HTTP simulate e non prova la disponibilità del backend pubblico.

## Limiti della verifica

Non è stata giocata tutta la campagna fino a Roma né un intero torneo. Le prove sono su browser reali con viewport mobile, senza telefoni fisici. La classifica delle sfide è locale; la condivisione usa un codice di configurazione e non introduce un servizio online. Non è stato compilato un nuovo installer o effettuato un deploy. Una pull request in bozza resta distinta da merge e pubblicazione.
