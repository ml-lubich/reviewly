import nextConfig from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Allow unused vars when prefixed with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow explicit any in test files (warn in src)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow empty interfaces for component prop types
      "@typescript-eslint/no-empty-object-type": "off",
      // Supabase clients use env.ts validated accessors, not raw assertions
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Allow window.location.href navigation in event handlers
      // and setMounted(true) in hydration-safety effects (common React patterns)
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Relax rules for test files
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    ignores: [".next/", "node_modules/", "coverage/"],
  },
];
