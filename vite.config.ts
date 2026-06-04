// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Alvo de deploy controlado por NITRO_PRESET:
//   - "vercel" (padrão): Build Output API em .vercel/output (detectado pela Vercel)
//   - "node-server" (Railway/qualquer Node host): servidor standalone em dist/server/index.mjs
//     Inicie com: node dist/server/index.mjs  (respeita a env PORT)
const preset = process.env.NITRO_PRESET || "vercel";

const nitro =
  preset === "vercel"
    ? {
        preset: "vercel",
        // O wrapper Lovable joga a saída em dist/ por padrão — sobrescrevemos para a
        // estrutura que a Vercel detecta automaticamente.
        output: {
          dir: ".vercel/output",
          serverDir: ".vercel/output/functions/__server.func",
          publicDir: ".vercel/output/static",
        },
      }
    : { preset };

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro,
});
