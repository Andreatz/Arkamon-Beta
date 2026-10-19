import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAdminStore } from '@/store/adminStore'
import { isCampaignWritable } from '@/session/sessionOwnership'
import { useRegiaStore } from './regiaStore'
import { usePublicPresentation } from './publicPresentation'
import { makePublicSnapshot, PUBLIC_CHANNEL } from './publicSnapshot'
import { usePublicManagement } from './publicManagementStore'

/** Local profile transport: it does not host a remote control endpoint. */
export function PublicPresentationBridge() {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(PUBLIC_CHANNEL)
    let frame = 0
    const send = () => {
      frame = 0
      if (!isCampaignWritable()) return
      channel.postMessage({ kind: 'snapshot', snapshot: makePublicSnapshot(useGameStore.getState(), useAdminStore.getState().theme,
        usePublicPresentation.getState().battle, useRegiaStore.getState().paused, Date.now(), usePublicManagement.getState().request) })
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(send) }
    const releases = [useGameStore.subscribe((state, previous) => {
      if (state.scenaCorrente.scena !== previous.scenaCorrente.scena || state.campaignRevision !== previous.campaignRevision) usePublicManagement.getState().hide()
      queue()
    }), useAdminStore.subscribe(queue), useRegiaStore.subscribe(queue), usePublicPresentation.subscribe(queue), usePublicManagement.subscribe(queue)]
    channel.onmessage = event => { if (event.data?.kind === 'hello') send() }
    const timer = window.setInterval(send, 2000)
    send()
    return () => { releases.forEach(release => release()); clearInterval(timer); cancelAnimationFrame(frame); channel.close(); usePublicManagement.getState().hide() }
  }, [])
  return null
}
