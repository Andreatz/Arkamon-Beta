# Copertura per file della revisione di codice Arkamon

> Archivio del 20 ottobre 2026: **Inventario della revisione iniziale**. Origine nella cartella della sessione: `outputs/Copertura-Revisione-Codice.md`. I rilievi e i conteggi descrivono quella fase; leggere [stato e provenienza](./README.md) per gli interventi successivi. I link al codice puntano ai file correnti; i numeri di riga sono quelli rilevati durante l'audit.


Commit `ea4dcab344cf4030757b4c9bb00f4890b4421be4`. Copertura di questo agente, non unione con il lavoro degli altri agenti. Nessuna esecuzione di test o build implicita.

I 488 file di `src` sono elencati; 69 letti integralmente, 13 parzialmente e 406 soltanto censiti. I cataloghi JSON sono stati analizzati automaticamente, senza attribuire a quel passaggio una lettura umana completa. Le righe fisiche includono commenti e righe vuote.

| Categoria | Integrali | Parziali | Censiti |
|---|---:|---:|---:|
| application-code | 64 | 8 | 205 |
| asset-or-tool | 0 | 0 | 3 |
| data-catalog | 0 | 0 | 16 |
| generated-catalog | 0 | 0 | 2 |
| stylesheet | 0 | 0 | 28 |
| test | 5 | 5 | 145 |
| test-support-or-fixture | 0 | 0 | 7 |

## application-code

