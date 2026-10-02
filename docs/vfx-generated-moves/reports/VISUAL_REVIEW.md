# Revisione visiva degli sprite VFX Arkamon

Verifica conclusiva: 2026-10-02T14:48:49+00:00.

**276/276 ID presenti, con esito visivo pass nei report e QA automatica pass nel manifest.** I 276 PNG finali hanno digest distinti. Nessun ID duplicato o mancante; nessuna divergenza tra gli hash registrati nei report, nel manifest e nei file correnti.

## Confine della verifica

- Revisione visiva statica aggregata dai report esistenti. Alcune schede iniziali valutano frame selezionati (in particolare 6 e 10); altre descrivono tutti i 16 frame. Le note per ID conservano questa distinzione.
- La fluidità in riproduzione, il timing nel motore del gioco, il posizionamento reale sui personaggi e il blending su tutti gli sfondi non sono verificati da questo report.
- 97 schede precedenti non registravano un hash della revisione: il digest corrente viene fissato in questo aggregato e coincide con il digest QA del manifest; la corrispondenza con uno snapshot visivo storico senza hash non può essere dimostrata crittograficamente.
- I warning tecnici residui sono conservati. Il pass visivo esprime la valutazione statica documentata nelle note e non significa che un warning sia stato eliminato dal normalizzatore.

Copertura documentata per asset: 130 fogli interi; 8 culmini selezionati; 138 campioni dei frame 6 e 10. La tabella specifica il metodo di ciascuna mossa; le versioni rigenerate sono indicate separatamente.

## Integrità e provenance

Gli hash SHA-256 completi e le note originali per ogni ID sono in `visual-review-final.json`. Gli originali generati sono preservati; questa aggregazione non modifica immagini o report precedenti. Il controllo dei prompt degli ultimi 26 output del repair agent è documentato in `prompt-provenance-repair-audit.json`: sono stati corretti soltanto i metadati di 89, 93, 97 e 116. Anche le nuove correzioni 273 e 276 registrano il prompt effettivo completo nel manifest.

Warning QA conservati per 49 ID: 2, 3, 6, 7, 9, 11, 12, 14, 15, 25, 26, 29, 30, 33, 37, 40, 41, 45, 48, 61, 66, 67, 73, 75, 81, 87, 96, 102, 104, 105, 106, 108, 117, 120, 127, 133, 141, 147, 188, 189, 195, 203, 207, 211, 219, 220, 231, 233, 267.

## Report di origine

| Report | ID revisionati |
|---|---:|
| visual-review-001-010.json | 10 |
| visual-review-011-100.json | 90 |
| visual-review-101-200.json | 100 |
| visual-review-201-220.json | 20 |
| visual-review-221-240.json | 20 |
| visual-review-241-260.json | 9 |
| visual-review-250-253.json | 4 |
| visual-review-254-260.json | 7 |
| visual-review-261-276.json | 16 |

## Registro delle 276 mosse

Il digest abbreviato identifica il PNG corrente; il JSON contiene tutti i 64 caratteri.

