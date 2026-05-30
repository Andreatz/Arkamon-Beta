# Arkamon move VFX assets

Drop the final transparent assets into these runtime paths:

```txt
slash/slash_60fps.png
thrust/thrust_60fps.png
punch/punch_60fps.png
buff/buff_60fps.png
debuff/debuff_60fps.png
shimmer/shimmer_60fps.png
cure/cure_60fps.png
shield/shield_60fps.png
barrier/barrier_60fps.png
burst/burst_60fps.png
confuse/confuse.gif
cure/cure.gif
punch/guts_punch.gif
break/guard_break.gif
water/water_01.gif
energy/energy_11.gif
energy/lightning_01.gif
burst/fire_01.gif
burst/fire_05.gif
burst/fire_08.gif
burst/fire_12.gif
confuse/psychic_01.gif
confuse/psychic_02.gif
debuff/poison_01.gif
water/water_03.gif
```

The game resolves these files at runtime through `assetUrl`. Missing assets
fall back to a lightweight CSS impact effect and do not block battle turns.
