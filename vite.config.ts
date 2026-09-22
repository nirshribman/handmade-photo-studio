import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server:{watch:{ignored:['**/artifacts/**','**/test-results/**','**/.npm-cache/**','**/.browser/**','**/.tools/**','**/Sample/**','**/reference/**']}}, test: { include: ['tests/**/*.test.ts'] } } as Parameters<typeof defineConfig>[0]);
