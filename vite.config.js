import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import resolveMapLink from './api/resolve-map-link.js';

function mapLinkApi() {
  return {
    name: 'controltech-map-link-api',
    configureServer(server) {
      server.middlewares.use('/api/resolve-map-link', async (request, response, next) => {
        try {
          const requestUrl = new URL(request.url || '/', 'http://localhost');
          const query = Object.fromEntries(requestUrl.searchParams.entries());
          const apiResponse = {
            setHeader(name, value) {
              response.setHeader(name, value);
            },
            status(code) {
              response.statusCode = code;
              return this;
            },
            json(payload) {
              response.setHeader('Content-Type', 'application/json; charset=utf-8');
              response.end(JSON.stringify(payload));
              return this;
            }
          };
          await resolveMapLink({ method: request.method, query }, apiResponse);
        } catch (error) {
          next(error);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mapLinkApi()]
});
