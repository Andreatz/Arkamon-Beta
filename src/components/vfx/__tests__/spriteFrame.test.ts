import { describe, expect, it } from 'vitest'
import { getSpriteFramePosition } from '../AnimatedSprite'

describe('getSpriteFramePosition', () => {
  it('positions the first frame', () => {
    expect(getSpriteFramePosition(0, 5, 192, 192)).toEqual({
      col: 0,
      row: 0,
      backgroundPosition: '-0px -0px',
    })
  })

  it('positions the second frame', () => {
    expect(getSpriteFramePosition(1, 5, 192, 192)).toMatchObject({
      col: 1,
      row: 0,
      backgroundPosition: '-192px -0px',
    })
  })

  it('wraps onto the next row', () => {
    expect(getSpriteFramePosition(5, 5, 192, 192)).toMatchObject({
      col: 0,
      row: 1,
      backgroundPosition: '-0px -192px',
    })
  })

  it('positions the last frame in a 30 frame sheet', () => {
    expect(getSpriteFramePosition(29, 5, 192, 192)).toMatchObject({
      col: 4,
      row: 5,
      backgroundPosition: '-768px -960px',
    })
  })
})
