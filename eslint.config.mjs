import { defineConfig } from 'eslint/config';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: compat.extends('eslint:recommended'),

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,

        babelOptions: {
          plugins: ['@babel/plugin-syntax-import-assertions'],
        },
      },
    },

    rules: {
      'prettier/prettier': ['error'],
      'no-unused-vars': 'off',
    },
  },
  eslintPluginPrettierRecommended,
]);
