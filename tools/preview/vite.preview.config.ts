// Versão de PRÉ-VISUALIZAÇÃO, usada só nos testes automáticos (não é publicada).
// Troca o Firebase por um usuário de teste; os dados vêm de window.__FIXTURE__,
// definido pelo script de teste antes de abrir a página. Nada é lido nem gravado na nuvem.
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const STUB = path.resolve(HERE, 'firebase-stub.ts');

export default defineConfig({
  root: ROOT,
  base: './',
  define: { __APP_BUILD_ID__: JSON.stringify('preview') },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'preview-firebase-stub',
      enforce: 'pre',
      resolveId(source, importer) {
        if (importer && importer.includes(`${path.sep}src${path.sep}`) && source.startsWith('.') && /(^|\/)firebase$/.test(source)) {
          return STUB;
        }
        return null;
      }
    }
  ],
  resolve: { alias: { '@': ROOT } },
  build: { outDir: path.resolve(HERE, 'dist'), emptyOutDir: true }
});
