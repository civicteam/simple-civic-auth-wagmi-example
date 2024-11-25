import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {
      CLIENT_ID: "my-client",
    },
  },
  server: {
    port: 3000,
  },
});
