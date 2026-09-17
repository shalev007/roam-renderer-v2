# Roam Renderer v0.2

Plain-text travel itinerary format + parser + viewer.

## What is Roam?

Roam is a `.roam` file format for describing trips as a chain of nodes (places) and edges (transport). Write in plain text, see your trip on a map with timeline and costs.

**Product bet**: AI itinerary verifier — paste or write `.roam` text and watch the trip update live, with honest per-currency costs and green tests.

## Features

- ✅ **Live editing**: side-by-side editor + viewer with debounced reparse
- ✅ **Honest costs**: per-currency aggregation (never mixes ₪ + € into one number)
- ✅ **Day headers**: `## @DD.MM.YYYY "Label"` for custom day names
- ✅ **Test-driven**: spec conformance and sample fixtures pass
- ✅ **Share trips**: `?roam=<base64>` URL parameter
- ✅ **Drop files**: drag & drop `.roam` files
- ✅ **Timeline view**: color-coded transport modes (walk, train, car, ferry, flight, bus)
- ✅ **Map markers**: straight-line distances, durations, costs

## Install & Run

```bash
npm install
npm run dev        # start Vite dev server
npm test           # run tests
npm run build:web  # build web app
```

Web app opens at http://localhost:5173

## Example

```roam
## @10.01.2026 "Jerusalem Day Trip"

home | #loc(32.08,34.78) | @10.01.2026::08:30
  > train | $22\ils
  > "Jerusalem central" | #loc(31.78,35.20) | @10.01.2026::10:10
  > walk
  > "Jaffa Gate" | #loc(31.77,35.22) | @10.01.2026::10:30 | $0
```

See `sample.roam`, `sample-2.roam`, or load the built-in sample in the UI.

## Format

- **Node**: place name | `#loc(lat,lng)` | `@DD.MM.YYYY::HH:mm` | `$amount\currency`
- **Edge**: `> mode` (walk, train, bus, car, ferry, flight, etc.)
- **Day header**: `## @DD.MM.YYYY "Label"`
- **Costs**: `$15\ils`, `~$20\eur:tour?` (tilde = approx, `?` = optional)
- **Notes**: `? free text` or `?link:url`

Full spec: see `roam_spec_v1.0.md`

For LLM export instructions: see `roam_prompt.md`

## CLI (WIP)

```bash
npm run build
node dist/cli/main.js sample.roam  # parse and validate
```

## Docker

```bash
docker-compose up --build
# opens on http://localhost:8080
```

## Out of scope

Auth, multi-user, real routing APIs, currency conversion FX rates, publishing npm package.

## License

MIT