| File | Stato | Righe fisiche | Ambito |
|---|---|---:|---|
| [src/admin/AdminAssetEditor.tsx](../../src/admin/AdminAssetEditor.tsx) | Soltanto censito | 144 |  |
| [src/admin/AdminColorEditor.tsx](../../src/admin/AdminColorEditor.tsx) | Soltanto censito | 76 |  |
| [src/admin/AdminImportExport.tsx](../../src/admin/AdminImportExport.tsx) | Soltanto censito | 105 |  |
| [src/admin/AdminLayoutEditor.tsx](../../src/admin/AdminLayoutEditor.tsx) | Soltanto censito | 111 |  |
| [src/admin/AdminLayoutItem.tsx](../../src/admin/AdminLayoutItem.tsx) | Soltanto censito | 297 |  |
| [src/admin/AdminOverlay.tsx](../../src/admin/AdminOverlay.tsx) | Letto integralmente | 35 |  |
| [src/admin/AdminPanel.tsx](../../src/admin/AdminPanel.tsx) | Soltanto censito | 114 |  |
| [src/admin/adminPointerDrag.ts](../../src/admin/adminPointerDrag.ts) | Soltanto censito | 23 |  |
| [src/admin/AdminPresetEditor.tsx](../../src/admin/AdminPresetEditor.tsx) | Soltanto censito | 58 |  |
| [src/admin/AdminRuntime.tsx](../../src/admin/AdminRuntime.tsx) | Soltanto censito | 13 |  |
| [src/admin/AdminSpriteScaleEditor.tsx](../../src/admin/AdminSpriteScaleEditor.tsx) | Soltanto censito | 83 |  |
| [src/admin/AdminUiEditor.tsx](../../src/admin/AdminUiEditor.tsx) | Soltanto censito | 104 |  |
| [src/admin/AdminVfxEditor.tsx](../../src/admin/AdminVfxEditor.tsx) | Soltanto censito | 370 |  |
| [src/admin/useAdminHotkey.ts](../../src/admin/useAdminHotkey.ts) | Soltanto censito | 69 |  |
| [src/App.tsx](../../src/App.tsx) | Letto integralmente | 152 |  |
| [src/arkadex/arkadexModel.ts](../../src/arkadex/arkadexModel.ts) | Lettura parziale | 107 | 1-95; derivazione scoperte per conferma idempotenza del checkpoint |
| [src/arkadex/ArkadexPanel.tsx](../../src/arkadex/ArkadexPanel.tsx) | Soltanto censito | 94 |  |
| [src/audience/AdminAudiencePanel.tsx](../../src/audience/AdminAudiencePanel.tsx) | Letto integralmente | 139 |  |
| [src/audience/audienceApi.ts](../../src/audience/audienceApi.ts) | Letto integralmente | 216 |  |
| [src/audience/AudienceQrCode.tsx](../../src/audience/AudienceQrCode.tsx) | Soltanto censito | 24 |  |
| [src/audience/audienceTurnController.ts](../../src/audience/audienceTurnController.ts) | Letto integralmente | 169 |  |
| [src/audience/types.ts](../../src/audience/types.ts) | Letto integralmente | 71 |  |
| [src/audience/useAudienceStore.ts](../../src/audience/useAudienceStore.ts) | Letto integralmente | 177 |  |
| [src/audience/useAudienceTurn.ts](../../src/audience/useAudienceTurn.ts) | Letto integralmente | 52 |  |
| [src/challenges/ChallengeBanner.tsx](../../src/challenges/ChallengeBanner.tsx) | Soltanto censito | 37 |  |
| [src/challenges/ChallengePanel.tsx](../../src/challenges/ChallengePanel.tsx) | Soltanto censito | 137 |  |
| [src/challenges/challengePersistence.ts](../../src/challenges/challengePersistence.ts) | Letto integralmente | 61 |  |
| [src/challenges/challengeRules.ts](../../src/challenges/challengeRules.ts) | Letto integralmente | 146 |  |
| [src/challenges/challengeRuntime.ts](../../src/challenges/challengeRuntime.ts) | Letto integralmente | 65 |  |
| [src/challenges/challengeStore.ts](../../src/challenges/challengeStore.ts) | Letto integralmente | 149 |  |
| [src/challenges/seededRandom.ts](../../src/challenges/seededRandom.ts) | Letto integralmente | 51 |  |
| [src/challenges/types.ts](../../src/challenges/types.ts) | Letto integralmente | 47 |  |
| [src/components/arkamon/arkamonAnimationManifest.ts](../../src/components/arkamon/arkamonAnimationManifest.ts) | Soltanto censito | 198 |  |
| [src/components/arkamon/ArkamonAttackPreview.tsx](../../src/components/arkamon/ArkamonAttackPreview.tsx) | Soltanto censito | 330 |  |
| [src/components/arkamon/ArkamonBattleSprite.tsx](../../src/components/arkamon/ArkamonBattleSprite.tsx) | Soltanto censito | 506 |  |
| [src/components/arkamon/arkamonMotionProfiles.ts](../../src/components/arkamon/arkamonMotionProfiles.ts) | Soltanto censito | 92 |  |
| [src/components/arkamon/DarklawAnimationLab.tsx](../../src/components/arkamon/DarklawAnimationLab.tsx) | Soltanto censito | 241 |  |
| [src/components/arkamon/nativeRuntimePages.ts](../../src/components/arkamon/nativeRuntimePages.ts) | Soltanto censito | 30 |  |
| [src/components/arkamon/preloadArkamonAnimations.ts](../../src/components/arkamon/preloadArkamonAnimations.ts) | Soltanto censito | 15 |  |
| [src/components/audio/audioCuration.ts](../../src/components/audio/audioCuration.ts) | Soltanto censito | 69 |  |
| [src/components/audio/AudioLab.tsx](../../src/components/audio/AudioLab.tsx) | Soltanto censito | 224 |  |
| [src/components/audio/audioWorkspaceModel.ts](../../src/components/audio/audioWorkspaceModel.ts) | Soltanto censito | 16 |  |
| [src/components/AudioController.tsx](../../src/components/AudioController.tsx) | Soltanto censito | 78 |  |
| [src/components/battle/audienceBattle.ts](../../src/components/battle/audienceBattle.ts) | Soltanto censito | 58 |  |
| [src/components/battle/BattleArchivePanel.tsx](../../src/components/battle/BattleArchivePanel.tsx) | Soltanto censito | 24 |  |
| [src/components/battle/battleArchiveStore.ts](../../src/components/battle/battleArchiveStore.ts) | Letto integralmente | 111 |  |
| [src/components/battle/BattleAudienceOverlay.tsx](../../src/components/battle/BattleAudienceOverlay.tsx) | Soltanto censito | 74 |  |
| [src/components/battle/battleCheckpoint.ts](../../src/components/battle/battleCheckpoint.ts) | Letto integralmente | 113 |  |
| [src/components/battle/battleChronicle.ts](../../src/components/battle/battleChronicle.ts) | Letto integralmente | 137 |  |
| [src/components/battle/battleDiceAssets.ts](../../src/components/battle/battleDiceAssets.ts) | Soltanto censito | 58 |  |
| [src/components/battle/BattleDiceLab.tsx](../../src/components/battle/BattleDiceLab.tsx) | Soltanto censito | 158 |  |
| [src/components/battle/battleDiceReveal.ts](../../src/components/battle/battleDiceReveal.ts) | Soltanto censito | 50 |  |
| [src/components/battle/BattleLogPanel.tsx](../../src/components/battle/BattleLogPanel.tsx) | Soltanto censito | 77 |  |
| [src/components/battle/battleMoveFacts.ts](../../src/components/battle/battleMoveFacts.ts) | Letto integralmente | 19 |  |
| [src/components/battle/BattleOpeningOverlay.tsx](../../src/components/battle/BattleOpeningOverlay.tsx) | Soltanto censito | 76 |  |
| [src/components/battle/battleOutcomeSummary.ts](../../src/components/battle/battleOutcomeSummary.ts) | Soltanto censito | 16 |  |
| [src/components/battle/BattlePresentation.tsx](../../src/components/battle/BattlePresentation.tsx) | Soltanto censito | 649 |  |
| [src/components/battle/BattleResultCard.tsx](../../src/components/battle/BattleResultCard.tsx) | Soltanto censito | 20 |  |
| [src/components/battle/battleRoundOrder.ts](../../src/components/battle/battleRoundOrder.ts) | Soltanto censito | 10 |  |
| [src/components/battle/BattleRulesLab.tsx](../../src/components/battle/BattleRulesLab.tsx) | Soltanto censito | 78 |  |
| [src/components/battle/battleVisualSequence.ts](../../src/components/battle/battleVisualSequence.ts) | Soltanto censito | 183 |  |
| [src/components/battle/DiceRollOverlay.tsx](../../src/components/battle/DiceRollOverlay.tsx) | Soltanto censito | 171 |  |
| [src/components/battle/modalFocus.ts](../../src/components/battle/modalFocus.ts) | Soltanto censito | 22 |  |
| [src/components/battle/StatusToken.tsx](../../src/components/battle/StatusToken.tsx) | Soltanto censito | 70 |  |
| [src/components/battle/SupremeMoveDialog.tsx](../../src/components/battle/SupremeMoveDialog.tsx) | Soltanto censito | 139 |  |
| [src/components/battle/useBattleAssetReadiness.ts](../../src/components/battle/useBattleAssetReadiness.ts) | Soltanto censito | 53 |  |
| [src/components/battle/useBattleChronicle.ts](../../src/components/battle/useBattleChronicle.ts) | Soltanto censito | 20 |  |
| [src/components/battle/useSettledBattleCheckpoint.ts](../../src/components/battle/useSettledBattleCheckpoint.ts) | Soltanto censito | 48 |  |
| [src/components/deposit/DepositLab.tsx](../../src/components/deposit/DepositLab.tsx) | Soltanto censito | 76 |  |
| [src/components/deposit/depositPortraitFraming.ts](../../src/components/deposit/depositPortraitFraming.ts) | Soltanto censito | 126 |  |
| [src/components/deposit/DepositView.tsx](../../src/components/deposit/DepositView.tsx) | Soltanto censito | 174 |  |
| [src/components/map/LocalMapBoard.tsx](../../src/components/map/LocalMapBoard.tsx) | Soltanto censito | 293 |  |
| [src/components/map/MainMapAvatar.tsx](../../src/components/map/MainMapAvatar.tsx) | Soltanto censito | 64 |  |
| [src/components/map/mapJourney.ts](../../src/components/map/mapJourney.ts) | Soltanto censito | 28 |  |
| [src/components/map/worldMapHudLayout.ts](../../src/components/map/worldMapHudLayout.ts) | Soltanto censito | 17 |  |
| [src/components/MoveVfx.tsx](../../src/components/MoveVfx.tsx) | Soltanto censito | 37 |  |
| [src/components/rpg/index.tsx](../../src/components/rpg/index.tsx) | Soltanto censito | 27 |  |
| [src/components/rpg/RpgCommand.tsx](../../src/components/rpg/RpgCommand.tsx) | Soltanto censito | 1 |  |
| [src/components/rpg/RpgWindow.tsx](../../src/components/rpg/RpgWindow.tsx) | Soltanto censito | 1 |  |
| [src/components/rpg/SpatialNavigation.tsx](../../src/components/rpg/SpatialNavigation.tsx) | Soltanto censito | 38 |  |
| [src/components/transitions/ArkamonDiceArtwork.tsx](../../src/components/transitions/ArkamonDiceArtwork.tsx) | Soltanto censito | 69 |  |
| [src/components/transitions/SceneNavigationContext.ts](../../src/components/transitions/SceneNavigationContext.ts) | Soltanto censito | 20 |  |
| [src/components/transitions/SceneTransition.tsx](../../src/components/transitions/SceneTransition.tsx) | Lettura parziale | 112 | 1-55; produttore busy |
| [src/components/transitions/SceneTransitionLab.tsx](../../src/components/transitions/SceneTransitionLab.tsx) | Soltanto censito | 136 |  |
| [src/components/transitions/SceneTransitionOverlay.tsx](../../src/components/transitions/SceneTransitionOverlay.tsx) | Soltanto censito | 131 |  |
| [src/components/transitions/sceneTransitionProfiles.ts](../../src/components/transitions/sceneTransitionProfiles.ts) | Soltanto censito | 67 |  |
| [src/components/transitions/sceneTransitionState.ts](../../src/components/transitions/sceneTransitionState.ts) | Soltanto censito | 87 |  |
| [src/components/ui/AppErrorBoundary.tsx](../../src/components/ui/AppErrorBoundary.tsx) | Soltanto censito | 28 |  |
| [src/components/ui/DialogNavigation.ts](../../src/components/ui/DialogNavigation.ts) | Soltanto censito | 5 |  |
| [src/components/ui/GameButton.tsx](../../src/components/ui/GameButton.tsx) | Soltanto censito | 22 |  |
| [src/components/ui/GameDialog.tsx](../../src/components/ui/GameDialog.tsx) | Soltanto censito | 42 |  |
| [src/components/vfx/AnimatedSprite.tsx](../../src/components/vfx/AnimatedSprite.tsx) | Soltanto censito | 517 |  |
| [src/components/vfx/battleVfxPosition.ts](../../src/components/vfx/battleVfxPosition.ts) | Soltanto censito | 66 |  |
| [src/components/vfx/CompositeMoveVfx.tsx](../../src/components/vfx/CompositeMoveVfx.tsx) | Soltanto censito | 84 |  |
| [src/components/vfx/FallbackVfx.tsx](../../src/components/vfx/FallbackVfx.tsx) | Soltanto censito | 23 |  |
| [src/components/vfx/GifVfx.tsx](../../src/components/vfx/GifVfx.tsx) | Soltanto censito | 70 |  |
| [src/components/vfx/moveVfxAssignments.ts](../../src/components/vfx/moveVfxAssignments.ts) | Soltanto censito | 63 |  |
| [src/components/vfx/MoveVfxLayer.tsx](../../src/components/vfx/MoveVfxLayer.tsx) | Soltanto censito | 204 |  |
| [src/components/vfx/moveVfxOverrides.ts](../../src/components/vfx/moveVfxOverrides.ts) | Soltanto censito | 26 |  |
| [src/components/vfx/moveVfxProfiles.ts](../../src/components/vfx/moveVfxProfiles.ts) | Soltanto censito | 258 |  |
| [src/components/vfx/PagedAnimatedSprite.tsx](../../src/components/vfx/PagedAnimatedSprite.tsx) | Soltanto censito | 188 |  |
| [src/components/vfx/preloadVfxAssets.ts](../../src/components/vfx/preloadVfxAssets.ts) | Soltanto censito | 70 |  |
| [src/components/vfx/resolveMoveVfxAsset.ts](../../src/components/vfx/resolveMoveVfxAsset.ts) | Soltanto censito | 86 |  |
| [src/components/vfx/SpriteMoveVfx.tsx](../../src/components/vfx/SpriteMoveVfx.tsx) | Soltanto censito | 100 |  |
| [src/components/vfx/spritePages.ts](../../src/components/vfx/spritePages.ts) | Soltanto censito | 31 |  |
| [src/components/vfx/types.ts](../../src/components/vfx/types.ts) | Soltanto censito | 117 |  |
| [src/components/vfx/useVfxPlaybackPreferences.ts](../../src/components/vfx/useVfxPlaybackPreferences.ts) | Soltanto censito | 12 |  |
| [src/components/vfx/vfxCuration.ts](../../src/components/vfx/vfxCuration.ts) | Soltanto censito | 357 |  |
| [src/components/vfx/VfxGallery.tsx](../../src/components/vfx/VfxGallery.tsx) | Soltanto censito | 184 |  |
| [src/components/vfx/vfxManifest.ts](../../src/components/vfx/vfxManifest.ts) | Soltanto censito | 319 |  |
| [src/components/vfx/vfxPresentationOverrides.ts](../../src/components/vfx/vfxPresentationOverrides.ts) | Soltanto censito | 15 |  |
| [src/components/vfx/VfxPreviewPanel.tsx](../../src/components/vfx/VfxPreviewPanel.tsx) | Soltanto censito | 81 |  |
| [src/components/vfx/vfxRecipes.ts](../../src/components/vfx/vfxRecipes.ts) | Soltanto censito | 392 |  |
| [src/data/backgrounds.ts](../../src/data/backgrounds.ts) | Soltanto censito | 59 |  |
| [src/data/bilanciamento.ts](../../src/data/bilanciamento.ts) | Soltanto censito | 129 |  |
| [src/data/index.ts](../../src/data/index.ts) | Letto integralmente | 121 |  |
| [src/data/localMaps/Cagliari.ts](../../src/data/localMaps/Cagliari.ts) | Soltanto censito | 96 |  |
| [src/data/localMaps/Foggia.ts](../../src/data/localMaps/Foggia.ts) | Soltanto censito | 147 |  |
| [src/data/localMaps/Milano.ts](../../src/data/localMaps/Milano.ts) | Soltanto censito | 136 |  |
| [src/data/localMaps/Napoli.ts](../../src/data/localMaps/Napoli.ts) | Soltanto censito | 95 |  |
| [src/data/localMaps/Palermo.ts](../../src/data/localMaps/Palermo.ts) | Soltanto censito | 128 |  |
| [src/data/localMaps/Percorso_1.ts](../../src/data/localMaps/Percorso_1.ts) | Soltanto censito | 124 |  |
| [src/data/localMaps/Percorso_13.ts](../../src/data/localMaps/Percorso_13.ts) | Soltanto censito | 95 |  |
| [src/data/localMaps/Percorso_14.ts](../../src/data/localMaps/Percorso_14.ts) | Soltanto censito | 118 |  |
| [src/data/localMaps/Percorso_15.ts](../../src/data/localMaps/Percorso_15.ts) | Soltanto censito | 87 |  |
| [src/data/localMaps/Percorso_2.ts](../../src/data/localMaps/Percorso_2.ts) | Soltanto censito | 112 |  |
| [src/data/localMaps/Percorso_4.ts](../../src/data/localMaps/Percorso_4.ts) | Soltanto censito | 110 |  |
| [src/data/localMaps/Piacenza.ts](../../src/data/localMaps/Piacenza.ts) | Soltanto censito | 134 |  |
| [src/data/localMaps/ReggioCalabria.ts](../../src/data/localMaps/ReggioCalabria.ts) | Soltanto censito | 116 |  |
| [src/data/localMaps/Roma.ts](../../src/data/localMaps/Roma.ts) | Soltanto censito | 118 |  |
| [src/data/localMaps/Torino.ts](../../src/data/localMaps/Torino.ts) | Soltanto censito | 123 |  |
| [src/data/localMaps/types.ts](../../src/data/localMaps/types.ts) | Soltanto censito | 12 |  |
| [src/data/localMaps/Venezia.ts](../../src/data/localMaps/Venezia.ts) | Soltanto censito | 132 |  |
| [src/data/localMaps.ts](../../src/data/localMaps.ts) | Letto integralmente | 42 |  |
| [src/data/mainMapRoads.ts](../../src/data/mainMapRoads.ts) | Soltanto censito | 50 |  |
| [src/data/mappe-griglia/_helpers.ts](../../src/data/mappe-griglia/_helpers.ts) | Soltanto censito | 25 |  |
| [src/data/mappe-griglia/index.ts](../../src/data/mappe-griglia/index.ts) | Soltanto censito | 43 |  |
| [src/data/mappe-griglia/mappa-principale.ts](../../src/data/mappe-griglia/mappa-principale.ts) | Soltanto censito | 57 |  |
| [src/data/mappe-griglia/Milano.ts](../../src/data/mappe-griglia/Milano.ts) | Soltanto censito | 33 |  |
| [src/data/mappe-griglia/Percorso_1.ts](../../src/data/mappe-griglia/Percorso_1.ts) | Soltanto censito | 33 |  |
| [src/data/mappe-griglia/Percorso_2.ts](../../src/data/mappe-griglia/Percorso_2.ts) | Soltanto censito | 30 |  |
| [src/data/mappe-griglia/Percorso_3.ts](../../src/data/mappe-griglia/Percorso_3.ts) | Soltanto censito | 30 |  |
| [src/data/mappe-griglia/Piacenza.ts](../../src/data/mappe-griglia/Piacenza.ts) | Soltanto censito | 32 |  |
| [src/data/mappe-griglia/Pordenone.ts](../../src/data/mappe-griglia/Pordenone.ts) | Soltanto censito | 21 |  |
| [src/data/mappe-griglia/restanti.ts](../../src/data/mappe-griglia/restanti.ts) | Soltanto censito | 301 |  |
| [src/data/mappe-griglia/Venezia.ts](../../src/data/mappe-griglia/Venezia.ts) | Soltanto censito | 33 |  |
| [src/data/secretLocation.ts](../../src/data/secretLocation.ts) | Soltanto censito | 32 |  |
| [src/data/statusMoves.ts](../../src/data/statusMoves.ts) | Letto integralmente | 34 |  |
| [src/engine/battleEngine.ts](../../src/engine/battleEngine.ts) | Letto integralmente | 719 |  |
| [src/engine/battleResolution.ts](../../src/engine/battleResolution.ts) | Letto integralmente | 30 |  |
| [src/engine/deposito.ts](../../src/engine/deposito.ts) | Letto integralmente | 136 |  |
| [src/engine/encounters.ts](../../src/engine/encounters.ts) | Letto integralmente | 58 |  |
| [src/engine/localMapMovement.ts](../../src/engine/localMapMovement.ts) | Letto integralmente | 38 |  |
| [src/engine/movimento.ts](../../src/engine/movimento.ts) | Letto integralmente | 197 |  |
| [src/engine/pokemonFactory.ts](../../src/engine/pokemonFactory.ts) | Letto integralmente | 22 |  |
| [src/engine/pokemonOwnership.ts](../../src/engine/pokemonOwnership.ts) | Letto integralmente | 12 |  |
| [src/engine/teamLevelCap.ts](../../src/engine/teamLevelCap.ts) | Letto integralmente | 24 |  |
| [src/interactions/AdminInteractionEditor.tsx](../../src/interactions/AdminInteractionEditor.tsx) | Soltanto censito | 120 |  |
| [src/interactions/ConfiguredInteractionPanel.tsx](../../src/interactions/ConfiguredInteractionPanel.tsx) | Soltanto censito | 49 |  |
| [src/interactions/interactionStore.ts](../../src/interactions/interactionStore.ts) | Letto integralmente | 67 |  |
| [src/interactions/runtime.ts](../../src/interactions/runtime.ts) | Letto integralmente | 186 |  |
| [src/interactions/schema.ts](../../src/interactions/schema.ts) | Letto integralmente | 114 |  |
| [src/interactions/tiledAdapter.ts](../../src/interactions/tiledAdapter.ts) | Letto integralmente | 52 |  |
| [src/interactions/types.ts](../../src/interactions/types.ts) | Letto integralmente | 70 |  |
| [src/journal/journalModel.ts](../../src/journal/journalModel.ts) | Soltanto censito | 75 |  |
| [src/journal/PlayerJournalPanel.tsx](../../src/journal/PlayerJournalPanel.tsx) | Soltanto censito | 65 |  |
| [src/journal/TurnSummary.tsx](../../src/journal/TurnSummary.tsx) | Soltanto censito | 25 |  |
| [src/league/AdminLeaguePanel.tsx](../../src/league/AdminLeaguePanel.tsx) | Soltanto censito | 34 |  |
| [src/league/leagueModel.ts](../../src/league/leagueModel.ts) | Letto integralmente | 148 |  |
| [src/league/LeagueScene.tsx](../../src/league/LeagueScene.tsx) | Soltanto censito | 72 |  |
| [src/main.tsx](../../src/main.tsx) | Soltanto censito | 12 |  |
| [src/match/matchLog.ts](../../src/match/matchLog.ts) | Soltanto censito | 99 |  |
| [src/match/MatchRegisterPanel.tsx](../../src/match/MatchRegisterPanel.tsx) | Soltanto censito | 49 |  |
| [src/match/trackGameChange.ts](../../src/match/trackGameChange.ts) | Letto integralmente | 82 |  |
| [src/player-ui/AnalysisScreen.tsx](../../src/player-ui/AnalysisScreen.tsx) | Soltanto censito | 86 |  |
| [src/player-ui/ArkadexScreen.tsx](../../src/player-ui/ArkadexScreen.tsx) | Soltanto censito | 180 |  |
| [src/player-ui/BagScreen.tsx](../../src/player-ui/BagScreen.tsx) | Soltanto censito | 76 |  |
| [src/player-ui/currentRoster.ts](../../src/player-ui/currentRoster.ts) | Letto integralmente | 12 |  |
| [src/player-ui/DepositScreen.tsx](../../src/player-ui/DepositScreen.tsx) | Lettura parziale | 177 | 50-177; esito scambio 82-97 |
| [src/player-ui/depositTools.ts](../../src/player-ui/depositTools.ts) | Soltanto censito | 36 |  |
| [src/player-ui/kit.tsx](../../src/player-ui/kit.tsx) | Soltanto censito | 105 |  |
| [src/player-ui/MenuScreen.tsx](../../src/player-ui/MenuScreen.tsx) | Soltanto censito | 83 |  |
| [src/player-ui/navigation.ts](../../src/player-ui/navigation.ts) | Soltanto censito | 16 |  |
| [src/player-ui/PlayerUi.tsx](../../src/player-ui/PlayerUi.tsx) | Soltanto censito | 183 |  |
| [src/player-ui/playerUiSession.ts](../../src/player-ui/playerUiSession.ts) | Soltanto censito | 42 |  |
| [src/player-ui/portraitFraming.ts](../../src/player-ui/portraitFraming.ts) | Soltanto censito | 19 |  |
| [src/player-ui/RaceScreen.tsx](../../src/player-ui/RaceScreen.tsx) | Soltanto censito | 30 |  |
| [src/player-ui/RegisterScreen.tsx](../../src/player-ui/RegisterScreen.tsx) | Soltanto censito | 24 |  |
| [src/player-ui/StoreScreen.tsx](../../src/player-ui/StoreScreen.tsx) | Soltanto censito | 79 |  |
| [src/player-ui/TeamScreen.tsx](../../src/player-ui/TeamScreen.tsx) | Letto integralmente | 139 |  |
| [src/presentation/bootstrapPresentation.ts](../../src/presentation/bootstrapPresentation.ts) | Soltanto censito | 5 |  |
| [src/presentation/presentationProject.ts](../../src/presentation/presentationProject.ts) | Soltanto censito | 142 |  |
| [src/presentation/PresentationProjectPanel.tsx](../../src/presentation/PresentationProjectPanel.tsx) | Soltanto censito | 30 |  |
| [src/presentation/presentationRuntime.ts](../../src/presentation/presentationRuntime.ts) | Soltanto censito | 49 |  |
| [src/presentation/presentationTransaction.ts](../../src/presentation/presentationTransaction.ts) | Soltanto censito | 49 |  |
| [src/presentation/vfxValidation.ts](../../src/presentation/vfxValidation.ts) | Soltanto censito | 21 |  |
| [src/readiness/AdminSessionPanel.tsx](../../src/readiness/AdminSessionPanel.tsx) | Letto integralmente | 110 |  |
| [src/readiness/campaignApply.ts](../../src/readiness/campaignApply.ts) | Letto integralmente | 123 |  |
| [src/readiness/campaignPackage.ts](../../src/readiness/campaignPackage.ts) | Letto integralmente | 58 |  |
| [src/readiness/readinessModel.ts](../../src/readiness/readinessModel.ts) | Letto integralmente | 71 |  |
| [src/regia/BroadcastView.tsx](../../src/regia/BroadcastView.tsx) | Soltanto censito | 76 |  |
| [src/regia/managementPresentation.ts](../../src/regia/managementPresentation.ts) | Soltanto censito | 68 |  |
| [src/regia/PresentManagementControl.tsx](../../src/regia/PresentManagementControl.tsx) | Soltanto censito | 22 |  |
| [src/regia/publicManagementStore.ts](../../src/regia/publicManagementStore.ts) | Soltanto censito | 7 |  |
| [src/regia/PublicManagementView.tsx](../../src/regia/PublicManagementView.tsx) | Soltanto censito | 17 |  |
| [src/regia/PublicMap.tsx](../../src/regia/PublicMap.tsx) | Soltanto censito | 69 |  |
| [src/regia/publicPresentation.ts](../../src/regia/publicPresentation.ts) | Soltanto censito | 27 |  |
| [src/regia/PublicPresentationBridge.tsx](../../src/regia/PublicPresentationBridge.tsx) | Soltanto censito | 33 |  |
| [src/regia/publicSnapshot.ts](../../src/regia/publicSnapshot.ts) | Letto integralmente | 56 |  |
| [src/regia/RegiaPause.tsx](../../src/regia/RegiaPause.tsx) | Letto integralmente | 26 |  |
| [src/regia/regiaStore.ts](../../src/regia/regiaStore.ts) | Letto integralmente | 28 |  |
| [src/save/BackupPanel.tsx](../../src/save/BackupPanel.tsx) | Letto integralmente | 98 |  |
| [src/save/durableWrites.ts](../../src/save/durableWrites.ts) | Letto integralmente | 90 |  |
| [src/save/gameBackup.ts](../../src/save/gameBackup.ts) | Letto integralmente | 126 |  |
| [src/save/gamePersistence.ts](../../src/save/gamePersistence.ts) | Letto integralmente | 398 |  |
| [src/save/restoreGameBackup.ts](../../src/save/restoreGameBackup.ts) | Letto integralmente | 81 |  |
| [src/save/restoreJournal.ts](../../src/save/restoreJournal.ts) | Letto integralmente | 108 |  |
| [src/save/SaveFailureNotice.tsx](../../src/save/SaveFailureNotice.tsx) | Letto integralmente | 38 |  |
| [src/save/SaveRecoveryNotice.tsx](../../src/save/SaveRecoveryNotice.tsx) | Letto integralmente | 12 |  |
| [src/scenes/BattagliaScene.tsx](../../src/scenes/BattagliaScene.tsx) | Lettura parziale | 1904 | 1-130,260-330,480-580,805-860,1550-1730; conteggi import/hook intero file automatici |
| [src/scenes/CittaScene.tsx](../../src/scenes/CittaScene.tsx) | Letto integralmente | 232 |  |
| [src/scenes/DepositoScene.tsx](../../src/scenes/DepositoScene.tsx) | Soltanto censito | 21 |  |
| [src/scenes/EvoluzioneScene.tsx](../../src/scenes/EvoluzioneScene.tsx) | Lettura parziale | 407 | 1-180; presentazione 181-407 non riletta |
| [src/scenes/LaboratorioScene.tsx](../../src/scenes/LaboratorioScene.tsx) | Soltanto censito | 154 |  |
| [src/scenes/LocalMapScene.tsx](../../src/scenes/LocalMapScene.tsx) | Lettura parziale | 156 | 1-105; ricerca GM activities e guardie |
| [src/scenes/MappaGrigliaScene.tsx](../../src/scenes/MappaGrigliaScene.tsx) | Soltanto censito | 824 |  |
| [src/scenes/MappaPrincipaleScene.tsx](../../src/scenes/MappaPrincipaleScene.tsx) | Lettura parziale | 908 | 205-305; ricerca ingressi e passaggi scena |
| [src/scenes/PercorsoScene.tsx](../../src/scenes/PercorsoScene.tsx) | Lettura parziale | 248 | 1-140; rami fallback e guardie cercati |
| [src/scenes/TitoloScene.tsx](../../src/scenes/TitoloScene.tsx) | Soltanto censito | 124 |  |
| [src/session/sessionCoordinator.ts](../../src/session/sessionCoordinator.ts) | Letto integralmente | 252 |  |
| [src/session/SessionGate.tsx](../../src/session/SessionGate.tsx) | Letto integralmente | 30 |  |
| [src/session/sessionOwnership.ts](../../src/session/sessionOwnership.ts) | Letto integralmente | 96 |  |
| [src/settings/gamePreferences.ts](../../src/settings/gamePreferences.ts) | Soltanto censito | 50 |  |
| [src/settings/GameSettingsPanel.tsx](../../src/settings/GameSettingsPanel.tsx) | Soltanto censito | 41 |  |
| [src/settings/PlayerTools.tsx](../../src/settings/PlayerTools.tsx) | Letto integralmente | 54 |  |
| [src/settings/TeamRuleNotice.tsx](../../src/settings/TeamRuleNotice.tsx) | Soltanto censito | 9 |  |
| [src/shop/ArkaStorePanel.tsx](../../src/shop/ArkaStorePanel.tsx) | Soltanto censito | 73 |  |
| [src/shop/BattleItemDialog.tsx](../../src/shop/BattleItemDialog.tsx) | Soltanto censito | 65 |  |
| [src/shop/catalog.ts](../../src/shop/catalog.ts) | Soltanto censito | 64 |  |
| [src/shop/ItemBagPanel.tsx](../../src/shop/ItemBagPanel.tsx) | Soltanto censito | 33 |  |
| [src/shop/itemEffects.ts](../../src/shop/itemEffects.ts) | Letto integralmente | 31 |  |
| [src/shop/ItemUsePanel.tsx](../../src/shop/ItemUsePanel.tsx) | Soltanto censito | 63 |  |
| [src/shop/purchase.ts](../../src/shop/purchase.ts) | Letto integralmente | 93 |  |
| [src/store/adminStore.ts](../../src/store/adminStore.ts) | Soltanto censito | 471 |  |
| [src/store/gameStore.ts](../../src/store/gameStore.ts) | Letto integralmente | 1227 |  |
| [src/store/vfxAdminStore.ts](../../src/store/vfxAdminStore.ts) | Soltanto censito | 75 |  |
| [src/theme/adminThemePresets.ts](../../src/theme/adminThemePresets.ts) | Soltanto censito | 176 |  |
| [src/theme/adminThemeTypes.ts](../../src/theme/adminThemeTypes.ts) | Soltanto censito | 153 |  |
| [src/theme/adminThemeUiBounds.ts](../../src/theme/adminThemeUiBounds.ts) | Soltanto censito | 18 |  |
| [src/theme/applyAdminTheme.ts](../../src/theme/applyAdminTheme.ts) | Soltanto censito | 31 |  |
| [src/theme/defaultAdminTheme.ts](../../src/theme/defaultAdminTheme.ts) | Soltanto censito | 31 |  |
| [src/theme/depositLayoutMigration.ts](../../src/theme/depositLayoutMigration.ts) | Soltanto censito | 27 |  |
| [src/theme/parseAdminTheme.ts](../../src/theme/parseAdminTheme.ts) | Soltanto censito | 369 |  |
| [src/types/index.ts](../../src/types/index.ts) | Soltanto censito | 353 |  |
| [src/ui-studio/assetSurface.ts](../../src/ui-studio/assetSurface.ts) | Soltanto censito | 15 |  |
| [src/ui-studio/battleLayout.tsx](../../src/ui-studio/battleLayout.tsx) | Soltanto censito | 52 |  |
| [src/ui-studio/designModel.ts](../../src/ui-studio/designModel.ts) | Soltanto censito | 173 |  |
| [src/ui-studio/hpAssetSkin.ts](../../src/ui-studio/hpAssetSkin.ts) | Soltanto censito | 31 |  |
| [src/ui-studio/mediaStorage.ts](../../src/ui-studio/mediaStorage.ts) | Soltanto censito | 197 |  |
| [src/ui-studio/previewFixtures.ts](../../src/ui-studio/previewFixtures.ts) | Letto integralmente | 57 |  |
| [src/ui-studio/previewMode.ts](../../src/ui-studio/previewMode.ts) | Soltanto censito | 10 |  |
| [src/ui-studio/runtimeDesign.ts](../../src/ui-studio/runtimeDesign.ts) | Soltanto censito | 17 |  |
| [src/ui-studio/runtimePolicy.ts](../../src/ui-studio/runtimePolicy.ts) | Soltanto censito | 10 |  |
| [src/ui-studio/screenRegistry.ts](../../src/ui-studio/screenRegistry.ts) | Soltanto censito | 96 |  |
| [src/ui-studio/skinSlots.ts](../../src/ui-studio/skinSlots.ts) | Soltanto censito | 18 |  |
| [src/ui-studio/studioStore.ts](../../src/ui-studio/studioStore.ts) | Soltanto censito | 59 |  |
| [src/ui-studio/types.ts](../../src/ui-studio/types.ts) | Soltanto censito | 111 |  |
| [src/ui-studio/UiDesignRuntime.tsx](../../src/ui-studio/UiDesignRuntime.tsx) | Soltanto censito | 315 |  |
| [src/ui-studio/UiPreviewViewContext.ts](../../src/ui-studio/UiPreviewViewContext.ts) | Soltanto censito | 4 |  |
| [src/ui-studio/UiStudioEditor.tsx](../../src/ui-studio/UiStudioEditor.tsx) | Soltanto censito | 464 |  |
| [src/ui-studio/UiStudioPreview.tsx](../../src/ui-studio/UiStudioPreview.tsx) | Soltanto censito | 72 |  |
| [src/utils/assetUrl.ts](../../src/utils/assetUrl.ts) | Letto integralmente | 28 |  |
| [src/utils/mainMapRoadGeometry.ts](../../src/utils/mainMapRoadGeometry.ts) | Soltanto censito | 66 |  |
| [src/utils/prepareImageAsset.ts](../../src/utils/prepareImageAsset.ts) | Soltanto censito | 88 |  |
| [src/utils/soundManager.ts](../../src/utils/soundManager.ts) | Soltanto censito | 294 |  |
| [src/utils/spritePageCache.ts](../../src/utils/spritePageCache.ts) | Soltanto censito | 143 |  |
| [src/vite-env.d.ts](../../src/vite-env.d.ts) | Soltanto censito | 8 |  |

