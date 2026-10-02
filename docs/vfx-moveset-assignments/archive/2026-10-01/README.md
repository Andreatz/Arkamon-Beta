# VFX individuali del moveset

Fonte: Moveset.xlsx, Sheet1; ID 256 integrato dall’utente come **Stasi Elettrica**, Felvex evoluzione Oscurità (#44), status con paralisi. Data: 1 ottobre 2026.

Il catalogo comprende **276 mosse**, **142 risorse VFX distinte riservate una volta ciascuna** e **134 mosse senza VFX specifico**. Le risorse esistenti comprendono 90 sprite sheet importati, 23 GIF importate e 29 risorse base; 4 delle risorse base sono immagini statiche.

Tra le 142 associazioni: **10 calibrazioni visive confermate dall’utente**, **116 proposte da verificare** e **16 risorse da adattare**. La conferma riguarda la calibrazione dell’effetto; questa assegnazione individuale segue i colori del moveset. Le 16 risorse da adattare comprendono 6 facce di dado, 1 scritta LEVEL UP, 4 sagome/creature da adattare, 1 GIF con watermark e 4 GIF con fondali a gradiente. Sono riserve tecniche, non 16 effetti pronti.

| Colore / intensità | Mosse | VFX riservati | Da creare |
|---|---:|---:|---:|
| Verde / leggera | 76 | 38 | 38 |
| Arancione / media | 86 | 41 | 45 |
| Rosso / forte | 58 | 38 | 20 |
| Grigio / status o danno fisso | 56 | 25 | 31 |

Il minimo da aggiungere è **134 nuovi VFX**; inoltre occorre adattare le 16 risorse segnalate. Se una riserva viene scartata invece di adattata, occorre sostituirla con un ulteriore effetto distinto.

## Collegamento al gioco

- `src/data/move-vfx-assignments.json` possiede le associazioni individuali e la provenienza. Il manifest generato non viene modificato a mano.
- Il resolver applica il VFX e la calibrazione individuale prima delle vecchie associazioni condivise. Le mosse assegnate usano un solo asset, senza ricette automatiche che aggiungano effetti condivisi.
- Gli override temporanei dell’Admin mantengono la priorità. Per le mosse senza assegnazione rimane un effetto generico, chiaramente indicato nell’Admin e non contato tra i 142.
- I colori determinano l’intensità visiva e il feedback degli attacchi; danni e regole delle mosse non cambiano.
- Le 56 mosse 221–276 sono disponibili come anteprime nell’Admin, ma non vengono aggiunte al catalogo di combattimento: il foglio non contiene tutte le tabelle necessarie per implementarne le meccaniche.
- I due Boro Breath (217 e 218) e i due Comando draconico (273 e 274) restano mosse distinte.

Quattro ID sono riconciliati per nome: Sguardo glaciale **moveset 107 → gioco 109**, Ordine sovrano **108 → 110**, Vortice divino **109 → 107**, Fiamma celestiale **110 → 108**. La tabella sotto usa sempre gli ID del moveset.

## Tutte le 142 associazioni

Il [CSV completo](assegnazioni.csv) contiene anche le 134 righe senza VFX, gli ID del gioco, gli ID degli asset, gli Arkamon e le note di adattamento.

| ID moveset | Mossa | Intensità | VFX specifico | Posizione | Zoom | Valutazione |
|---:|---|---|---|---|---:|---|
| 1 | Soffio | Leggera | Thrust | Bersaglio | 1× | Proposta |
| 3 | Impatto verticale | Media | BasicEff.Img CaptainWings | Bersaglio | 1× | Proposta |
| 5 | Voltaggio | Leggera | Energy | Bersaglio | 1× | Proposta |
| 6 | Alta tensione | Media | Dmitry Sarkisov | Centro | 1× | Proposta |
| 7 | Stormo di fulmini | Forte | FieldGimmickEff.Img Thunder | Centro | 1× | Proposta |
| 8 | Nevischio | Leggera | BasicEff.Img JobChangedMukhyunFront | Bersaglio | 1× | Proposta |
| 14 | Conduttore | Leggera | Kenney Spark | Bersaglio | 1× | Proposta |
| 16 | Sprint | Leggera | MobEff.Img APCDash 0 | Bersaglio | 1× | Proposta |
| 17 | Scatto | Media | BasicEff.Img HayatoJump | Bersaglio | 1× | Proposta |
| 20 | Spruzzo | Leggera | OnUserEff.Img EventEffect WaterSmash1 | Bersaglio | 1.5× | Proposta |
| 23 | Terrore | Media | F721c5ff45edd5fb0280c4926dbf75af | Bersaglio | 1× | Proposta |
| 25 | Ultimo sangue | Forte | FieldGimmickEff.Img Tentacle | Centro | 1× | Proposta |
| 26 | Arrembaggio | Forte | Shark Kick Effect | Bersaglio | 1.25× | Proposta |
| 27 | Onda anomala | Forte | Water Torrent | Centro | 1× | Proposta |
| 28 | Zampata | Leggera | Kenney Slash | Bersaglio | 1× | Proposta |
| 29 | Colpo felpato | Media | EffectJP.Img Zipang TengouHit | Bersaglio | 1× | Proposta |
| 30 | Artigli del terrore | Media | 27c650209255d638948a6215ffea9c78 | Bersaglio | 1.25× | Calibrazione confermata |
| 31 | Abisso tenebroso | Forte | HighMountain.Img Effect Tynus Burst 0 | Bersaglio | 1× | Proposta |
| 35 | Mani brucianti | Leggera | PvPEff.Img Die PVPA12 Die | Bersaglio | 1× | Proposta |
| 36 | Palla di fuoco | Media | Fireball | Bersaglio | 1× | Proposta |
| 37 | Ardemonio | Forte | HighMountain.Img Effect Mitra Aura F 0 | Bersaglio | 1.25× | Proposta |
| 38 | Scossa | Leggera | AnglerCompany.Img SubBoss ChargedCannon Blue Hit | Bersaglio | 1.25× | Calibrazione confermata |
| 39 | Lampo | Media | Direction.Img Effect Skill Spark 0 | Bersaglio | 1.5× | Calibrazione confermata |
| 41 | Fioritura | Leggera | Shimmer | Bersaglio | 1× | Proposta |
| 43 | Controllo mentale | Leggera | AnglerCompany.Img SubBoss RailCannon Hit | Bersaglio | 1× | Proposta |
| 46 | Materia oscura | Forte | EliteMobEff.Img GrandisIndividualEliteBossEffect | Bersaglio | 1× | Proposta |
| 47 | Spazzata | Leggera | BasicEff.Img NAJump | Bersaglio | 1× | Proposta |
| 49 | Inumidire | Leggera | PvPEff.Img Die PVPA2 Die | Bersaglio | 1× | Proposta |
| 50 | Attacco fradicio | Media | Water | Bersaglio | 1× | Proposta |
| 51 | Tempesta magnetica | Forte | Electric Charge Effect | Bersaglio | 1× | Proposta |
| 52 | Temporale | Media | Thunder Effect | Bersaglio | 1× | Proposta |
| 53 | Angoscia | Media | HekatonEff 1008.Img AreaWarning | Centro | 1× | Proposta |
| 56 | Sesto senso | Media | BasicEff.Img PsychicWorkUpward | Bersaglio | 1× | Proposta |
| 57 | Intreccio mentale | Media | OnUserEff.Img JP Zipang NueHit2 | Bersaglio | 1× | Proposta |
| 58 | Occhio universale | Forte | AnglerCompany.Img LadderPuzzle Shock | Centro | 1.5× | Calibrazione confermata |
| 59 | Assorbilinfa | Leggera | Lynn.Img Skill Heal SpecialAffected | Utilizzatore | 1.25× | Proposta |
| 62 | Manto d'ombra | Leggera | DebuffEffect.Img DropBloodingCurse Start | Bersaglio | 1× | Proposta |
| 64 | Fiamma nera | Forte | PvPEff.Img Die PVPA3 Die | Bersaglio | 1× | Proposta |
| 65 | Foglia caduca | Leggera | BasicEff.Img SpiritJump | Bersaglio | 1× | Proposta |
| 66 | Risveglio verde | Media | Lynn.Img Skill Heal Effect | Utilizzatore | 1× | Proposta |
| 67 | Forza della natura | Forte | FieldGimmickEff.Img Glory E4Square1 | Centro | 1× | Proposta |
| 69 | Luna rossa | Media | OnUserEff.Img KannaQuest 0 | Bersaglio | 1× | Proposta |
| 71 | Sete di sangue | Media | Direction.Img Effect Skill Vampire 0 | Bersaglio | 1× | Proposta |
| 74 | Cerino | Leggera | HighMountain.Img Effect Mitra Aura F 2 | Bersaglio | 1.25× | Proposta |
| 75 | Cimitero di fiamme | Forte | EliteMobEff.Img 0 Effect Regen | Bersaglio | 1× | Proposta |
| 81 | Fornace | Media | BasicEff.Img CannonJump | Bersaglio | 1.25× | Proposta |
| 86 | Viaggio temporale | Media | BasicEff.Img SengokuAssembleTeleport | Bersaglio | 1× | Proposta |
| 89 | Pressione spirituale | Media | AnglerCompany.Img FinalBoss Selfharm | Bersaglio | 1× | Proposta |
| 90 | Assorbianima | Forte | DebuffEffect.Img DropBloodingCurse End | Bersaglio | 1× | Proposta |
| 93 | Morte dagli abissi | Forte | Ascend Effect | Bersaglio | 1× | Da adattare |
| 98 | Fiammella | Leggera | Fire Flames Sticker By Brannmanndan | Bersaglio | 1× | Proposta |
| 100 | Testata bassa | Leggera | BasicEff.Img CaptainJump | Bersaglio | 1× | Proposta |
| 105 | Jumpscare | Forte | HighMountain.Img TynusAttack SlaughterFail | Bersaglio | 1× | Proposta |
| 106 | Legnata | Media | BasicEff.Img PirateJump | Bersaglio | 1× | Proposta |
| 108 | Ordine sovrano | Forte | BasicEff.Img JobChangedKain | Bersaglio | 1× | Proposta |
| 109 | Vortice divino | Forte | Vortex Effect | Bersaglio | 1× | Proposta |
| 110 | Fiamma celestiale | Forte | BasicEff.Img Mitra Transform E | Bersaglio | 1× | Proposta |
| 112 | Vento Silvano | Media | BasicEff.Img GustShift | Bersaglio | 1× | Proposta |
| 113 | Maestrale Boschivo | Media | Ea2cac5105a57c00c4385321a5d36392 | Bersaglio | 1× | Proposta |
| 114 | Tempesta di Fiori | Forte | Original B289dc8f58de9dc37b042e9896d81b41 | Centro | 1× | Proposta |
| 115 | Ciuffo Verde | Leggera | BasicEff.Img AMJump | Bersaglio | 1× | Proposta |
| 116 | Mazzetto Erboso | Media | PvPEff.Img Die PVPA11 Die | Bersaglio | 1× | Proposta |
| 117 | Cespuglio Rigoglioso | Forte | BasicEff.Img JobChangedShaman | Bersaglio | 1× | Proposta |
| 118 | Penna Arcobaleno | Leggera | AnglerCompany.Img FinalBoss MiniTail Hit | Bersaglio | 1.25× | Calibrazione confermata |
| 119 | Ali Elusive | Media | HekatonEff 1001.Img Explosion | Bersaglio | 1.25× | Calibrazione confermata |
| 120 | Piumaggio Illusorio | Forte | HekatonEff 1011.Img Hit | Bersaglio | 1× | Da adattare |
| 123 | Detonazione lavica | Forte | MobEff.Img DieExplosion 1 | Bersaglio | 1× | Proposta |
| 125 | Spirale Acquatica | Media | 59ad165cefdf8a14f3b4e35ad7e8e8a8 | Bersaglio | 1.25× | Proposta |
| 126 | Polverone | Leggera | Dd83674f2aad58ba545c6007897e1e8b | Centro | 1× | Proposta |
| 127 | Marcia del deserto | Media | Tornado Effect | Bersaglio | 1× | Proposta |
| 128 | Ringhio Ribelle | Leggera | Punch | Bersaglio | 1× | Proposta |
| 129 | Colpo Rabbioso | Media | Lynn.Img Skill HitHard Hit | Bersaglio | 1× | Calibrazione confermata |
| 134 | Foglia Quantica | Media | BasicEff.Img JobChangedAdeleFront | Bersaglio | 1× | Proposta |
| 141 | Mantello di Carbone | Forte | BasicEff.Img SpecModeEndEffect | Bersaglio | 1× | Proposta |
| 143 | Ombra Rossa | Media | Dmitry Sarkisov Ssss | Centro | 1× | Da adattare |
| 144 | Piaga delle Tenebre | Forte | HighMountain.Img Effect Tynus Burst 2 | Bersaglio | 1× | Proposta |
| 145 | Lancio di Libri | Leggera | BasicEff.Img DragonJump | Bersaglio | 1× | Proposta |
| 146 | Pugno Saggio | Media | Guts Punch | Bersaglio | 1× | Proposta |
| 147 | Conoscenza Antica | Forte | BasicEff.Img RewardEffect ScreenEff | Bersaglio | 1× | Proposta |
| 148 | Salto Idroelettrico | Leggera | BasicEff.Img ViperJump | Bersaglio | 1× | Proposta |
| 150 | Idroscarica | Forte | FieldGimmickEff.Img Glory E4Square2 | Bersaglio | 1× | Proposta |
| 151 | Scatto veloce | Leggera | BasicEff.Img QuickSilver | Bersaglio | 1× | Proposta |
| 153 | Respiro profondo | Leggera | Cure | Utilizzatore | 1× | Proposta |
| 154 | Tocco di pace | Media | Cure GIF | Utilizzatore | 1× | Proposta |
| 156 | Sferzata Celata | Forte | 32efb159a574c80340a9fc81af4bf558 | Bersaglio | 1× | Proposta |
| 157 | Fendente Ombraverde | Leggera | Slash | Bersaglio | 1× | Proposta |
| 158 | Lama Sanguisuga | Media | Direction.Img Effect Skill Vampirehit 0 | Bersaglio | 1× | Proposta |
| 161 | Richiamo del Bosco | Forte | JinHillah.Img Altar Success | Bersaglio | 1× | Proposta |
| 166 | Squarcio Glaciale | Media | Flash Effect | Bersaglio | 1× | Proposta |
| 168 | Bora Eterea | Forte | BasicEff.Img JobChangedAranFront | Bersaglio | 1× | Proposta |
| 169 | Ronzio Psichico | Leggera | Psychic | Bersaglio | 1× | Proposta |
| 171 | Organizzazione Psionica | Forte | HighMountain.Img Effect FeverTime | Bersaglio | 1× | Proposta |
| 173 | Aura Incandescente | Media | HighMountain.Img Effect Mitra Aura B 2 | Bersaglio | 1× | Proposta |
| 174 | Cannone Infernale | Forte | Fire Wave | Centro | 1× | Proposta |
| 177 | Alluvione di Germogli | Forte | A1becbd5b329954a2063f352beceef35 | Bersaglio | 1× | Da adattare |
| 178 | Scintilla Lunare | Leggera | HighMountain.Img MitraFlare Create | Bersaglio | 1× | Proposta |
| 179 | Eclissi Infuocata | Media | Original Baae4227ed011e0ee13945cc78228deb | Centro | 1× | Da adattare |
| 180 | Puntura veloce | Leggera | Direction1.Img Effect Skill OverSwingDouble 0 | Bersaglio | 1× | Calibrazione confermata |
| 182 | Colpo di Liana | Leggera | BasicEff.Img TJRJump | Bersaglio | 1× | Calibrazione confermata |
| 183 | Agguato Silvestre | Media | Lynn.Img Skill SneakAttackHit | Bersaglio | 1× | Proposta |
| 184 | Ruggito fulminante | Leggera | Lightning | Bersaglio | 1× | Proposta |
| 185 | Tuono regale | Forte | HighMountain.Img Effect Tynus Lightning 2 | Bersaglio | 1.5× | Calibrazione confermata |
| 188 | Pulviscolo Ionizzate | Forte | Original 2a6067837a9439cdde80419cce37d493 | Centro | 1× | Da adattare |
| 189 | Gemma Smeraldina | Leggera | PvPEff.Img Die PVPA1 Die | Bersaglio | 1× | Proposta |
| 190 | Abbraccio Traballante | Leggera | PvPEff.Img Die PVPA10 Die | Bersaglio | 1× | Proposta |
| 191 | Surriscaldamento | Media | Dmitry Sarkisov Ezgif 3 F01075eaae7b | Centro | 1× | Da adattare |
| 192 | Scottatura | Leggera | Fire Pulse | Bersaglio | 1× | Proposta |
| 194 | Tornado di Fuoco e Sabbia | Forte | Typhoon Effect | Bersaglio | 1× | Proposta |
| 195 | Bruciatura Laser | Leggera | Fire Impact | Bersaglio | 1× | Proposta |
| 197 | Scarica Pulsar | Forte | AnglerCompany.Img SubBoss RailCannon Discharge | Bersaglio | 1× | Proposta |
| 199 | Sfolgorio Magico | Media | BasicEff.Img Kaiser Transform3 E | Bersaglio | 1× | Proposta |
| 202 | Squalo Ombra | Media | Annihilate Effect | Bersaglio | 1× | Da adattare |
| 206 | Fumo Inquieto | Leggera | Kenney Smoke | Bersaglio | 1× | Proposta |
| 207 | Fiamma a 270° | Media | BasicEff.Img MonkeyPush | Bersaglio | 1× | Proposta |
| 214 | Passo Furtivo | Media | BasicEff.Img ShadowMoveStart | Bersaglio | 1× | Proposta |
| 215 | Cucù Settete | Forte | Psychic Burst | Centro | 1× | Da adattare |
| 219 | Visione Musiva | Forte | Burst | Centro | 1× | Proposta |
| 222 | Colpo Cibernetico | Status / danno fisso | Guard Break | Bersaglio | 1× | Proposta |
| 224 | Flusso Vitale | Status / danno fisso | OnUserEff.Img AbyssExpedition Summon | Utilizzatore | 1× | Proposta |
| 225 | Impatto Voltaico | Status / danno fisso | AnglerCompany.Img SubBoss ChargedCannon Red Hit | Bersaglio | 1× | Proposta |
| 228 | Illusione Sincronica | Status / danno fisso | Confuse | Bersaglio | 1× | Proposta |
| 230 | Barriera elettrica | Status / danno fisso | AnglerCompany.Img SubBoss RailCannon Guard | Bersaglio | 1× | Proposta |
| 235 | Morso Ardente | Status / danno fisso | ChampionRaid.Img StackDebuff Flame Pre | Bersaglio | 1× | Proposta |
| 237 | Battito Animale | Status / danno fisso | BasicEff.Img ItemLevelUp | Utilizzatore | 1× | Da adattare |
| 238 | Rilascio Cinetico | Status / danno fisso | DiceMaster · faccia 2 | Utilizzatore | 1× | Da adattare |
| 239 | Scioglimento Muscolare | Status / danno fisso | DiceMaster · faccia 3 | Utilizzatore | 1× | Da adattare |
| 240 | Disperdi Tensione | Status / danno fisso | DiceMaster · faccia 4 | Utilizzatore | 1× | Da adattare |
| 241 | Abbraccio Curativo | Status / danno fisso | BasicEff.Img Wedding | Utilizzatore | 1× | Proposta |
| 243 | Siero Corrosivo | Status / danno fisso | ChampionRaid.Img StackDebuff Acid Pre | Bersaglio | 1× | Proposta |
| 244 | Rilascio Elettrico | Status / danno fisso | DiceMaster · faccia 5 | Utilizzatore | 1× | Da adattare |
| 245 | Fine della Stasi | Status / danno fisso | DiceMaster · faccia 6 | Utilizzatore | 1× | Da adattare |
| 247 | Sguardo Ipnotico | Status / danno fisso | Kenney Magic Ring | Bersaglio | 1× | Proposta |
| 252 | Goccia Tossica | Status / danno fisso | Poison | Bersaglio | 1× | Proposta |
| 256 | Stasi Elettrica | Status / danno fisso | Debuff | Bersaglio | 1× | Proposta |
| 259 | Barriera Psichica | Status / danno fisso | Barrier | Bersaglio | 1× | Proposta |
| 260 | RInnovo Neurostatico | Status / danno fisso | Buff | Utilizzatore | 1× | Proposta |
| 261 | Dono del Tempo | Status / danno fisso | DiceMaster · faccia 1 | Bersaglio | 1× | Da adattare |
| 267 | Ristoro Completo | Status / danno fisso | MobEff.Img APCRevive 0 | Utilizzatore | 1× | Proposta |
| 271 | Torpore Artico | Status / danno fisso | ChampionRaid.Img StackDebuff Frozen Pre | Bersaglio | 1× | Proposta |
| 272 | Linfa Ristoratrice | Status / danno fisso | Lynn.Img Skill Heal SpecialAffected0 | Utilizzatore | 1× | Proposta |
| 273 | Comando draconico | Status / danno fisso | Shield | Utilizzatore | 1× | Proposta |
| 275 | Imposizione oculare | Status / danno fisso | BasicEff.Img MirrorDungeonIntrude | Utilizzatore | 1× | Proposta |

## Le 134 mosse ancora senza VFX specifico

### Leggera — 38

- #11 Lapillo · Terra
- #18 Elettroscontro · Elettro
- #22 Spavento · Psico
- #32 Alito incandescente · Fuoco
- #45 Urlo straziante · Oscurità
- #54 Avanzata · Normale
- #55 Sussurro · Psico
- #68 Luna storta · Oscurità
- #70 Puntura anestetica · Erba
- #72 Predigestione · Erba
- #76 Scossa d'assestamento · Terra
- #79 Guerriglia · Normale
- #80 Fangospruzzo · Terra
- #82 Sotterrare · Terra
- #85 Area 51 · Normale
- #88 Occhiolino · Psico
- #91 Immersione · Acqua
- #94 Getto del peso · Terra
- #96 Gufata · Normale
- #111 Brezza Profumata · Erba
- #121 Bollobrace · Fuoco
- #124 Cerchio Ondoso · Acqua
- #130 Pinna Rotante · Normale
- #132 Terrore del Fienile · Terra
- #138 Dardo di Fiamma · Fuoco
- #142 Sguardo Minaccioso · Oscurità
- #155 Volo Furtivo · Normale
- #159 Leccata Fangosa · Terra
- #164 Canto del Crepuscolo · Oscurità
- #165 Tocco Ghiacciato · Acqua
- #172 Aspirafuoco · Fuoco
- #175 Spruzzata di Foglie · Acqua
- #186 Braciere Profondo · Fuoco
- #198 Polvere Ardente · Fuoco
- #201 Nuotata Inquietante · Oscurità
- #204 Eco del Guardiano · Oscurità
- #208 Morsa Terrigena · Terra
- #210 Battito Terrestre · Terra

### Media — 45

- #2 Assalto · Normale
- #9 Valanga · Acqua
- #12 Roccia fusa · Terra
- #15 Circuito chiuso · Elettro
- #19 Elettrocarica · Elettro
- #21 Alta marea · Acqua
- #24 Paradosso · Psico
- #33 Sbuffo magmatico · Fuoco
- #42 Florilegio letale · Erba
- #44 Collasso nervoso · Psico
- #48 Falcidiata · Oscurità
- #60 Avanguardia · Erba
- #63 Buio pesto · Oscurità
- #73 Divoramento · Erba
- #77 Canyon · Terra
- #83 Sepoltura · Terra
- #92 Affondare · Acqua
- #95 Bombardamento · Terra
- #97 Picchiata fatale · Normale
- #99 Spirale ardente · Fuoco
- #101 Lana magica · Normale
- #102 Funerale del deserto · Terra
- #104 Sradicamento · Erba
- #122 Fauci incandescenti · Fuoco
- #131 Danza dei Fondali · Normale
- #133 Spauracchio Contadino · Terra
- #139 Pioggia di Scintille · Fuoco
- #140 Furia Fuliggine · Fuoco
- #149 Cascata Elettrificata · Acqua
- #152 Corsa inarrestabile · Normale
- #160 Baratro Melmoso · Terra
- #162 Trappola Saltellante · Erba
- #163 Assalto Marziano · Normale
- #167 Fredda Illusione · Acqua
- #170 Sciame Mentale · Psico
- #176 Spirale Umida · Acqua
- #181 Danza del pungiglione · Normale
- #187 Fiamma Sotterranea · Fuoco
- #193 Sabbia Ardente · Fuoco
- #196 Fiamma Futuristica · Fuoco
- #205 Presenza Custode · Oscurità
- #209 Soffocaterra · Terra
- #211 Zoccolata Fangosa · Terra
- #212 Scontro Colossale · Normale
- #216 Rugiada Mattutina · Acqua

### Forte — 20

- #4 Carica ossidrica · Normale
- #10 Tormenta glaciale · Acqua
- #13 Cratere · Terra
- #34 Soffio lavico · Fuoco
- #40 Lotta tonante · Elettro
- #61 Sciame operaio · Erba
- #78 Rivolta · Oscurità
- #84 Emersione · Terra
- #87 Ritorno al futuro · Normale
- #103 Sbuffo lavico · Fuoco
- #107 Sguardo glaciale · Psico
- #135 Incendio a Staffetta · Fuoco
- #136 Maremoto Sotterraneo · Terra
- #137 Sbattimuso · Normale
- #200 Turbinio di Fuochi Fatui · Fuoco
- #203 Fauci dell'abisso · Oscurità
- #213 Movimento Continentale · Normale
- #217 Boro Breath · Normale
- #218 Boro Breath · Normale
- #220 Ordine Imperiale · Normale

### Status / danno fisso — 31

- #221 Furia Ionica · Status (Paralisi)
- #223 Scheggia Gelida · Status (Danno Fisso)
- #226 Calma Piatta · Status (Sonno)
- #227 Impatto Statico · Status (Paralisi)
- #229 Fuga Mentale · Status (Confusione)
- #231 Tocco Risanante · Status (Cura Status e Recupero Basso HP)
- #232 Soffio Purificante · Status (Cura Status e Recupero Basso HP)
- #233 Acqua Curativa · Status (Recupero Alto HP)
- #234 Ombra del Riposo · Status (Sonno)
- #236 Caos Psichico · Status (Confusione)
- #242 Papille Paralizzanti · Status (Paralisi)
- #246 Defibrillazione · Status (Cura Paralisi)
- #248 Iniezione Velenosa · Status (Veleno)
- #249 Impatto Genetico · Status (Danno Fisso)
- #250 Soffio della Foresta · Status (Recupero Alto HP)
- #251 Sonno stellato · Status (Sonno)
- #253 Folgorazione · Status (Paralisi)
- #254 Gargantua · Status (Sonno)
- #255 Lento Recupero · Status (Recupero Alto HP)
- #257 Palmo del Risveglio · Status (Cura Paralisi)
- #258 Vento del Disordine · Status (Confusione)
- #262 Sospiro Fiabesco · Status (Sonno)
- #263 Rugiada Curativa · Status (Cura Status e Recupero Basso HP)
- #264 Reset Corporeo · Status (Cura Paralisi)
- #265 Onde Rilassanti · Status (Sonno)
- #266 Aura Velenosa · Status (Veleno)
- #268 Melodia Sfasata · Status (Confusione)
- #269 Spirito della Fuoco · Status (Recupero Alto HP)
- #270 Catene rigide · Status (Paralisi)
- #274 Comando draconico · Status (Immunità da Status)
- #276 Ordine galattico · Status (Immunità da Status)

## Risorse da adattare

- #93 Morte dagli abissi → Ascend Effect: Contiene una creatura riconoscibile: rimuovere o adattare la sagoma alla mossa.
- #120 Piumaggio Illusorio → HekatonEff 1011.Img Hit: Contiene una sagoma riconoscibile nel portale: rimuoverla per ottenere un effetto psichico generico.
- #143 Ombra Rossa → Dmitry Sarkisov Ssss: La GIF contiene un fondale colorato: estrarre l’effetto prima dell’uso definitivo.
- #177 Alluvione di Germogli → A1becbd5b329954a2063f352beceef35: GIF con sfondo nero e watermark: il blend screen attenua il nero, ma occorre ripulire il watermark.
- #179 Eclissi Infuocata → Original Baae4227ed011e0ee13945cc78228deb: La GIF contiene un fondale a gradiente: isolare l’orbita luminosa.
- #188 Pulviscolo Ionizzate → Original 2a6067837a9439cdde80419cce37d493: La GIF contiene un gradiente rosso: pulire lo sfondo prima dell’uso definitivo.
- #191 Surriscaldamento → Dmitry Sarkisov Ezgif 3 F01075eaae7b: La GIF contiene un fondale a gradiente: il blend screen non rende trasparente tutto lo sfondo.
- #202 Squalo Ombra → Annihilate Effect: Contiene una creatura riconoscibile: rendere la sagoma coerente con Squalo Ombra o rimuoverla.
- #215 Cucù Settete → Psychic Burst: Mostra un volto/mostro viola: adattare la sagoma al tema di Cucù Settete.
- #237 Battito Animale → BasicEff.Img ItemLevelUp: Contiene la scritta LEVEL UP: rimuovere il testo prima di usarlo come recupero HP.
- #238 Rilascio Cinetico → DiceMaster · faccia 2: Riserva tecnica: mostra una faccia di dado. Sostituire l’icona con una rappresentazione della mossa; non pronto per la battaglia.
- #239 Scioglimento Muscolare → DiceMaster · faccia 3: Riserva tecnica: mostra una faccia di dado. Sostituire l’icona con una rappresentazione della mossa; non pronto per la battaglia.
- #240 Disperdi Tensione → DiceMaster · faccia 4: Riserva tecnica: mostra una faccia di dado. Sostituire l’icona con una rappresentazione della mossa; non pronto per la battaglia.
- #244 Rilascio Elettrico → DiceMaster · faccia 5: Riserva tecnica: mostra una faccia di dado. Sostituire l’icona con una rappresentazione della mossa; non pronto per la battaglia.
- #245 Fine della Stasi → DiceMaster · faccia 6: Riserva tecnica: mostra una faccia di dado. Sostituire l’icona con una rappresentazione della mossa; non pronto per la battaglia.
- #261 Dono del Tempo → DiceMaster · faccia 1: Riserva tecnica: mostra una faccia di dado. Sostituire l’icona con una rappresentazione della mossa; non pronto per la battaglia.

## Verifica

412 test superati, build di produzione superata. Verificate nel browser le 276 opzioni, Stasi Elettrica, la calibrazione di LadderPuzzle Shock, un ID riconciliato e la segnalazione di una mossa senza VFX. Il rapporto Excel conserva i colori, i filtri e i conteggi calcolati con formule. Il file Moveset.xlsx originale resta invariato.
