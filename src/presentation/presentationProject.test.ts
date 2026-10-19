import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { defaultAdminTheme } from '@/theme/defaultAdminTheme'
import { createDefaultDesign } from '@/ui-studio/designModel'
import { normalizePresentationProject, usePresentationProject, exportPresentationProject, importPresentationProject, capturePresentationProject } from './presentationProject'
import { AUDIO_CHOICES_KEY } from '@/components/audio/audioCuration'
import { getAppliedAudioSelection, normalizePresentationAudio, PRESENTATION_STORAGE_KEY, setAppliedAudio } from './presentationRuntime'
import { useAdminStore } from '@/store/adminStore'
import { useVfxAdminStore } from '@/store/vfxAdminStore'

const source = () => ({ version: 1, name: 'Test presentation', theme: { ...structuredClone(defaultAdminTheme), design: createDefaultDesign() }, vfx: {},
  audio: { choices: { 'event:click': { soundId: 'sample', volume: .4, cue: 'start', delayMs: 120, status: 'confirmed' } }, sounds: { sample: { src: 'audio/selected/sample.ogg' } } } })

describe('versioned presentation project', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) }, removeItem: (key: string) => data.delete(key) })
    usePresentationProject.setState({ version: 1, draft: null, applied: null, previous: null, error: null })
    useVfxAdminStore.setState({ overrides: {}, draftOverrides: {} })
    setAppliedAudio(null)
  })
  afterEach(() => { vi.unstubAllGlobals(); setAppliedAudio(null) })
  it('rejects campaign/credential properties and unsafe audio paths', () => {
    expect(() => normalizePresentationProject({ ...source(), campaign: { squad: [] } })).toThrow()
    expect(() => normalizePresentationAudio({ ...source().audio, sounds: { sample: { src: 'https://example.com/token.ogg' } } })).toThrow()
    expect(() => normalizePresentationAudio({ ...source().audio, sounds: { sample: { src: 'audio/%2e%2e/secret.ogg' } } })).toThrow()
    expect(() => normalizePresentationAudio({ ...source().audio, choices: { 'event:click': { ...source().audio.choices['event:click'], delayMs: 9000 } } })).toThrow()
  })
  it('stages without changing the applied UI/audio and persists across refresh', () => {
    const theme = JSON.stringify(useAdminStore.getState().theme)
    expect(usePresentationProject.getState().stage(normalizePresentationProject(source()))).toBe(true)
    expect(JSON.stringify(useAdminStore.getState().theme)).toBe(theme)
    expect(getAppliedAudioSelection('event:click')).toBeUndefined()
    expect(JSON.parse(localStorage.getItem(PRESENTATION_STORAGE_KEY)!).draft.name).toBe('Test presentation')
  })
  it('applies the complete project, provides a restore point and leaves campaign keys untouched', () => {
    localStorage.setItem('arkamon-save', 'CAMPAIGN-UNCHANGED')
    const original = useAdminStore.getState().theme.colors.primary
    const project = source(); project.theme.colors.primary = '#123456'
    usePresentationProject.getState().stage(normalizePresentationProject(project))
    expect(usePresentationProject.getState().apply()).toBe(true)
    expect(useAdminStore.getState().theme.colors.primary).toBe('#123456')
    expect(getAppliedAudioSelection('event:click')?.choice.delayMs).toBe(120)
    expect(usePresentationProject.getState().rollback()).toBe(true)
    expect(useAdminStore.getState().theme.colors.primary).toBe(original)
    expect(localStorage.getItem('arkamon-save')).toBe('CAMPAIGN-UNCHANGED')
  })
  it('retains the applied design if draft persistence is unavailable', () => {
    const old = useAdminStore.getState().theme
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
    expect(usePresentationProject.getState().stage(normalizePresentationProject(source()))).toBe(false)
    expect(usePresentationProject.getState().draft).toBeNull()
    expect(useAdminStore.getState().theme).toBe(old)
  })
  it('round trips a complete package through the existing UI media validator', async () => {
    const project = normalizePresentationProject(source())
    const text = await exportPresentationProject(project)
    expect(await importPresentationProject(text)).toEqual(project)
    expect(JSON.parse(text).format).toBe('arkamon-presentation')
  })
  it('keeps applied custom audio while capturing an unrelated Audio Lab draft', async () => {
    const applied = normalizePresentationProject(source())
    usePresentationProject.setState({ applied })
    const local = { 'move:1': { soundId: 'draft-sound', volume: .7, cue: 'impact', delayMs: 10, status: 'confirmed' } }
    localStorage.setItem(AUDIO_CHOICES_KEY, JSON.stringify({ version: 1, choices: local }))
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ files: [{ id: 'draft-sound', src: 'audio-lab/draft.ogg' }] }) })))
    const captured = await capturePresentationProject('Merged audio')
    expect(captured.audio.choices['event:click']).toEqual(applied.audio.choices['event:click'])
    expect(captured.audio.sounds.sample).toEqual(applied.audio.sounds.sample)
    expect(captured.audio.choices['move:1']).toEqual(local['move:1'])
  })
  it('restores theme, VFX draft and history if a later apply step cannot persist', () => {
    const theme = structuredClone(useAdminStore.getState().theme)
    usePresentationProject.getState().stage(normalizePresentationProject(source()))
    const before = localStorage.getItem(PRESENTATION_STORAGE_KEY)
    const replace = vi.spyOn(useVfxAdminStore.getState(), 'replaceOverrides').mockReturnValue(false)
    expect(usePresentationProject.getState().apply()).toBe(false)
    expect(useAdminStore.getState().theme).toEqual(theme)
    expect(usePresentationProject.getState().draft?.name).toBe('Test presentation')
    expect(localStorage.getItem(PRESENTATION_STORAGE_KEY)).toBe(before)
    expect(getAppliedAudioSelection('event:click')).toBeUndefined()
    replace.mockRestore()
  })
})