## asset-or-tool

| File | Stato | Righe fisiche | Ambito |
|---|---|---:|---|
| [src/assets/fonts/ChelaOne-Regular.ttf](../../src/assets/fonts/ChelaOne-Regular.ttf) | Soltanto censito | — |  |
| [src/ui-studio/templates/hp-bar-enemy.svg](../../src/ui-studio/templates/hp-bar-enemy.svg) | Soltanto censito | — |  |
| [src/ui-studio/templates/hp-bar.svg](../../src/ui-studio/templates/hp-bar.svg) | Soltanto censito | — |  |

## data-catalog

| File | Stato | Righe fisiche | Ambito |
|---|---|---:|---|
| [src/challenges/classicCatalogV1.json](../../src/challenges/classicCatalogV1.json) | Soltanto censito | 666 |  |
| [src/data/allenatori.json](../../src/data/allenatori.json) | Soltanto censito | 348 |  |
| [src/data/animation-loop-review.json](../../src/data/animation-loop-review.json) | Soltanto censito | 58 |  |
| [src/data/arkamon-paged.json](../../src/data/arkamon-paged.json) | Soltanto censito | 77561 |  |
| [src/data/audio-selections.json](../../src/data/audio-selections.json) | Soltanto censito | 2215 |  |
| [src/data/crescita_hp.json](../../src/data/crescita_hp.json) | Soltanto censito | 6 |  |
| [src/data/incontri.json](../../src/data/incontri.json) | Soltanto censito | 418 |  |
| [src/data/mappe.json](../../src/data/mappe.json) | Soltanto censito | 118 |  |
| [src/data/media-release.json](../../src/data/media-release.json) | Soltanto censito | 5 |  |
| [src/data/mosse.json](../../src/data/mosse.json) | Soltanto censito | 44662 |  |
| [src/data/move-vfx-assignments.json](../../src/data/move-vfx-assignments.json) | Soltanto censito | 6162 |  |
| [src/data/pokemon.json](../../src/data/pokemon.json) | Soltanto censito | 1652 |  |
| [src/data/tipi.json](../../src/data/tipi.json) | Soltanto censito | 94 |  |
| [src/data/vfx-curation-runtime.json](../../src/data/vfx-curation-runtime.json) | Soltanto censito | 1 |  |
| [src/player-ui/portraitMetadata.json](../../src/player-ui/portraitMetadata.json) | Soltanto censito | 1912 |  |
| [src/theme/arkamon-theme.json](../../src/theme/arkamon-theme.json) | Soltanto censito | 625 |  |

