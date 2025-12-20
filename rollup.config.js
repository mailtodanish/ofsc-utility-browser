// rollup.config.js (CJS)
const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const terser = require("@rollup/plugin-terser");

module.exports = {
  input: "src/index.ts",

  output: {
    file: "dist/ofsc-utilities-min.js",
    format: "umd",
    name: "OFSC",
    sourcemap: true
  },

  plugins: [
    resolve({
      browser: true,          // ✅ browser resolution
      preferBuiltins: false   // ✅ DO NOT use Node built-ins
    }),
    commonjs(),               // ✅ convert CJS → ESM
    typescript({
      tsconfig: "./tsconfig.json"
    }),
    terser()
  ]
};