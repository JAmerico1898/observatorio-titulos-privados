import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolve o alias "@/..." do tsconfig nativamente.
  resolve: { tsconfigPaths: true },
  test: {
    pool: "threads",
    projects: [
      {
        // Funções puras: transforms e formatação.
        extends: true,
        test: { name: "unit", environment: "node", include: ["tests/unit/**/*.test.ts"] },
      },
      {
        // Componentes de domínio.
        extends: true,
        test: {
          name: "componente",
          environment: "jsdom",
          setupFiles: ["tests/setup.ts"],
          include: ["tests/componente/**/*.test.tsx"],
        },
      },
      {
        // Consulta o CKAN e a API de dados do BCB ao vivo — precisa de rede.
        extends: true,
        test: {
          name: "metadados",
          environment: "node",
          include: ["tests/metadados/**/*.test.ts"],
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/lib/transforms/**", "src/lib/format.ts"],
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "coverage",
      // Limiar do eval "Cobertura de lib/transforms" (spec §7.2).
      thresholds: { lines: 80 },
    },
  },
});
