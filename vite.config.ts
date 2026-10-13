// GitHub Pages static deployment for Concurso Central.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/concourse-buddy-pro/",
  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: true,
      autoSubfolderIndex: true,
      autoStaticPathsDiscovery: true,
      crawlLinks: true,
      failOnError: true,
    },
  },
});
