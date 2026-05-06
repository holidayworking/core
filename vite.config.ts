import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    passWithNoTests: true,
  },
  lint: {
    ignorePatterns: ["apps/hugo/themes/congo/**"],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: [
      "apps/hugo/layouts/_partials/functions/warnings.html",
      "apps/hugo/themes/congo/**",
    ],
  },
  run: {
    cache: true,
  },
});
