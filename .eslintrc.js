module.exports = {
  "env": {
    "commonjs": true,
    "es6": true,
    "node": true,
    "mocha": true,
    "browser": false,
    "es2020": true      // e.g. for BigInt
  },
  "extends": [
    "eslint:recommended",
    "plugin:mocha/recommended"
  ],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": 2020
  },
  "rules": {
    'spaced-comment': 'error'
  },

  "plugins": [
    "mocha"
  ]
};
