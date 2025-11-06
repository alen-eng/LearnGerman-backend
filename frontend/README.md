German Vocab Frontend

This is a tiny static frontend that POSTs to your backend endpoint (the repository's `api/enrich.js`) and displays the structured response.

How it works
- Open `frontend/index.html` in a browser OR serve the `frontend/` directory with a static server.
- By default the page sends POST to `/api/enrich`. If your backend is on a different origin, update the "Backend endpoint" input to the full URL (for example `https://my-deploy.vercel.app/api/enrich`).

Important notes
- The backend expects a JSON POST body: `{ "word": "..." }` and returns JSON with keys `correctedGerman`, `englishTranslation`, and `examples`.
- If the backend is hosted on a different origin, make sure it allows CORS from your frontend origin.

Quick ways to serve the frontend folder (PowerShell examples)

# If you have Node and "http-server" installed globally
npx http-server frontend -p 5000

# Or with Python 3
python -m http.server 5000 --directory frontend

Then open http://localhost:5000 in your browser and use the page.

If you need me to wire this into the backend project (serve statically from the app or add a small dev server), tell me and I'll update the repository accordingly.