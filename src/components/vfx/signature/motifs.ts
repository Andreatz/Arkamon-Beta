// The artwork has two 4×4 panels. Names follow the rows within each panel.
export const motifs = [
  'flame', 'wave', 'bolt', 'ice', 'smoke', 'eclipse', 'eye', 'wind',
  'leaf', 'vine', 'flower', 'fault', 'feather', 'wing', 'claw', 'dart',
  'bat', 'bee', 'horn', 'fin', 'book', 'crown', 'prism', 'gear',
  'tentacle', 'paw', 'chain', 'fang', 'bell', 'drop', 'candle', 'shell',
] as const

// One main drawing per move ID. The two Boro Breath entries deliberately differ.
const moveRows = `
wind claw fault flame bolt bolt bolt ice ice ice
fault flame fault bolt gear wind dart bolt bolt wave
wave smoke eclipse eye drop fang wave paw paw claw
eclipse flame flame flame paw flame flame bolt bolt bolt
flower vine eye prism smoke eclipse claw claw drop wave
gear bolt smoke paw smoke eye chain eye vine shell
bee smoke eclipse flame leaf flower vine eclipse eclipse bee
fang drop fang candle flame fault fault paw dart drop
flame fault fault fault prism gear gear eye eye smoke
fin wave tentacle fault fault feather feather candle flame horn
prism fault flame vine eye vine wind flame eye crown
flower leaf wind flower leaf leaf vine feather wing feather
flame fang fault wave wave fault fault fang paw fin
wave smoke eye leaf flame wave paw dart bolt smoke
shell eye smoke eclipse book paw book wave wave bolt
dart wind wind flower bat claw claw claw drop fault
vine chain dart bell ice claw prism wind bee bee
eye flame flame dart leaf wave vine bolt eclipse bee
bee vine leaf bolt crown candle flame bolt prism paw
flame flame fault wind dart flame bolt flame prism candle
fin fin fang bell shell smoke flame fang fault fault
paw horn fault bat eye drop eye eclipse prism crown
bolt gear ice vine bolt wave bolt prism eye chain
flower wind wave smoke fang eye paw prism paw wind
paw tentacle drop bolt chain bolt eye bee prism leaf
eclipse drop bolt fang leaf bolt paw wind prism bolt
gear feather drop gear wave smoke flower bell flame chain
ice vine crown crown eye eclipse drop wave flame wind
ice bolt crown prism smoke flame shell dart gear chain
ice prism flower bat eclipse wind gear prism prism wave
flower paw leaf fang gear horn horn fault shell fault
fault fault shell prism prism candle eclipse smoke eye smoke
chain tentacle eye fang bell gear bolt shell leaf claw
vine bee vine leaf feather eclipse smoke horn drop smoke
smoke bee eclipse flame flame candle smoke gear prism crown
paw horn paw paw horn shell tentacle bell wave wave
drop wave wave drop wave wave wave flame dart dart
claw fault fault fault bolt flame gear crown prism flame
claw smoke fault wave wave ice ice drop smoke flame
eye prism prism prism bolt eye bolt smoke bolt gear
horn flame dart fault eclipse drop claw wave prism eclipse
candle wave flame flame smoke fault tentacle wind vine vine
claw vine shell flame fault drop fault wing feather claw
bolt bolt bolt drop smoke smoke claw smoke vine horn
paw eye eye flower paw fang wave eye prism paw
bolt fang bell vine fault drop wave book smoke wind
leaf flame dart dart dart fault bell bolt crown drop
fault bell bolt ice flower smoke claw wind feather eye
wave prism crown feather paw dart flame eye drop prism
candle smoke eye drop bolt vine bell vine chain smoke
claw smoke wind prism horn bolt bolt bell drop wave
wind tentacle gear dart prism dart
`