## generated-catalog

| File | Stato | Righe fisiche | Ambito |
|---|---|---:|---|
| [src/components/vfx/generatedVfxAssets.ts](../../src/components/vfx/generatedVfxAssets.ts) | Soltanto censito | 9045 |  |
| [src/ui-studio/assetCatalog.ts](../../src/ui-studio/assetCatalog.ts) | Soltanto censito | 2414 |  |

## stylesheet

| File | Stato | Righe fisiche | Ambito |
|---|---|---:|---|
| [src/admin/adminPanel.css](../../src/admin/adminPanel.css) | Soltanto censito | 23 |  |
| [src/arkadex/arkadex.css](../../src/arkadex/arkadex.css) | Soltanto censito | 26 |  |
| [src/audience/audience.css](../../src/audience/audience.css) | Soltanto censito | 24 |  |
| [src/components/arkamon/darklawAnimationLab.css](../../src/components/arkamon/darklawAnimationLab.css) | Soltanto censito | 130 |  |
| [src/components/battle/battleAudienceOverlay.css](../../src/components/battle/battleAudienceOverlay.css) | Soltanto censito | 19 |  |
| [src/components/battle/battleDice.css](../../src/components/battle/battleDice.css) | Soltanto censito | 57 |  |
| [src/components/battle/battleRpg.css](../../src/components/battle/battleRpg.css) | Soltanto censito | 28 |  |
| [src/components/deposit/deposit.css](../../src/components/deposit/deposit.css) | Soltanto censito | 190 |  |
| [src/components/map/localMapBoard.css](../../src/components/map/localMapBoard.css) | Soltanto censito | 152 |  |
| [src/components/rpg/rpg.css](../../src/components/rpg/rpg.css) | Soltanto censito | 11 |  |
| [src/components/transitions/sceneTransitions.css](../../src/components/transitions/sceneTransitions.css) | Soltanto censito | 278 |  |
| [src/components/ui/gameButton.css](../../src/components/ui/gameButton.css) | Soltanto censito | 42 |  |
| [src/index.css](../../src/index.css) | Soltanto censito | 198 |  |
| [src/interactions/interactions.css](../../src/interactions/interactions.css) | Soltanto censito | 23 |  |
| [src/journal/journal.css](../../src/journal/journal.css) | Soltanto censito | 18 |  |
| [src/league/league.css](../../src/league/league.css) | Soltanto censito | 44 |  |
| [src/match/match.css](../../src/match/match.css) | Soltanto censito | 19 |  |
| [src/player-ui/player-ui.css](../../src/player-ui/player-ui.css) | Soltanto censito | 294 |  |
| [src/player-ui/rpgPlayerUi.css](../../src/player-ui/rpgPlayerUi.css) | Soltanto censito | 172 |  |
| [src/presentation/presentationProject.css](../../src/presentation/presentationProject.css) | Soltanto censito | 2 |  |
| [src/readiness/readiness.css](../../src/readiness/readiness.css) | Soltanto censito | 16 |  |
| [src/regia/regia.css](../../src/regia/regia.css) | Soltanto censito | 13 |  |
| [src/scenes/localMapScene.css](../../src/scenes/localMapScene.css) | Soltanto censito | 54 |  |
| [src/scenes/rpgScenes.css](../../src/scenes/rpgScenes.css) | Soltanto censito | 6 |  |
| [src/scenes/worldMapRpg.css](../../src/scenes/worldMapRpg.css) | Soltanto censito | 22 |  |
| [src/shop/battleBag.css](../../src/shop/battleBag.css) | Soltanto censito | 29 |  |
| [src/shop/shop.css](../../src/shop/shop.css) | Soltanto censito | 29 |  |
| [src/ui-studio/uiStudio.css](../../src/ui-studio/uiStudio.css) | Soltanto censito | 8 |  |

