module.exports = {
    "extends": [
        "eslint:recommended",
        'plugin:react/recommended',
        "plugin:flowtype/recommended"
    ],
    env: {
        es6: true,
        browser: true,
        node: true
    },
    "parser": "@babel/eslint-parser",
    plugins: [
        "flowtype",
        'react'
    ],
    "parserOptions": {
        requireConfigFile: false,
        "ecmaFeatures": {
            "jsx": true,
            "modules": true
        }
    },
    'globals': {
        'fetch': false,
        document: false,
        ready: false,
        MouseEvent: false,
        KeyboardEvent: false,
        UIEvent: false,
        FormData: false,
        window: false
    },
    "rules": {
        'quotes': ['error', 'single', {allowTemplateLiterals: true}],
        'no-extra-semi': 0,
        'no-case-declarations': 0,
        'react/prop-types': 0
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};
