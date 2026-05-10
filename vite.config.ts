import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {},
  lint: {
    ignorePatterns: ["apps/hugo/themes/congo/**"],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: [
      "apps/hugo/layouts/_partials/functions/warnings.html",
      "apps/hugo/themes/congo/**",
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
