module.exports = {
  "env": {
    "commonjs": true,
    "es6": true,
    "node": true,
    "mocha": true,
    "browser": false
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
    "ecmaVersion": 2018
  },
  "rules": {
    'spaced-comment': 'error'
  },

  "plugins": [
    "mocha"
  ]
};
