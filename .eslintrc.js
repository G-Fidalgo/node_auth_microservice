module.exports = {
    "env": {
        "browser": false,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "prettier",
        "airbnb-typescript/base",
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "prettier"
    ],
    "rules": {
        "prettier/prettier": "error",
        "comma-dangle": ["error", "never"],
        "arrow-parens": ["error", "as-needed"],
        "import/prefer-default-export": "off",
        "operator-linebreak": "off",
        "max-len": ["warn", {"code": 120 }],
        "import/no-extraneous-dependencies": "off"
    }
};
