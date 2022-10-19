module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: 'standard-with-typescript',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    // temporary, until we clean up types
    '@typescript-eslint/strict-boolean-expressions': 'off',
    "space-before-function-paren": ["error", {
      "anonymous": "always",
      // stupid rule, https://github.com/standard/standard/issues/318#issuecomment-172366283
      "named": "never",
      "asyncArrow": "always"
    }],
    'comma-dangle': ['error', 'always-multiline'],
  },
}
