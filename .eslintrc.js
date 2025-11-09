module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
    env: {
        node: true,
        browser: true,
    },
    extends: ["eslint:recommended"],
    ignorePatterns: [
        "**/__tests__/**",
        "*.test.ts",
        "dist/**",
        "node_modules/**",
    ],
    rules: {
        "no-console": ["warn", { allow: ["error"] }],
        "no-unused-vars": "error",
    },
};
