# Finanzas CRC

Progressive Web App para visualizar gastos personales en Colones Costarricenses (₡ CRC).

## Stack

- SvelteKit 2 + Svelte 5 (runes)
- TypeScript
- Tailwind CSS
- ECharts via `svelte-echarts`
- PapaParse para CSV
- `@vite-pwa/sveltekit` para PWA
- `@sveltejs/adapter-static` + GitHub Pages

## Scripts

```bash
npm run dev       # desarrollo
npm run build     # producción estática
npm run preview   # previsualizar build
npm run check     # chequeo de tipos
npm run lint      # ESLint
npm run format    # Prettier
```

## Fuente de datos

La app lee un CSV público de Google Sheets. La URL por defecto está en `src/lib/config.ts` y puede sobreescribirse desde la página de Configuración.

## Despliegue

El workflow `.github/workflows/deploy.yml` compila y publica automáticamente en GitHub Pages al hacer push a `main`.
