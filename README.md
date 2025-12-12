# Florida Man: A Data Story

Static site that walks through a cleaned set of Florida Man headlines: where they came from, how they were tagged, and how they’re rendered in the browser. Built with D3 + Scrollama; everything runs client-side once `data.js` is present.

## Data Sources
- Kaggle base: [`r/FloridaMan` dataset](https://www.kaggle.com/datasets/bcruise/reddit-rfloridaman/data).
- Fresh scrape: Reddit JSON API + Pushshift for newer posts.
- HTML fallback: BeautifulSoup for pages the APIs miss.

## Processing (Python)
1. Load Kaggle + new scrape, drop obvious dupes, keep a single `headline`, `date`, `source_url`, and `location_hint`.
2. Parse dates, coerce to ISO. Anything unparseable is dropped from time-based charts.
3. Trope flags (`has_animals`, `has_nudity`, `has_substances`, `has_weapons`) set from the scraper; regex patterns in `app.js`/notebook are the single source of truth.
4. Location cleanup: keep raw `location_hint`; optional county rollups happen later in the browser.
5. Export to `data.js` as `const floridaManData = [...]` (all strings/booleans).

The working notebook for this pass lives in `florida-man-WIP.ipynb`; the final export is `data.js`.

## Frontend
- `index.html`: Scroll-driven narrative steps; SVG containers for each viz; footnotes; footer.
- `styles.css`: Palette, typography, layout; Florida paper look; smaller footer.
- `app.js`: All charts (bars, lines, area, donut, county choropleth), text narratives, mugshot belt. Uses D3 v7 + Scrollama. City→county rollups for the map live here.
- `data.js`: The dataset blob (generated).
- `mugshots/`: PNG assets for the moving belt.

## Refreshing Data
1. Re-run the Python notebook/scrape to regenerate the merged dataset.
2. Export to `data.js` as `const floridaManData = [...]`.
3. Open `index.html` in a browser; no build step needed.

## Project Layout
```
florida-man-website/
  index.html      # content + sections
  styles.css      # styling
  app.js          # D3 + Scrollama logic, narratives, map rollups
  data.js         # generated dataset
  mugshots/       # belt assets
  florida-counties.geojson  # local county shapes for the map
florida-man-WIP.ipynb        # data prep notebook
```

## Notes
- Location extraction is imperfect; headlines without a place stay as “Florida”.
- County map colors are driven by county counts plus city rollups (see `CITY_TO_COUNTY` in `app.js`).
- Everything is static; no tracking, no backend.
>>>>>>> afd4b63 (initial commit)
