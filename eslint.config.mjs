import eslintConfigXo from 'eslint-config-xo';

export default [
  // Keep the established source filename while retaining the maintained XO rules.
  ...eslintConfigXo({gitignore: import.meta.url, prettier: true}),
  {rules: {
    'unicorn/filename-case': ['error', {case: 'snakeCase'}],
    'n/prefer-global/process': ['error', 'always'],
  }},
];