## test

| File | Stato | Righe fisiche | Ambito |
|---|---|---:|---|
| [src/admin/AdminImportExport.test.ts](../../src/admin/AdminImportExport.test.ts) | Soltanto censito | 54 |  |
| [src/admin/AdminOverlay.test.tsx](../../src/admin/AdminOverlay.test.tsx) | Soltanto censito | 47 |  |
| [src/admin/adminPointerDrag.test.ts](../../src/admin/adminPointerDrag.test.ts) | Soltanto censito | 50 |  |
| [src/arkadex/__tests__/arkadexModel.test.ts](../../src/arkadex/__tests__/arkadexModel.test.ts) | Soltanto censito | 84 |  |
| [src/audience/__tests__/AdminAudiencePanel.test.tsx](../../src/audience/__tests__/AdminAudiencePanel.test.tsx) | Soltanto censito | 59 |  |
| [src/audience/__tests__/audienceApi.test.ts](../../src/audience/__tests__/audienceApi.test.ts) | Soltanto censito | 112 |  |
| [src/audience/__tests__/audienceTurnController.test.ts](../../src/audience/__tests__/audienceTurnController.test.ts) | Soltanto censito | 157 |  |
| [src/audience/__tests__/useAudienceStore.test.ts](../../src/audience/__tests__/useAudienceStore.test.ts) | Letto integralmente | 179 |  |
| [src/challenges/challengeRuntime.test.ts](../../src/challenges/challengeRuntime.test.ts) | Soltanto censito | 203 |  |
| [src/challenges/challenges.test.ts](../../src/challenges/challenges.test.ts) | Soltanto censito | 189 |  |
| [src/challenges/rulesVersions.test.ts](../../src/challenges/rulesVersions.test.ts) | Lettura parziale | 145 | titoli test e scenari indicizzati |
| [src/components/arkamon/__tests__/arkamonAnimationAssets.test.ts](../../src/components/arkamon/__tests__/arkamonAnimationAssets.test.ts) | Soltanto censito | 161 |  |
| [src/components/arkamon/__tests__/arkamonAnimationManifest.test.ts](../../src/components/arkamon/__tests__/arkamonAnimationManifest.test.ts) | Soltanto censito | 110 |  |
| [src/components/arkamon/__tests__/ArkamonBattleSprite.test.tsx](../../src/components/arkamon/__tests__/ArkamonBattleSprite.test.tsx) | Soltanto censito | 174 |  |
| [src/components/arkamon/__tests__/arkamonMotionProfiles.test.ts](../../src/components/arkamon/__tests__/arkamonMotionProfiles.test.ts) | Soltanto censito | 35 |  |
| [src/components/arkamon/__tests__/arkamonPages.test.ts](../../src/components/arkamon/__tests__/arkamonPages.test.ts) | Soltanto censito | 51 |  |
| [src/components/arkamon/__tests__/nativeRuntimePages.test.ts](../../src/components/arkamon/__tests__/nativeRuntimePages.test.ts) | Soltanto censito | 39 |  |
| [src/components/audio/audioCuration.test.ts](../../src/components/audio/audioCuration.test.ts) | Soltanto censito | 51 |  |
| [src/components/audio/audioSelections.test.ts](../../src/components/audio/audioSelections.test.ts) | Soltanto censito | 49 |  |
| [src/components/audio/audioWorkspaceModel.test.ts](../../src/components/audio/audioWorkspaceModel.test.ts) | Soltanto censito | 21 |  |
| [src/components/battle/audienceBattle.test.ts](../../src/components/battle/audienceBattle.test.ts) | Soltanto censito | 145 |  |
| [src/components/battle/battleArchiveStore.test.ts](../../src/components/battle/battleArchiveStore.test.ts) | Soltanto censito | 97 |  |
| [src/components/battle/battleAssetReadiness.test.ts](../../src/components/battle/battleAssetReadiness.test.ts) | Soltanto censito | 12 |  |
| [src/components/battle/BattleAudienceOverlay.test.tsx](../../src/components/battle/BattleAudienceOverlay.test.tsx) | Soltanto censito | 18 |  |
| [src/components/battle/battleCheckpoint.test.ts](../../src/components/battle/battleCheckpoint.test.ts) | Soltanto censito | 57 |  |
| [src/components/battle/battleChronicle.test.ts](../../src/components/battle/battleChronicle.test.ts) | Soltanto censito | 152 |  |
| [src/components/battle/battleDiceAssets.test.ts](../../src/components/battle/battleDiceAssets.test.ts) | Soltanto censito | 130 |  |
| [src/components/battle/battleDiceReveal.test.ts](../../src/components/battle/battleDiceReveal.test.ts) | Soltanto censito | 145 |  |
| [src/components/battle/battleMoveFacts.test.ts](../../src/components/battle/battleMoveFacts.test.ts) | Soltanto censito | 28 |  |
| [src/components/battle/battleOutcomeSummary.test.ts](../../src/components/battle/battleOutcomeSummary.test.ts) | Soltanto censito | 19 |  |
| [src/components/battle/battleRoundOrder.test.ts](../../src/components/battle/battleRoundOrder.test.ts) | Soltanto censito | 51 |  |
| [src/components/battle/battleStatusRules.test.ts](../../src/components/battle/battleStatusRules.test.ts) | Soltanto censito | 67 |  |
| [src/components/battle/battleVisualSequence.test.ts](../../src/components/battle/battleVisualSequence.test.ts) | Soltanto censito | 371 |  |
| [src/components/battle/DiceRollOverlay.test.tsx](../../src/components/battle/DiceRollOverlay.test.tsx) | Soltanto censito | 67 |  |
| [src/components/battle/modalFocus.test.ts](../../src/components/battle/modalFocus.test.ts) | Soltanto censito | 83 |  |
| [src/components/deposit/DepositView.test.tsx](../../src/components/deposit/DepositView.test.tsx) | Soltanto censito | 126 |  |
| [src/components/map/__tests__/LocalMapBoard.test.tsx](../../src/components/map/__tests__/LocalMapBoard.test.tsx) | Soltanto censito | 116 |  |
| [src/components/map/mapJourney.test.ts](../../src/components/map/mapJourney.test.ts) | Soltanto censito | 23 |  |
| [src/components/map/worldMapHudLayout.test.ts](../../src/components/map/worldMapHudLayout.test.ts) | Soltanto censito | 20 |  |
| [src/components/rpg/SpatialNavigation.test.ts](../../src/components/rpg/SpatialNavigation.test.ts) | Soltanto censito | 17 |  |
| [src/components/transitions/__tests__/SceneTransitionOverlay.test.tsx](../../src/components/transitions/__tests__/SceneTransitionOverlay.test.tsx) | Soltanto censito | 51 |  |
| [src/components/transitions/__tests__/sceneTransitionProfiles.test.ts](../../src/components/transitions/__tests__/sceneTransitionProfiles.test.ts) | Soltanto censito | 82 |  |
| [src/components/transitions/__tests__/sceneTransitionState.test.ts](../../src/components/transitions/__tests__/sceneTransitionState.test.ts) | Soltanto censito | 137 |  |
| [src/components/transitions/__tests__/transitionArchive.test.ts](../../src/components/transitions/__tests__/transitionArchive.test.ts) | Soltanto censito | 88 |  |
| [src/components/transitions/__tests__/transitionArtwork.test.ts](../../src/components/transitions/__tests__/transitionArtwork.test.ts) | Soltanto censito | 54 |  |
| [src/components/vfx/__tests__/AnimatedSpriteCanvasImage.test.ts](../../src/components/vfx/__tests__/AnimatedSpriteCanvasImage.test.ts) | Soltanto censito | 92 |  |
| [src/components/vfx/__tests__/AnimatedSpriteReactionGate.test.ts](../../src/components/vfx/__tests__/AnimatedSpriteReactionGate.test.ts) | Soltanto censito | 139 |  |
| [src/components/vfx/__tests__/AnimatedSpriteResponsive.test.tsx](../../src/components/vfx/__tests__/AnimatedSpriteResponsive.test.tsx) | Soltanto censito | 52 |  |
| [src/components/vfx/__tests__/battleVfxPosition.test.ts](../../src/components/vfx/__tests__/battleVfxPosition.test.ts) | Soltanto censito | 69 |  |
| [src/components/vfx/__tests__/curatedBattleVfx.test.ts](../../src/components/vfx/__tests__/curatedBattleVfx.test.ts) | Soltanto censito | 93 |  |
| [src/components/vfx/__tests__/curationRuntimeCatalog.test.ts](../../src/components/vfx/__tests__/curationRuntimeCatalog.test.ts) | Soltanto censito | 19 |  |
| [src/components/vfx/__tests__/motionPreferences.test.tsx](../../src/components/vfx/__tests__/motionPreferences.test.tsx) | Soltanto censito | 359 |  |
| [src/components/vfx/__tests__/movesetVfxAssets.test.ts](../../src/components/vfx/__tests__/movesetVfxAssets.test.ts) | Soltanto censito | 68 |  |
| [src/components/vfx/__tests__/moveVfxAssignments.test.ts](../../src/components/vfx/__tests__/moveVfxAssignments.test.ts) | Soltanto censito | 93 |  |
| [src/components/vfx/__tests__/moveVfxProfiles.test.ts](../../src/components/vfx/__tests__/moveVfxProfiles.test.ts) | Soltanto censito | 70 |  |
| [src/components/vfx/__tests__/PagedAnimatedSprite.test.tsx](../../src/components/vfx/__tests__/PagedAnimatedSprite.test.tsx) | Soltanto censito | 167 |  |
| [src/components/vfx/__tests__/resolveMoveVfxAsset.test.ts](../../src/components/vfx/__tests__/resolveMoveVfxAsset.test.ts) | Soltanto censito | 147 |  |
| [src/components/vfx/__tests__/spriteFrame.test.ts](../../src/components/vfx/__tests__/spriteFrame.test.ts) | Soltanto censito | 49 |  |
| [src/components/vfx/__tests__/spritePages.test.ts](../../src/components/vfx/__tests__/spritePages.test.ts) | Soltanto censito | 23 |  |
| [src/components/vfx/__tests__/vfxCuration.test.ts](../../src/components/vfx/__tests__/vfxCuration.test.ts) | Soltanto censito | 151 |  |
| [src/components/vfx/__tests__/vfxManifestAssets.test.ts](../../src/components/vfx/__tests__/vfxManifestAssets.test.ts) | Soltanto censito | 33 |  |
| [src/components/vfx/__tests__/vfxPresentationOverrides.test.ts](../../src/components/vfx/__tests__/vfxPresentationOverrides.test.ts) | Soltanto censito | 22 |  |
| [src/components/vfx/__tests__/vfxRecipes.test.ts](../../src/components/vfx/__tests__/vfxRecipes.test.ts) | Soltanto censito | 81 |  |
| [src/data/__tests__/allenatori.test.ts](../../src/data/__tests__/allenatori.test.ts) | Soltanto censito | 23 |  |
| [src/data/__tests__/bilanciamento.test.ts](../../src/data/__tests__/bilanciamento.test.ts) | Soltanto censito | 163 |  |
| [src/data/__tests__/cagliariFoggiaReference.test.ts](../../src/data/__tests__/cagliariFoggiaReference.test.ts) | Soltanto censito | 121 |  |
| [src/data/__tests__/evolutionLineage.test.ts](../../src/data/__tests__/evolutionLineage.test.ts) | Soltanto censito | 48 |  |
| [src/data/__tests__/localMaps.test.ts](../../src/data/__tests__/localMaps.test.ts) | Soltanto censito | 121 |  |
| [src/data/__tests__/routeTorinoReferences.test.ts](../../src/data/__tests__/routeTorinoReferences.test.ts) | Soltanto censito | 170 |  |
| [src/data/__tests__/secretLocation.test.ts](../../src/data/__tests__/secretLocation.test.ts) | Soltanto censito | 30 |  |
| [src/data/__tests__/sixCityReferences.test.ts](../../src/data/__tests__/sixCityReferences.test.ts) | Soltanto censito | 144 |  |
| [src/data/__tests__/statusMoves.test.ts](../../src/data/__tests__/statusMoves.test.ts) | Soltanto censito | 68 |  |
| [src/data/__tests__/veneziaReference.test.ts](../../src/data/__tests__/veneziaReference.test.ts) | Soltanto censito | 55 |  |
| [src/data/mappe-griglia/__tests__/mappe-griglia.test.ts](../../src/data/mappe-griglia/__tests__/mappe-griglia.test.ts) | Soltanto censito | 245 |  |
| [src/engine/__tests__/battleEngine.test.ts](../../src/engine/__tests__/battleEngine.test.ts) | Soltanto censito | 182 |  |
| [src/engine/__tests__/battleResolution.test.ts](../../src/engine/__tests__/battleResolution.test.ts) | Soltanto censito | 51 |  |
| [src/engine/__tests__/cura.test.ts](../../src/engine/__tests__/cura.test.ts) | Soltanto censito | 194 |  |
| [src/engine/__tests__/deposito.test.ts](../../src/engine/__tests__/deposito.test.ts) | Soltanto censito | 118 |  |
| [src/engine/__tests__/encounters.test.ts](../../src/engine/__tests__/encounters.test.ts) | Soltanto censito | 52 |  |
| [src/engine/__tests__/koProgression.test.ts](../../src/engine/__tests__/koProgression.test.ts) | Soltanto censito | 76 |  |
| [src/engine/__tests__/localMapMovement.test.ts](../../src/engine/__tests__/localMapMovement.test.ts) | Soltanto censito | 54 |  |
| [src/engine/__tests__/monete.test.ts](../../src/engine/__tests__/monete.test.ts) | Soltanto censito | 26 |  |
| [src/engine/__tests__/movimento.test.ts](../../src/engine/__tests__/movimento.test.ts) | Soltanto censito | 291 |  |
| [src/engine/__tests__/stati.test.ts](../../src/engine/__tests__/stati.test.ts) | Soltanto censito | 346 |  |
| [src/engine/__tests__/statusMoves.test.ts](../../src/engine/__tests__/statusMoves.test.ts) | Soltanto censito | 76 |  |
| [src/engine/__tests__/suprema.test.ts](../../src/engine/__tests__/suprema.test.ts) | Soltanto censito | 324 |  |
| [src/engine/__tests__/teamLevelCap.test.ts](../../src/engine/__tests__/teamLevelCap.test.ts) | Soltanto censito | 135 |  |
| [src/engine/pokemonFactory.test.ts](../../src/engine/pokemonFactory.test.ts) | Soltanto censito | 16 |  |
| [src/interactions/__tests__/interactionStore.test.ts](../../src/interactions/__tests__/interactionStore.test.ts) | Letto integralmente | 75 |  |
| [src/interactions/__tests__/runtime.test.ts](../../src/interactions/__tests__/runtime.test.ts) | Soltanto censito | 184 |  |
| [src/interactions/__tests__/schema.test.ts](../../src/interactions/__tests__/schema.test.ts) | Soltanto censito | 98 |  |
| [src/journal/__tests__/journalModel.test.ts](../../src/journal/__tests__/journalModel.test.ts) | Soltanto censito | 61 |  |
| [src/league/leagueRuntime.test.ts](../../src/league/leagueRuntime.test.ts) | Letto integralmente | 191 |  |
| [src/match/__tests__/matchLog.test.ts](../../src/match/__tests__/matchLog.test.ts) | Soltanto censito | 108 |  |
| [src/match/__tests__/trackGameChange.test.ts](../../src/match/__tests__/trackGameChange.test.ts) | Soltanto censito | 122 |  |
| [src/player-ui/__tests__/BagSelectedItem.test.tsx](../../src/player-ui/__tests__/BagSelectedItem.test.tsx) | Soltanto censito | 98 |  |
| [src/player-ui/__tests__/catalogScreens.test.tsx](../../src/player-ui/__tests__/catalogScreens.test.tsx) | Soltanto censito | 139 |  |
| [src/player-ui/__tests__/currentRoster.test.ts](../../src/player-ui/__tests__/currentRoster.test.ts) | Soltanto censito | 17 |  |
| [src/player-ui/__tests__/depositTools.test.ts](../../src/player-ui/__tests__/depositTools.test.ts) | Soltanto censito | 30 |  |
| [src/player-ui/__tests__/menuNavigation.test.tsx](../../src/player-ui/__tests__/menuNavigation.test.tsx) | Soltanto censito | 69 |  |
| [src/player-ui/__tests__/moveFacts.test.tsx](../../src/player-ui/__tests__/moveFacts.test.tsx) | Soltanto censito | 24 |  |
| [src/player-ui/__tests__/portraitFraming.test.tsx](../../src/player-ui/__tests__/portraitFraming.test.tsx) | Soltanto censito | 56 |  |
| [src/player-ui/TeamAnalysisDeposit.test.tsx](../../src/player-ui/TeamAnalysisDeposit.test.tsx) | Soltanto censito | 119 |  |
| [src/presentation/presentationProject.test.ts](../../src/presentation/presentationProject.test.ts) | Soltanto censito | 83 |  |
| [src/presentation/presentationTransaction.test.ts](../../src/presentation/presentationTransaction.test.ts) | Soltanto censito | 37 |  |
| [src/readiness/campaignApply.test.ts](../../src/readiness/campaignApply.test.ts) | Letto integralmente | 174 |  |
| [src/readiness/campaignCatalogFence.test.ts](../../src/readiness/campaignCatalogFence.test.ts) | Letto integralmente | 62 |  |
| [src/readiness/campaignPackage.test.ts](../../src/readiness/campaignPackage.test.ts) | Soltanto censito | 39 |  |
| [src/readiness/readinessModel.test.ts](../../src/readiness/readinessModel.test.ts) | Soltanto censito | 42 |  |
| [src/regia/managementPresentation.test.ts](../../src/regia/managementPresentation.test.ts) | Soltanto censito | 44 |  |
| [src/regia/PublicMap.test.tsx](../../src/regia/PublicMap.test.tsx) | Soltanto censito | 74 |  |
| [src/regia/publicSnapshot.test.ts](../../src/regia/publicSnapshot.test.ts) | Soltanto censito | 39 |  |
| [src/regia/regiaStore.test.ts](../../src/regia/regiaStore.test.ts) | Soltanto censito | 16 |  |
| [src/save/durableWrites.test.ts](../../src/save/durableWrites.test.ts) | Soltanto censito | 168 |  |
| [src/save/experiencePersistence.test.ts](../../src/save/experiencePersistence.test.ts) | Soltanto censito | 127 |  |
| [src/save/gameBackup.test.ts](../../src/save/gameBackup.test.ts) | Lettura parziale | 292 | titoli test e scenari indicizzati, non letti tutti gli assert |
| [src/save/instanceIdentity.test.ts](../../src/save/instanceIdentity.test.ts) | Soltanto censito | 71 |  |
| [src/save/restoreJournal.test.ts](../../src/save/restoreJournal.test.ts) | Lettura parziale | 89 | titoli test e scenari indicizzati |
| [src/scenes/__tests__/EvoluzioneScene.test.tsx](../../src/scenes/__tests__/EvoluzioneScene.test.tsx) | Soltanto censito | 67 |  |
| [src/scenes/__tests__/LaboratorioScene.test.tsx](../../src/scenes/__tests__/LaboratorioScene.test.tsx) | Soltanto censito | 68 |  |
| [src/scenes/__tests__/PercorsoScene.test.tsx](../../src/scenes/__tests__/PercorsoScene.test.tsx) | Soltanto censito | 55 |  |
| [src/scenes/__tests__/secretLocation.test.tsx](../../src/scenes/__tests__/secretLocation.test.tsx) | Soltanto censito | 118 |  |
| [src/session/sessionCoordinator.test.ts](../../src/session/sessionCoordinator.test.ts) | Lettura parziale | 229 | titoli test e scenari indicizzati |
| [src/settings/gamePreferences.test.ts](../../src/settings/gamePreferences.test.ts) | Soltanto censito | 23 |  |
| [src/shop/__tests__/itemEffects.test.ts](../../src/shop/__tests__/itemEffects.test.ts) | Soltanto censito | 60 |  |
| [src/shop/__tests__/purchase.test.ts](../../src/shop/__tests__/purchase.test.ts) | Soltanto censito | 172 |  |
| [src/store/__tests__/battleSettlement.test.ts](../../src/store/__tests__/battleSettlement.test.ts) | Soltanto censito | 129 |  |
| [src/store/__tests__/cagliariFoggiaReference.test.ts](../../src/store/__tests__/cagliariFoggiaReference.test.ts) | Soltanto censito | 192 |  |
| [src/store/__tests__/durableTransactions.test.ts](../../src/store/__tests__/durableTransactions.test.ts) | Lettura parziale | 342 | titoli test e scenari indicizzati |
| [src/store/__tests__/gameStore.test.ts](../../src/store/__tests__/gameStore.test.ts) | Soltanto censito | 208 |  |
| [src/store/__tests__/localMaps.test.ts](../../src/store/__tests__/localMaps.test.ts) | Soltanto censito | 204 |  |
| [src/store/__tests__/newGameFeatures.test.ts](../../src/store/__tests__/newGameFeatures.test.ts) | Soltanto censito | 325 |  |
| [src/store/__tests__/overworld.test.ts](../../src/store/__tests__/overworld.test.ts) | Soltanto censito | 380 |  |
| [src/store/__tests__/routeTorinoReferences.test.ts](../../src/store/__tests__/routeTorinoReferences.test.ts) | Soltanto censito | 201 |  |
| [src/store/__tests__/saveRecovery.test.ts](../../src/store/__tests__/saveRecovery.test.ts) | Soltanto censito | 96 |  |
| [src/store/__tests__/secretLocation.test.ts](../../src/store/__tests__/secretLocation.test.ts) | Soltanto censito | 205 |  |
| [src/store/__tests__/sixCityReferences.test.ts](../../src/store/__tests__/sixCityReferences.test.ts) | Soltanto censito | 174 |  |
| [src/store/__tests__/starterSelection.test.ts](../../src/store/__tests__/starterSelection.test.ts) | Soltanto censito | 96 |  |
| [src/store/__tests__/veneziaReference.test.ts](../../src/store/__tests__/veneziaReference.test.ts) | Soltanto censito | 101 |  |
| [src/store/adminStore.test.ts](../../src/store/adminStore.test.ts) | Soltanto censito | 363 |  |
| [src/theme/__tests__/depositLayoutMigration.test.ts](../../src/theme/__tests__/depositLayoutMigration.test.ts) | Soltanto censito | 67 |  |
| [src/theme/applyAdminTheme.test.ts](../../src/theme/applyAdminTheme.test.ts) | Soltanto censito | 44 |  |
| [src/ui-studio/battleLayout.test.ts](../../src/ui-studio/battleLayout.test.ts) | Soltanto censito | 39 |  |
| [src/ui-studio/designModel.test.ts](../../src/ui-studio/designModel.test.ts) | Soltanto censito | 46 |  |
| [src/ui-studio/hpAssetSkin.test.ts](../../src/ui-studio/hpAssetSkin.test.ts) | Soltanto censito | 26 |  |
| [src/ui-studio/mediaStorage.test.ts](../../src/ui-studio/mediaStorage.test.ts) | Soltanto censito | 89 |  |
| [src/ui-studio/runtimeDesign.test.ts](../../src/ui-studio/runtimeDesign.test.ts) | Soltanto censito | 18 |  |
| [src/ui-studio/runtimePolicy.test.ts](../../src/ui-studio/runtimePolicy.test.ts) | Soltanto censito | 20 |  |
| [src/ui-studio/studioStore.test.ts](../../src/ui-studio/studioStore.test.ts) | Soltanto censito | 53 |  |
| [src/utils/__tests__/audioScheduler.test.ts](../../src/utils/__tests__/audioScheduler.test.ts) | Soltanto censito | 58 |  |
| [src/utils/__tests__/mainMapRoadGeometry.test.ts](../../src/utils/__tests__/mainMapRoadGeometry.test.ts) | Soltanto censito | 37 |  |
| [src/utils/__tests__/soundManager.test.ts](../../src/utils/__tests__/soundManager.test.ts) | Soltanto censito | 155 |  |
| [src/utils/assetUrl.test.ts](../../src/utils/assetUrl.test.ts) | Soltanto censito | 28 |  |
| [src/utils/prepareImageAsset.test.ts](../../src/utils/prepareImageAsset.test.ts) | Soltanto censito | 113 |  |
| [src/utils/spritePageCache.test.ts](../../src/utils/spritePageCache.test.ts) | Soltanto censito | 86 |  |

