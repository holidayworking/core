import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", ".git/**", ".direnv/**"],
  },
  lint: {
    ignorePatterns: ["apps/hugo/themes/congo/**"],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: [
      ".claude/settings.local.json",
      "apps/hugo/layouts/_partials/functions/warnings.html",
      "apps/hugo/themes/congo/**",
      "apps/radicast/lib/config.json",
    ],
    sortImports: {
      groups: [
        "type-import",
        ["value-builtin", "value-external"],
        "type-internal",
        "value-internal",
        ["type-parent", "type-sibling", "type-index"],
        ["value-parent", "value-sibling", "value-index"],
        "unknown",
      ],
    },
  },
  run: {
    cache: true,
  },
});
