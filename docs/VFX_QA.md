# VFX QA

## Controlli automatici

```powershell
npm test
npm run build
$env:GITHUB_PAGES='true'; npm run build
```

## Gallery asset

1. Avviare `npm run dev`.
2. Aprire `http://localhost:3000/#vfx-lab`.
3. Provare ogni asset con replay, lati A/B e anchor disponibili.
4. Verificare che sprite sheet e GIF non vengano tagliati e che il fallback resti leggibile.

## Battaglia

1. Usare almeno una mossa offensiva per lato A e lato B.
2. Usare una cura e controllare che l'effetto appaia sul Pokemon che la esegue.
3. Ripetere la stessa GIF due volte e verificare che riparta dall'inizio.
4. Controllare che il feedback di impatto coincida con il contatto visivo.

## Admin

1. Aprire la modalita admin e scegliere la scheda `VFX`.
2. Cambiare asset, scala, offset, durata, anchor, layer, mirror e blend mode.
3. Usare replay e lati A/B nella preview.
4. Avviare una battaglia e verificare che l'override temporaneo venga applicato.
5. Copiare l'export JSON prima del refresh se la configurazione va conservata.

## Mobile e accessibilita

1. Provare una viewport larga al massimo `640px`: gli effetti devono risultare ridotti.
2. Attivare `prefers-reduced-motion`: gli effetti devono restare comprensibili senza movimento esteso.
