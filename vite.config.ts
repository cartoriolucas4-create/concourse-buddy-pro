// GitHub Pages deployment configuration for Concurso Central.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/concourse-buddy-pro/",
  tanstackStart: {
    server: { entry: "server" },
  },
});