## test-support-or-fixture

| File | Stato | Righe fisiche | Ambito |
|---|---|---:|---|
| [src/audience/__tests__/fixtures.ts](../../src/audience/__tests__/fixtures.ts) | Soltanto censito | 34 |  |
| [src/challenges/__fixtures__/classicSessionsV1.json](../../src/challenges/__fixtures__/classicSessionsV1.json) | Soltanto censito | 145 |  |
| [src/data/__tests__/fixtures/cagliariReference.ts](../../src/data/__tests__/fixtures/cagliariReference.ts) | Soltanto censito | 112 |  |
| [src/data/__tests__/fixtures/foggiaReference.ts](../../src/data/__tests__/fixtures/foggiaReference.ts) | Soltanto censito | 167 |  |
| [src/data/__tests__/fixtures/routeTorinoReferences.json](../../src/data/__tests__/fixtures/routeTorinoReferences.json) | Soltanto censito | 4122 |  |
| [src/data/__tests__/fixtures/sixCityReferences.json](../../src/data/__tests__/fixtures/sixCityReferences.json) | Soltanto censito | 3893 |  |
| [src/data/__tests__/fixtures/veneziaReference.ts](../../src/data/__tests__/fixtures/veneziaReference.ts) | Soltanto censito | 53 |  |

## Confini

La copertura non implica osservazione nel browser, test superati o validazione del backend. La categoria test-support-or-fixture comprende i dati dei test; i file di test nominati sono separati. Le altre pipeline/configurazioni lette sono elencate nei rapporti principali; questa tabella riguarda soltanto `src`.
