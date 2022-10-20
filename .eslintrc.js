module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["standard-with-typescript", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  // temporary
  ignorePatterns: ["examples"],
  rules: {
    // temporary, until we clean up types
    "@typescript-eslint/strict-boolean-expressions": "off",
  },
};