| ID | Mossa | Esito statico | Metodo documentato | SHA-256 corrente (prefisso) |
|---:|---|---|---|---|
| 1 | Soffio | pass | foglio intero | `b36788e7655c13f1` |
| 2 | Assalto | pass | foglio intero | `dde2ba5e64ac2e09` |
| 3 | Impatto verticale | pass | culmine selezionato | `fc781fcb62f6a625` |
| 4 | Carica ossidrica | pass | culmine selezionato | `7e524621e55cc17b` |
| 5 | Voltaggio | pass | culmine selezionato | `f623604d55bec4d9` |
| 6 | Alta tensione | pass | culmine selezionato | `6734ddfbc7584fba` |
| 7 | Stormo di fulmini | pass | culmine selezionato | `8569a3042372aa07` |
| 8 | Nevischio | pass | culmine selezionato | `1aae48af7a2a6276` |
| 9 | Valanga | pass | culmine selezionato | `f3ae9d07cac84e5e` |
| 10 | Tormenta glaciale | pass | culmine selezionato | `4da2a987996478fe` |
| 11 | Lapillo | pass | campioni 6/10 | `4086e0286d447ada` |
| 12 | Roccia fusa | pass | campioni 6/10 | `8c74879f9e1ba423` |
| 13 | Cratere | pass | campioni 6/10 | `333b2973df48e7bc` |
| 14 | Conduttore | pass | campioni 6/10 | `c79b6da37d98b5e8` |
| 15 | Circuito chiuso | pass | campioni 6/10 | `0ce03c46b450025a` |
| 16 | Sprint | pass | campioni 6/10 | `669a57cef223d771` |
| 17 | Scatto | pass | campioni 6/10 | `5a74b10a2e33fd47` |
| 18 | Elettroscontro | pass | campioni 6/10 | `999ad16922eb28ed` |
| 19 | Elettrocarica | pass | campioni 6/10 | `ea71e8f617378845` |
| 20 | Spruzzo | pass | campioni 6/10 | `a2e950514651d82a` |
| 21 | Alta marea | pass | campioni 6/10 | `95ddb3b66f853bcb` |
| 22 | Spavento | pass | campioni 6/10 | `33d0af8a38d33a08` |
| 23 | Terrore | pass | campioni 6/10 | `e3db369cbcf07f70` |
| 24 | Paradosso | pass | campioni 6/10 | `349e54b3a3a423ab` |
| 25 | Ultimo sangue | pass | campioni 6/10 | `eda9f2d74fe9adbf` |
| 26 | Arrembaggio | pass | campioni 6/10 | `572ed1edb0a30992` |
| 27 | Onda anomala | pass | campioni 6/10 | `3e74600bb5080150` |
| 28 | Zampata | pass | foglio intero | `a663ce2a63a38341` |
| 29 | Colpo felpato | pass | campioni 6/10 | `168be98d608f7ff4` |
| 30 | Artigli del terrore | pass | foglio intero | `58f58c385f0e5f3f` |
| 31 | Abisso tenebroso | pass | campioni 6/10 | `731073a68aab4ac3` |
| 32 | Alito incandescente | pass | campioni 6/10 | `a37f86a4bdcdb1f8` |
| 33 | Sbuffo magmatico | pass | campioni 6/10 | `ac50f99330d964f1` |
| 34 | Soffio lavico | pass | campioni 6/10 | `a54bcf5d1647d58c` |
| 35 | Mani brucianti | pass | campioni 6/10 | `7cb5bb8db25ab3d2` |
| 36 | Palla di fuoco | pass | campioni 6/10 · versione rigenerata | `56872dc6afbd7520` |
| 37 | Ardemonio | pass | campioni 6/10 | `2f6f88b42a914026` |
| 38 | Scossa | pass | campioni 6/10 · versione rigenerata | `2d4d7e37bda7ec88` |
| 39 | Lampo | pass | campioni 6/10 | `c818867546cffd95` |
| 40 | Lotta tonante | pass | campioni 6/10 | `f27cefdb7cc2988f` |
| 41 | Fioritura | pass | campioni 6/10 | `b55f7ad46ef7003a` |
| 42 | Florilegio letale | pass | campioni 6/10 | `2fb9bc5c8d77640f` |
| 43 | Controllo mentale | pass | campioni 6/10 | `0709ae1b1f6dd773` |
| 44 | Collasso nervoso | pass | campioni 6/10 | `89f17bc4d4c220cc` |
| 45 | Urlo straziante | pass | campioni 6/10 | `24928b3b384dad77` |
| 46 | Materia oscura | pass | campioni 6/10 | `be5c8a8f3d24c70d` |
| 47 | Spazzata | pass | campioni 6/10 | `83df0ea4fecb6213` |
| 48 | Falcidiata | pass | campioni 6/10 | `89301edb6951543f` |
| 49 | Inumidire | pass | campioni 6/10 | `84cc0599e14b9cda` |
| 50 | Attacco fradicio | pass | campioni 6/10 | `795c349d4ba19014` |
| 51 | Tempesta magnetica | pass | campioni 6/10 | `a2bf14bce1fb79b7` |
| 52 | Temporale | pass | campioni 6/10 | `3d7f9e2a4808858a` |
| 53 | Angoscia | pass | campioni 6/10 | `8b5c77a3fb30a7dc` |
| 54 | Avanzata | pass | campioni 6/10 | `7ca1048e7cc232b5` |
| 55 | Sussurro | pass | foglio intero | `609fab23885bb9e2` |
| 56 | Sesto senso | pass | foglio intero · versione rigenerata | `07fdbe80d3c4035e` |
| 57 | Intreccio mentale | pass | foglio intero | `980cc35b31d0552b` |
| 58 | Occhio universale | pass | foglio intero | `490b32fedd6cb907` |
| 59 | Assorbilinfa | pass | foglio intero | `7f7ed547e44275c6` |
| 60 | Avanguardia | pass | campioni 6/10 | `59339b962587fc1f` |
| 61 | Sciame operaio | pass | foglio intero | `cc0017068786ffa6` |
| 62 | Manto d'ombra | pass | campioni 6/10 | `aeb94af0a5b87c37` |
| 63 | Buio pesto | pass | campioni 6/10 | `2f76ef4e167f3523` |
| 64 | Fiamma nera | pass | campioni 6/10 | `190272a624897ac6` |
| 65 | Foglia caduca | pass | campioni 6/10 | `b98b19aa95ea4894` |
| 66 | Risveglio verde | pass | foglio intero | `f00ba8c5bef873d5` |
| 67 | Forza della natura | pass | foglio intero | `cf0a934192c0e574` |
| 68 | Luna storta | pass | campioni 6/10 | `61e4d870436876bf` |
| 69 | Luna rossa | pass | campioni 6/10 | `f3265317b19dc688` |
| 70 | Puntura anestetica | pass | campioni 6/10 | `4ea6e701895e047e` |
| 71 | Sete di sangue | pass | foglio intero | `a4860a538996a0c4` |
| 72 | Predigestione | pass | campioni 6/10 | `f361610db2b3bc98` |
| 73 | Divoramento | pass | foglio intero | `a947ef881c16e594` |
| 74 | Cerino | pass | campioni 6/10 · versione rigenerata | `8d09a9669d05f1aa` |
| 75 | Cimitero di fiamme | pass | campioni 6/10 | `4753546c38e1555b` |
| 76 | Scossa d'assestamento | pass | foglio intero · versione rigenerata | `820abeda0b88011b` |
| 77 | Canyon | pass | campioni 6/10 | `7fb88d1d5e29412d` |
| 78 | Rivolta | pass | campioni 6/10 | `9274d979e2cee366` |
| 79 | Guerriglia | pass | foglio intero | `3152a227a39200ad` |
| 80 | Fangospruzzo | pass | campioni 6/10 | `3fe74bb848aa5ab9` |
| 81 | Fornace | pass | foglio intero | `54a180dc6f9e2e94` |
| 82 | Sotterrare | pass | campioni 6/10 | `4a50a81898487f73` |
| 83 | Sepoltura | pass | foglio intero | `b85c99f78b5ac3d7` |
| 84 | Emersione | pass | campioni 6/10 | `c4e51b56da14caa0` |
| 85 | Area 51 | pass | campioni 6/10 | `3f35028fe89586b0` |
| 86 | Viaggio temporale | pass | campioni 6/10 | `9bafcf365c9f1668` |
| 87 | Ritorno al futuro | pass | campioni 6/10 | `10f15c25ddf274b6` |
| 88 | Occhiolino | pass | foglio intero | `87259fdcadc993a1` |
| 89 | Pressione spirituale | pass | foglio intero · versione rigenerata | `c2a1acc938e0006d` |
| 90 | Assorbianima | pass | campioni 6/10 | `98b884e39d4eaef5` |
| 91 | Immersione | pass | campioni 6/10 | `f5021350d7098aa8` |
| 92 | Affondare | pass | campioni 6/10 | `cd5371080a4b36a4` |
| 93 | Morte dagli abissi | pass | foglio intero · versione rigenerata | `10581654f114aade` |
| 94 | Getto del peso | pass | campioni 6/10 | `0b4eb52ee28099bd` |
| 95 | Bombardamento | pass | campioni 6/10 | `2275f9a82d53eb4e` |
| 96 | Gufata | pass | foglio intero | `62f1edcef72c5320` |
| 97 | Picchiata fatale | pass | foglio intero · versione rigenerata | `ff74e5f21fca5e44` |
| 98 | Fiammella | pass | foglio intero | `507f58d4bdae13d0` |
| 99 | Spirale ardente | pass | foglio intero | `2a76f5fd39279829` |
| 100 | Testata bassa | pass | campioni 6/10 | `e445d844e41c189b` |
| 101 | Lana magica | pass | campioni 6/10 | `bf17f81ae7643ddd` |
| 102 | Funerale del deserto | pass | foglio intero | `9f2ce911f4a4a5c0` |
| 103 | Sbuffo lavico | pass | campioni 6/10 | `5e202820f04b62dd` |
| 104 | Sradicamento | pass | foglio intero | `decb112abeac31a9` |
| 105 | Jumpscare | pass | foglio intero | `71026f120557b0e0` |
| 106 | Legnata | pass | foglio intero | `52e3747ebae48458` |
| 107 | Sguardo glaciale | pass | campioni 6/10 | `64b2311abc02f6c0` |
| 108 | Ordine sovrano | pass | foglio intero | `da8126f6dc7fd684` |
| 109 | Vortice divino | pass | foglio intero | `aad54a78c0c787e5` |
| 110 | Fiamma celestiale | pass | foglio intero | `6a14e937c7e28403` |
| 111 | Brezza Profumata | pass | campioni 6/10 | `37b11ee84063e3aa` |
| 112 | Vento Silvano | pass | foglio intero | `6beb285c2443b410` |
| 113 | Maestrale Boschivo | pass | foglio intero | `178031b69132cc63` |
| 114 | Tempesta di Fiori | pass | campioni 6/10 | `2d675fbeb139e1f0` |
| 115 | Ciuffo Verde | pass | campioni 6/10 | `fb5160c3deb0939a` |
| 116 | Mazzetto Erboso | pass | foglio intero · versione rigenerata | `f7237f9440f3f6f0` |
| 117 | Cespuglio Rigoglioso | pass | foglio intero | `360330fb1c8ba983` |
| 118 | Penna Arcobaleno | pass | campioni 6/10 | `6fa795d3f711bff5` |
| 119 | Ali Elusive | pass | campioni 6/10 | `e9fb743bf9d6948a` |
| 120 | Piumaggio Illusorio | pass | foglio intero | `6e5bf57a15429d52` |
| 121 | Bollobrace | pass | foglio intero | `8fe5ef215f0963a8` |
| 122 | Fauci incandescenti | pass | campioni 6/10 | `562184e6c22ce45e` |
| 123 | Detonazione lavica | pass | campioni 6/10 | `75b735daf20b1480` |
| 124 | Cerchio Ondoso | pass | campioni 6/10 | `1f1b4092d16ae0e3` |
| 125 | Spirale Acquatica | pass | campioni 6/10 | `eef61edb66591450` |
| 126 | Polverone | pass | campioni 6/10 | `3a39499af3ab37bd` |
| 127 | Marcia del deserto | pass | foglio intero | `8a21b6b87a135487` |
| 128 | Ringhio Ribelle | pass | campioni 6/10 | `ab5be6bcab46dcb8` |
| 129 | Colpo Rabbioso | pass | campioni 6/10 | `d0a48cf16874817d` |
| 130 | Pinna Rotante | pass | campioni 6/10 | `c92532f9edfa4d95` |
| 131 | Danza dei Fondali | pass | campioni 6/10 | `7f9f0b61c4392a39` |
| 132 | Terrore del Fienile | pass | campioni 6/10 | `cc5bc61af2344418` |
| 133 | Spauracchio Contadino | pass | foglio intero | `1ebdbe6086ae414b` |
| 134 | Foglia Quantica | pass | campioni 6/10 | `369cc3d27e6b3f0b` |
| 135 | Incendio a Staffetta | pass | campioni 6/10 | `cd759be7ef4f9dc6` |
| 136 | Maremoto Sotterraneo | pass | campioni 6/10 | `f5ab7ab7b4b269cb` |
| 137 | Sbattimuso | pass | foglio intero · versione rigenerata | `be979f182fe7b330` |
| 138 | Dardo di Fiamma | pass | campioni 6/10 | `d70146d7ca14540e` |
| 139 | Pioggia di Scintille | pass | campioni 6/10 | `a4e28cc54f03b53a` |
| 140 | Furia Fuliggine | pass | campioni 6/10 | `034709f66b6bf315` |
| 141 | Mantello di Carbone | pass | foglio intero | `46f9218583feac19` |
| 142 | Sguardo Minaccioso | pass | campioni 6/10 | `ef04d2a6f6943901` |
| 143 | Ombra Rossa | pass | campioni 6/10 | `a3cf9b6b1e903a0a` |
| 144 | Piaga delle Tenebre | pass | campioni 6/10 | `d73fea9f6dcc1b06` |
| 145 | Lancio di Libri | pass | campioni 6/10 | `565506720afbea25` |
| 146 | Pugno Saggio | pass | campioni 6/10 | `a40c0c6ebe7b9357` |
| 147 | Conoscenza Antica | pass | foglio intero | `30e2237ee75a1e50` |
| 148 | Salto Idroelettrico | pass | campioni 6/10 | `e3891745af09603b` |
| 149 | Cascata Elettrificata | pass | campioni 6/10 | `6c50d4db14749848` |
| 150 | Idroscarica | pass | campioni 6/10 | `d24ea71b2f5d4ab7` |
| 151 | Scatto veloce | pass | campioni 6/10 | `1d05aa205f73d965` |
| 152 | Corsa inarrestabile | pass | foglio intero · versione rigenerata | `b92c7336adb57fd2` |
| 153 | Respiro profondo | pass | campioni 6/10 | `a6582172dcdbb702` |
| 154 | Tocco di pace | pass | campioni 6/10 | `ab30fcdef4ed7461` |
| 155 | Volo Furtivo | pass | campioni 6/10 | `2b27fb91c25abe05` |
| 156 | Sferzata Celata | pass | campioni 6/10 | `9648ed263d634e4d` |
| 157 | Fendente Ombraverde | pass | campioni 6/10 | `b4eac9a341425323` |
| 158 | Lama Sanguisuga | pass | campioni 6/10 | `4c1bd298eb9ff6d3` |
| 159 | Leccata Fangosa | pass | campioni 6/10 | `5d7562baeb0a94ef` |
| 160 | Baratro Melmoso | pass | campioni 6/10 | `4aba1dd462e9d7db` |
| 161 | Richiamo del Bosco | pass | campioni 6/10 | `c0ff425a2b3ff195` |
| 162 | Trappola Saltellante | pass | campioni 6/10 | `e1352700b293257c` |
| 163 | Assalto Marziano | pass | campioni 6/10 | `faf58caae2587e49` |
| 164 | Canto del Crepuscolo | pass | campioni 6/10 | `11d7c356e8affcff` |
| 165 | Tocco Ghiacciato | pass | campioni 6/10 | `413ba6977185ff53` |
| 166 | Squarcio Glaciale | pass | campioni 6/10 | `9fe21c82deabc89a` |
| 167 | Fredda Illusione | pass | campioni 6/10 | `8977707f64bef1d0` |
| 168 | Bora Eterea | pass | campioni 6/10 | `70aebf99d5bc4c91` |
| 169 | Ronzio Psichico | pass | campioni 6/10 | `f5f7037354eb108a` |
| 170 | Sciame Mentale | pass | campioni 6/10 | `296ad9c147448175` |
| 171 | Organizzazione Psionica | pass | foglio intero · versione rigenerata | `642657b5c7698d14` |
| 172 | Aspirafuoco | pass | campioni 6/10 | `f333eebb946f5bda` |
| 173 | Aura Incandescente | pass | foglio intero · versione rigenerata | `ee62ce9c10331fb0` |
| 174 | Cannone Infernale | pass | campioni 6/10 | `791c2d37aee669a2` |
| 175 | Spruzzata di Foglie | pass | campioni 6/10 | `a7564b209ab823b0` |
| 176 | Spirale Umida | pass | campioni 6/10 | `1c5c1426f8df6c30` |
| 177 | Alluvione di Germogli | pass | campioni 6/10 | `a16bc2e1505053dc` |
| 178 | Scintilla Lunare | pass | campioni 6/10 | `148292a13e1ae55e` |
| 179 | Eclissi Infuocata | pass | campioni 6/10 | `d2ff7826cd228713` |
| 180 | Puntura veloce | pass | campioni 6/10 | `46bea7de707d8036` |
| 181 | Danza del pungiglione | pass | campioni 6/10 | `8121f872191d9cd7` |
| 182 | Colpo di Liana | pass | campioni 6/10 | `a2624acd591c9185` |
| 183 | Agguato Silvestre | pass | campioni 6/10 | `2b0686e71114fdaa` |
| 184 | Ruggito fulminante | pass | campioni 6/10 | `8d4837dc574f6823` |
| 185 | Tuono regale | pass | foglio intero · versione rigenerata | `31b07897b6695cdb` |
| 186 | Braciere Profondo | pass | campioni 6/10 | `4768e8f4457c3492` |
| 187 | Fiamma Sotterranea | pass | campioni 6/10 | `b0dddba873f54074` |
| 188 | Pulviscolo Ionizzate | pass | foglio intero | `000a490f6986f58a` |
| 189 | Gemma Smeraldina | pass | foglio intero | `7386558b4ac52cd3` |
| 190 | Abbraccio Traballante | pass | campioni 6/10 | `35a311708889489f` |
| 191 | Surriscaldamento | pass | foglio intero · versione rigenerata | `3aec4097552dfbb3` |
| 192 | Scottatura | pass | campioni 6/10 | `ae2d437bb83d3577` |
| 193 | Sabbia Ardente | pass | campioni 6/10 | `9378e1ebdd6ac23d` |
| 194 | Tornado di Fuoco e Sabbia | pass | campioni 6/10 | `7f383f723e77448f` |
| 195 | Bruciatura Laser | pass | foglio intero | `fc8faca3d70242a4` |
| 196 | Fiamma Futuristica | pass | foglio intero · versione rigenerata | `2526961bac2a6858` |
| 197 | Scarica Pulsar | pass | foglio intero · versione rigenerata | `5b4ff95c13feebe9` |
| 198 | Polvere Ardente | pass | campioni 6/10 | `6c68f51e9436edc5` |
| 199 | Sfolgorio Magico | pass | campioni 6/10 | `9d06c51e8dda617b` |
| 200 | Turbinio di Fuochi Fatui | pass | foglio intero | `8f11d8071b1c1d57` |
| 201 | Nuotata Inquietante | pass | foglio intero | `17120f21a1963310` |
| 202 | Squalo Ombra | pass | foglio intero | `8f8579b77acd54e5` |
| 203 | Fauci dell'abisso | pass | foglio intero | `e04def034895f1f5` |
| 204 | Eco del Guardiano | pass | foglio intero | `ab404cccb8c1e402` |
| 205 | Presenza Custode | pass | foglio intero | `9c5816d45d2ed359` |
| 206 | Fumo Inquieto | pass | foglio intero | `02cfb1b726e3a1e6` |
| 207 | Fiamma a 270° | pass | foglio intero | `9e15b56ac451315a` |
| 208 | Morsa Terrigena | pass | foglio intero | `4b0aea6dcff252f1` |
| 209 | Soffocaterra | pass | foglio intero | `b42c07243b02838d` |
| 210 | Battito Terrestre | pass | foglio intero | `d83f88d63897373d` |
| 211 | Zoccolata Fangosa | pass | foglio intero | `402bbd9cb035e335` |
| 212 | Scontro Colossale | pass | foglio intero | `0e0c5f7952ca11ca` |
| 213 | Movimento Continentale | pass | foglio intero | `ba1ebd1699dc453b` |
| 214 | Passo Furtivo | pass | foglio intero · versione rigenerata | `a4ad81aa888b7cc9` |
| 215 | Cucù Settete | pass | foglio intero | `14cd90b9a7288417` |
| 216 | Rugiada Mattutina | pass | foglio intero | `a85c6796b984b67a` |
| 217 | Boro Breath | pass | foglio intero | `c6a5bb0ba6eb7937` |
| 218 | Boro Breath | pass | foglio intero · versione rigenerata | `834c39d032828940` |
| 219 | Visione Musiva | pass | foglio intero | `789356e73b4e6ade` |
| 220 | Ordine Imperiale | pass | foglio intero | `53a4a60ce30dd02b` |
| 221 | Furia Ionica | pass | foglio intero | `c6e7d28aacc076c1` |
| 222 | Colpo Cibernetico | pass | foglio intero · versione rigenerata | `201214db98b5d497` |
| 223 | Scheggia Gelida | pass | foglio intero | `f9ac5e0a01910c9e` |
| 224 | Flusso Vitale | pass | foglio intero · versione rigenerata | `06bd80c328b162f7` |
| 225 | Impatto Voltaico | pass | foglio intero | `7081f8c5a72df049` |
| 226 | Calma Piatta | pass | foglio intero | `fd27f8d125e53a73` |
| 227 | Impatto Statico | pass | foglio intero | `497acabb19654983` |
| 228 | Illusione Sincronica | pass | foglio intero | `09b41397641dafbb` |
| 229 | Fuga Mentale | pass | foglio intero | `9f78420a418c6ae3` |
| 230 | Barriera elettrica | pass | foglio intero | `9059eefd3c0dde8d` |
| 231 | Tocco Risanante | pass | foglio intero | `cbcb31d7bf06c483` |
| 232 | Soffio Purificante | pass | foglio intero | `d88f7a6ef9a075dc` |
| 233 | Acqua Curativa | pass | foglio intero | `f8db305f4ddff423` |
| 234 | Ombra del Riposo | pass | foglio intero | `ded4f4b8bd9143b8` |
| 235 | Morso Ardente | pass | foglio intero | `8e6d646ca699525c` |
| 236 | Caos Psichico | pass | foglio intero | `637060f155424cb9` |
| 237 | Battito Animale | pass | foglio intero | `cf1ad113a29feeb1` |
| 238 | Rilascio Cinetico | pass | foglio intero | `82595e35ba0ea042` |
| 239 | Scioglimento Muscolare | pass | foglio intero | `a41ebdf72a853aa6` |
| 240 | Disperdi Tensione | pass | foglio intero | `44696c2345187946` |
| 241 | Abbraccio Curativo | pass | foglio intero | `b991cfcf83d949c7` |
| 242 | Papille Paralizzanti | pass | foglio intero | `3ca95d18c3cc826f` |
| 243 | Siero Corrosivo | pass | foglio intero | `f2b35893739a395f` |
| 244 | Rilascio Elettrico | pass | foglio intero · versione rigenerata | `dd4f3515e8b4f7c4` |
| 245 | Fine della Stasi | pass | foglio intero | `6ad30da8d625b766` |
| 246 | Defibrillazione | pass | foglio intero | `58ba462dce34eddb` |
| 247 | Sguardo Ipnotico | pass | foglio intero | `2bbdab71e4be79c3` |
| 248 | Iniezione Velenosa | pass | foglio intero | `36d2ae0fcc4126f8` |
| 249 | Impatto Genetico | pass | foglio intero | `5573ad1933c2b0d6` |
| 250 | Soffio della Foresta | pass | foglio intero · versione rigenerata | `c19b2a3c380642c0` |
| 251 | Sonno stellato | pass | foglio intero | `025e798e82914086` |
| 252 | Goccia Tossica | pass | foglio intero | `903bb6b0c4401a41` |
| 253 | Folgorazione | pass | foglio intero | `b12277412cca03ff` |
| 254 | Gargantua | pass | foglio intero | `d2c52d3d6f703fc8` |
| 255 | Lento Recupero | pass | foglio intero | `0c335798e25ed56e` |
| 256 | Stasi Elettrica | pass | foglio intero | `29711c46f9c1aae1` |
| 257 | Palmo del Risveglio | pass | foglio intero | `fad52c2abdcab4a1` |
| 258 | Vento del Disordine | pass | foglio intero | `c3dba4269a967dcf` |
| 259 | Barriera Psichica | pass | foglio intero | `7b8b61f334e12ff6` |
| 260 | RInnovo Neurostatico | pass | foglio intero | `02d08d843e0290d1` |
| 261 | Dono del Tempo | pass | foglio intero | `1effd33c731e1400` |
| 262 | Sospiro Fiabesco | pass | foglio intero | `d2357f8c4d1b582c` |
| 263 | Rugiada Curativa | pass | foglio intero | `903ce7340f7c8082` |
| 264 | Reset Corporeo | pass | foglio intero · versione rigenerata | `a3ac3e33f0abc577` |
| 265 | Onde Rilassanti | pass | foglio intero | `d0acee52f96adb8c` |
| 266 | Aura Velenosa | pass | foglio intero | `417042237d4b2a50` |
| 267 | Ristoro Completo | pass | foglio intero | `adcc30c2f9ff45bb` |
| 268 | Melodia Sfasata | pass | foglio intero | `0f8b6c57f696c55b` |
| 269 | Spirito della Fuoco | pass | foglio intero | `0b99a870ae0ef22b` |
| 270 | Catene rigide | pass | foglio intero | `2289332ea209e903` |
| 271 | Torpore Artico | pass | foglio intero | `c2cb24fbfb170558` |
| 272 | Linfa Ristoratrice | pass | foglio intero | `8efb076c71f826c7` |
| 273 | Comando draconico | pass | foglio intero · versione rigenerata | `b260c49f9234b3af` |
| 274 | Comando draconico | pass | foglio intero | `dc77751f014d7e5f` |
| 275 | Imposizione oculare | pass | foglio intero | `0bfa0fbff3c801f9` |
| 276 | Ordine galattico | pass | foglio intero · versione rigenerata | `ba5145bf8431cbfd` |
