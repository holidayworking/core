import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    passWithNoTests: true,
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {},
  run: {
    cache: true,
  },
});
