import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architecture rules are enforced here rather than documented and hoped for.
 * Each block below corresponds to a boundary described in the README.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
    name: "jofit/boundaries",
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // A feature is used through its public barrel, never by reaching
              // into its internals.
              group: ["@/features/*/*"],
              message:
                "Import a feature through its public barrel (@/features/<name>), not its internals.",
            },
            {
              // Mock fixtures are an implementation detail of the mock adapters.
              group: ["@/mocks/*", "@/mocks"],
              message:
                "Mock data may only be imported by a mock adapter (*.mock.ts) or by other mocks.",
            },
          ],
        },
      ],
    },
  },

  {
    // Shared infrastructure must not know about business domains.
    name: "jofit/infrastructure-is-domain-free",
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/lib/**/*.ts",
      "src/services/**/*.ts",
      "src/hooks/**/*.ts",
      "src/config/**/*.ts",
      "src/types/**/*.ts",
      "src/i18n/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features", "@/features/*", "@/features/*/*"],
              message:
                "Shared infrastructure must not depend on a business domain. Move this into the feature, or lift the shared part out of it.",
            },
            {
              group: ["@/mocks", "@/mocks/*"],
              message: "Shared infrastructure must not import mock data.",
            },
          ],
        },
      ],
    },
  },

  {
    // The only places allowed to read fixtures.
    name: "jofit/mock-adapters",
    files: ["src/mocks/**/*.ts", "src/features/*/services/*.mock.ts"],
    rules: { "no-restricted-imports": "off" },
  },

  {
    // Developer scripts run directly under Node as CommonJS.
    name: "jofit/node-scripts",
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },

  {
    // A contract parameter an adapter has no use for (e.g. the mock needs
    // `locale`/`customerId` to find fixtures; the HTTP adapter gets both from
    // the API/token instead) stays in the signature and is prefixed `_` —
    // that marks it as deliberately unused, not forgotten.
    name: "jofit/intentionally-unused-args",
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
