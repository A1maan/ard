<img src="frontend/public/ard-logo.png" alt="ARD Logo" width="220" />

# ARD Soil Intelligence Dashboard

ARD (Arabic for “earth/land”) is a soil-intelligence platform designed for growers, construction crews, and dispatch teams who need the same situational awareness of micro-regions across the United States. The project visualizes county-level telemetry—moisture, organic content, compaction, coverage, uptime, and energy stats—and pairs it with workflows for field operations:

- **Growers** can inspect counties, watch soil-health indicators, and decide when to irrigate, plant, or rotate crops.
- **Construction teams** can see which zones are safe for heavy equipment, where the ground needs remediation, and how many active sites exist per corridor.
- **Dispatch/command** can zoom into any region, read the KPIs, narrative summary, and signal shortlist, then reassign crews or assets based on real conditions.

The interactive map, KPI cards, “signals to watch,” and narrative insight offer a single-pane view so teams can coordinate across agriculture and infrastructure projects without juggling multiple dashboards.

## Frontend preview

- **Base URL (development):** `npm run dev` inside `frontend/`
- **Home page:** [http://localhost:3000/](http://localhost:3000/)  
  Interactive US map with county-level hover/click, zoom/pan, KPI cards, signal list, and narrative insight.
- **About page:** [http://localhost:3000/about](http://localhost:3000/about)  
  Explains the mission, highlights key telemetry/operations workflows, and links back to the dashboard.
- **Soil Prediction Map:** [http://localhost:3000/soil_points](http://localhost:3000/soil_points)
  Visualizes **ML model predictions** (e.g., soil organic carbon, pH) as GeoJSON points fetched from the FastAPI backend. Click a point to view the full scrollable details panel.

## Tech stack

- **Next.js 16** with the App Router (`frontend/app`)
- **React 19** for UI, client components where needed for interactivity
- **Tailwind CSS (v4)** via the new `@import "tailwindcss"` approach in `globals.css`
- **D3 (geo, zoom, selection)** plus `topojson-client` and `us-atlas` for rendering the county-level SVG map

## Running locally

```bash
cd frontend
npm install     # installs D3, topojson, us-atlas, etc.
npm run dev     # http://localhost:3000
npm run lint    # TypeScript/ESLint checks
```
### Step 2: Run the Backend (Data API)

The backend loads the heavy ML model and feature data, so it must be started separately.

1.  **Navigate to the backend directory:**
    ```bash
    cd [Your Project Root, e.g., ard/Model_and_Results]
    ```
    *Ensure your Python virtual environment is active: (`.venv`)*

2.  **Start the Uvicorn server:**
    ```bash
    python -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
    ```
    *The API is running on `http://0.0.0.0:8000`*

3.  **API Endpoint:**
    * The frontend consumes data from `http://0.0.0.0:8000/api/samples`.

*Note: If you modify the prediction logic or the model in* `api_server.py`*, you must manually stop and restart the Uvicorn process.*


## Structure

- `frontend/app/page.tsx` – home dashboard with the zoomable SVG map, metrics panels, signal list, and narrative.
- `frontend/app/about/page.tsx` – about page content (header reused via `components/AppHeader.tsx`).
- `frontend/app/layout.tsx` – wraps every page with fonts and a shared footer.
- `frontend/components/AppHeader.tsx` – logo + nav + optional action button.
- `frontend/app/globals.css` – Tailwind + light soil-themed palette.

## Customizing

- **Metrics:** `PRESET_METRICS` in `app/page.tsx` seeds data for featured counties. Replace with API calls or realtime feeds for production.
- **Signals list:** `SIGNAL_REGIONS` controls the right-hand “Signals to watch” shortlist.
- **About content:** edit `HIGHLIGHTS` and paragraphs in `app/about/page.tsx`.
