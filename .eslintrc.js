module.exports = {
  extends: ['jammeryhq-node-ts'],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 0
  }
}
