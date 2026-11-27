import type { MoveSequence } from './sequence'

type Point = { x: number; y: number }
const tau = 2 * Math.PI
const clamp = (n: number) => Math.max(0, Math.min(1, n))

// Coordinates use the caller's canvas units; game and viewer draw the same frame.
export function drawSequence(ctx: CanvasRenderingContext2D, atlas: CanvasImageSource, s: MoveSequence,
  elapsed: number, from: Point, to: Point, radius: number) {
  if (elapsed <= 0 || elapsed >= s.duration) return
  const charge = clamp(elapsed / s.impact)
  const release = clamp((elapsed - s.impact) / (s.duration - s.impact))
  const power = Math.sin(charge * Math.PI / 2) * (1 - release) ** 1.5
  const time = elapsed / s.duration
  const dx = to.x - from.x, dy = to.y - from.y
  const angle = Math.atan2(dy, dx)
  const facing = dx < 0 ? -1 : 1
  ctx.save()
  ctx.translate(to.x, to.y)
  ctx.scale(radius, radius)
  const ox = -dx / radius, oy = -dy / radius

  function stamp(cell: number, x: number, y: number, size: number, rotation = 0, opacity = 1) {
    if (size <= 0 || opacity <= 0) return
    const panel = Math.floor(cell / 16), col = panel * 4 + cell % 4, row = Math.floor(cell % 16 / 4)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.globalAlpha = clamp(opacity)
    ctx.drawImage(atlas, col * 192, row * 192, 192, 192, -size / 2, -size / 2, size, size)
    ctx.restore()
  }
  function stroke(points: Point[], color: string, width: number, opacity: number) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.globalAlpha = clamp(opacity)
    ctx.stroke()
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const flight = s.motion === 'ray' || s.motion === 'lance'
  const advance = charge ** 1.65
  if (flight) {
    const head = { x: ox * (1 - advance), y: oy * (1 - advance) }
    const tail = s.motion === 'ray' ? 0 : Math.max(0, advance - .32)
    const origin = { x: ox * (1 - tail), y: oy * (1 - tail) }
    const ribbon: Point[] = []
    for (let i = 0; i <= 18; i++) {
      const u = i / 18, ripple = Math.sin(u * tau * 2 + time * 18 + s.phase) * Math.sin(Math.PI * u) * power * .07
      ribbon.push({ x: origin.x + (head.x - origin.x) * u - Math.sin(angle) * ripple,
        y: origin.y + (head.y - origin.y) * u + Math.cos(angle) * ripple })
    }
    stroke(ribbon, s.accent, .15 * power + .015, power * .55)
    stroke(ribbon, s.color, .055, power)
    stroke(ribbon, '#fff', .016, power)
    stamp(s.motif, head.x, head.y, .48 + .56 * power, angle, power)
  }

  if (s.motion === 'cage') {
    for (let i = 0; i < s.spokes; i++) {
      const a = i * tau / s.spokes + s.phase, b = a + tau / s.spokes
      const r = 1.15 - charge * .55 + release * .35
      const points: Point[] = []
      for (let j = 0; j < 7; j++) {
        const u = j / 6, k = r + (j % 2 ? .11 * Math.sin(elapsed / 60 + i) : 0)
        points.push({ x: Math.cos(a + (b-a)*u)*k, y: Math.sin(a + (b-a)*u)*k })
      }
      stroke(points, s.color, .065, power)
      stroke(points, '#fff4b7', .019, power)
    }
  }

  const count = s.spokes
  for (let i = 0; i < count; i++) {
    const u = i / count, a = s.phase + u * tau
    let x: number, y: number, turn = a, size = .28 + .13 * (i % 3), opacity = power
    const sweep = a + s.spin * (charge * 1.65 + release * 1.2)
    const scatter = .25 + release * (1.1 + (i % 3) * .16)
    switch (s.motion) {
      case 'shower': {
        const drop = clamp((charge * 1.5 - .48 * u))
        x = (u - .5) * 1.65 + facing * (1-drop) * .8
        y = -(1-drop) * (1.45 + u*.6) + release * .75
        turn = 2.15 * facing
        break
      }
      case 'orbit': {
        const r = .34 + (1-charge)*.7 + release*.8
        x = Math.cos(sweep + time * s.spin * 3) * r
        y = Math.sin(sweep + time * s.spin * 3) * r * .72
        turn = sweep
        break
      }
      case 'strike': {
        const cut = clamp(charge * 1.6 - u * .54)
        x = facing * ((cut - .5)*1.3 + (u-.5)*.57)
        y = (u-.5)*.92 - cut*.32 + release*.45
        turn = -.68*facing
        size *= 1.35
        break
      }
      case 'rift': {
        x = (u-.5)*2.05
        y = .25 - Math.sin(charge*Math.PI/2)*(.2 + Math.sin(u*Math.PI)*.7) + release*.7
        turn = (u-.5)*1.25
        stroke([{x:0,y:.4},{x:x*.48,y:.31 + .14*(i%2)},{x,y:y+.27}],s.accent,.025,power)
        break
      }
      case 'tide': {
        x = facing * ((u-.5)*1.65 + (charge-1)*.95)
        y = Math.sin(u*5 + time*6) * .28 + release * .4
        turn = Math.cos(u*5 + time*6)*.6
        break
      }
      default: {
        const r = scatter + (1-charge)*.74
        x = Math.cos(sweep)*r
        y = Math.sin(sweep)*r
        turn = sweep + Math.PI/2
        if (flight) opacity *= charge ** 3
      }
    }
    stamp(i % 3 === 0 ? s.seal : s.motif, x, y, size*(.62+.45*power), turn, opacity*.86)
  }

  // The central crest peaks at the registered impact. Embers expand as it fades.
  const core = flight ? power * charge ** 3 : power
  const glow = ctx.createRadialGradient(0,0,0,0,0,.84)
  glow.addColorStop(0, s.accent)
  glow.addColorStop(1, 'transparent')
  ctx.globalAlpha = core*.65
  ctx.fillStyle = glow
  ctx.fillRect(-.84,-.84,1.68,1.68)
  ctx.globalAlpha = 1
  stamp(s.seal, -.16*facing, .05, .44 + .86*core, -.16*s.spin + .32*time*s.spin, core)
  stamp(s.motif, .16*facing, -.07, .36 + .82*core, .13*Math.sin(time*4+s.phase), core)
  for (let i=0; i<count*2; i++) {
    const a = s.phase + i*tau/(count*2), r = .24 + release*(1 + i%4*.18)
    const tip = r + .045 + release*.12
    stroke([{x:Math.cos(a)*r,y:Math.sin(a)*r},{x:Math.cos(a)*tip,y:Math.sin(a)*tip}],
      i%2 ? s.accent : '#fff', .021, (1-release)**2 * clamp(release*14))
  }
  ctx.restore()
}
