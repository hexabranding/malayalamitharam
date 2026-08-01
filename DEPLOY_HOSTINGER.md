# Hostinger VPS deployment

The API needs a Hostinger VPS. It runs Express, MongoDB, and uploads; standard Web, WordPress, and Cloud hosting plans do not provide the required Node.js/root environment. The React frontend can be hosted separately as static files.

1. Create a VPS with the Hostinger Node.js/OpenLiteSpeed template and point `api.malayalamitharam.in` to the VPS.
2. Connect through SSH and upload or clone the `backend` folder outside the public web root.
3. Install Node.js 20.19 or later, then run `npm ci --prefix backend`.
4. On the VPS, create `backend/.env` with `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL=https://demo.malayalamitharam.in`, and an `ADMIN_INITIAL_PASSWORD` only for a new database. Do not upload `.env` to Git.
5. Start the API from the `backend` folder with PM2:

   ```bash
   npm install -g pm2
   pm2 start server.js --name malayalamithram-api
   pm2 save
   pm2 startup
   ```

6. Configure OpenLiteSpeed or Nginx to proxy `api.malayalamitharam.in` to `http://127.0.0.1:4000`, enable HTTPS, and preserve `/uploads` and `/api` paths.
7. On the frontend deployment machine, set `VITE_API_URL=https://api.malayalamitharam.in/api`, run `npm ci && npm run build`, and upload the resulting `dist` folder to `demo.malayalamitharam.in`.
8. Verify `https://api.malayalamitharam.in/api/health`, visit `https://demo.malayalamitharam.in`, log in to `/admin`, create a test article, reload it, and confirm the record appears in MongoDB.

Uploads are stored on the VPS at `backend/uploads`. Back up that directory as well as MongoDB. For multiple web servers, move uploads to object storage before scaling.
