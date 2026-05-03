import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/hotpot_tester/',
  plugins: [react()],
});