// The seal follows the individual form in the Arkadex, including light forms.
const formRows = `
wing horn wing crown paw horn bolt claw prism feather
wind feather fang shell horn shell gear fault fault tentacle
eye wing bolt fang horn fin fin leaf flower eclipse
eclipse paw flame bat wing bolt gear claw gear gear
gear paw claw fang eye eclipse vine leaf vine fang
horn leaf vine crown eye fin fang fin fang tentacle
bell feather wing paw feather claw vine horn tentacle fang
feather ice wing bat horn crown candle eye prism gear
prism horn eye eye drop bolt gear prism feather flower
crown fang flame horn bee bee crown vine leaf vine
horn crown fault fault feather wing horn flame prism fang
fault horn flame feather bolt wing crown prism smoke shell
claw feather gear gear paw ice flower paw claw fin
claw fin prism eye fin flower crown feather fang gear
horn horn fault shell fault shell claw shell prism prism
candle candle smoke eye eclipse tentacle eye tentacle fang bat
bat wing shell leaf vine bee bee wing feather feather
horn bat horn drop tentacle smoke feather claw flame candle
horn gear horn bee horn fang horn paw claw horn
paw fang bell vine flower drop shell wave paw fin
leaf fin gear fin feather crown
`

const nameToCell = new Map<string, number>(motifs.map((name, i) => [name, i]))
function cells(rows: string) {
  return rows.trim().split(/\s+/).map(name => {
    const cell = nameToCell.get(name)
    if (cell === undefined) throw new Error('Unknown VFX motif ' + name)
    return cell
  })
}
export const moveMotifs = cells(moveRows)
export const formMotifs = cells(formRows)

// Accent colours sampled from the corresponding front portraits, lifted for dark arenas.
export const formColors = `
d9ccf5 f5f2cc cccff5 7adef5 f5ccf2 f5ccd4 cf7af5 f57a91 e8ccf5 e8ccf5
cf7af5 cf7af5 f5bf7a f5bf7a f5bf7a f5e3cc f5917a f5917a f5bf7a 7ab0f5
f5bf7a 7ab0f5 7ab0f5 f5bf7a f59c29 ccf5de 7ab0f5 f5ed7a a1f57a 7a82f5
d9ccf5 f54f29 f54f29 d9ccf5 cccff5 f5bf7a f5bf7a f59c29 ccdef5 ccdef5
7adef5 f5bf7a f5e3cc a17af5 a17af5 a17af5 7ab0f5 7ab0f5 f54f29 f54f29
f54f29 a1f57a cff57a cff57a e8ccf5 7adef5 2982f5 29cff5 ccdef5 29cff5
7adef5 f5e3cc f5bf7a f59c29 f5294f f54f29 f5bf7a a17af5 cff57a a1f57a
ccedf5 29cff5 2982f5 f59c29 f59c29 f59c29 f59c29 f57a91 d9ccf5 ccf5de
cf7af5 ccdef5 7a82f5 7a82f5 cf7af5 7ab0f5 7ab0f5 29cff5 7ab0f5 7a82f5
cccff5 f54f29 f54f29 f54f29 cff57a a1f57a cff57a f5bf7a f5e3cc f5d4cc
f5e3cc cccff5 f5bf7a f5bf7a f5d4cc a1f57a 2982f5 f54f29 ccdef5 cf7af5
f54f29 f54f29 f54f29 f5e829 f5e829 2982f5 2982f5 2982f5 a17af5 f54f29
f54f29 ccdef5 e8f5cc f5ed7a ccdef5 ccdef5 f57abf b529f5 cf7af5 29cff5
7a82f5 2982f5 29cff5 f529e8 29cff5 29cff5 29cff5 29cff5 cccff5 f5bf7a
f5e3cc f5bf7a f5e3cc f5bf7a f5917a f5917a f5bf7a f5bf7a d9ccf5 cccff5
f5d4cc f5e3cc d9ccf5 d9ccf5 d9ccf5 2982f5 2982f5 2936f5 cf7af5 f5ed7a
f5ed7a f5e829 cff57a cff57a cff57a cff57a ccf5cf cff57a cff57a 29f582
7ab0f5 7a82f5 cccff5 cf7af5 a17af5 a17af5 cccff5 cccff5 f5294f f5294f
f59c29 f5917a f5917a f59c29 f5bf7a f5e3cc f5e3cc cff57a cff57a cff57a
f5e3cc f5e3cc f5e3cc ccdef5 ccdef5 7adef5 7adef5 7adef5 7adef5 7adef5
7af5de 7adef5 f5294f 2982f5 f59c29 f5294f
`.trim().split(/\s+/)
