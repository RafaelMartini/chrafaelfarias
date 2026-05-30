// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Deploy na Vercel: força o Nitro com o preset "vercel" e direciona a saída para
  // a estrutura .vercel/output (Build Output API), que a Vercel detecta automaticamente.
  // O wrapper Lovable, por padrão, joga a saída em dist/ — por isso sobrescrevemos os
  // diretórios aqui. Para outro alvo, ajuste o preset/saída ou use a env NITRO_PRESET.
  nitro: {
    preset: process.env.NITRO_PRESET || "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    },
  },
});
