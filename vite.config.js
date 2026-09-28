import {defineConfig} from 'vite';
export default defineConfig({esbuild:{jsxFactory:'localizedJsx',jsxFragment:'React.Fragment',jsxInject:'import { localizedJsx } from "/src/locale-jsx.js";'}});
