# Roam v1.0 — specification

## Core model

A trip is a **chain of nodes connected by edges**.

- **Node** — a place (where you are)
- **Edge** — movement between places (how you get there)
- Both carry **properties** via `|`

```
node | props > edge | props > node | props > edge | props > node | props
```

---

## Primitives

| Sigil | Meaning | Example |
|-------|---------|---------|
| `>`   | Edge (transport mode follows immediately) | `> train` |
| `\|`  | Property separator | `node \| @timestamp \| $cost` |
| `@`   | Timestamp — **full date+time required** | `@01.01.2026::10:00` |
| `$`   | Cost — `amount\currency` + optional `:label` + optional `?` for optional costs | `$15\ils`, `~$25\eur:tour?` |
| `#`   | Tag, or GPS with `#loc(lat,lng)` | `#must-see`, `#loc(31.77,35.23)` |
| `?`   | Note (free text) or link with `?link:url` | `? book ahead`, `?link:tickets.com` |
| `##`  | Day header | `## @01.01.2026 "Arrival day"` |

---

## Timestamp semantics

- `@` on a **node** = **arrival time**
- `@` on an **edge** = **departure time**

This means durations are always derivable — no extra syntax needed:

```
... > walk > hotel | @01.01.2026::22:00 > bus | @02.01.2026::10:00 > ...
```

- Time at hotel = `10:00 (Jan 2) − 22:00 (Jan 1)` = **10h** (per the derivation rule: next edge departure − node arrival)
- Bus departure = `10:00` — no arrival needed to know when you leave

---

## Derived data (calculated, never written)

| What | How |
|------|-----|
| Duration at a place | next edge `@` − node `@` |
| Travel time | next node `@` − edge `@` |
| Distance | haversine of `#loc` coords |
| Speed | distance ÷ travel time |
| Total cost | sum of all `$` values |
| Day boundaries | wherever date part of `@` increments |

---

## Format rules

- **Multiline is canonical** — indent each `>` edge onto its own line for readability
- **One-liners are valid** for simple chains
- **Quoted strings** for place names with spaces: `"Central Park"`
- **Bare words** for simple names: `home`, `cafe`
- Tilde `~` on cost = approximate: `~$20\eur`
- `:label` on cost = named breakdown: `$18\eur:entrance`
- Trailing `?` on cost = optional item: `~$12\eur:tour?`
- Multiple costs on one node are allowed: `$18\eur:entrance | $6\eur:audio-guide | ~$12\eur:tour?`
- `$0` or omit cost entirely for free entries

---

## Full example

```
## @10.01.2026 "Outbound"

home | #loc(32.08,34.78) | @10.01.2026::08:30
  > train | $22\ils
  > "Jerusalem central" | #loc(31.78,35.20) | @10.01.2026::10:10
  > walk
  > "Jaffa Gate" | #loc(31.77,35.22) | @10.01.2026::10:30 | $0
  > walk
  > "Abu Shukri" | @10.01.2026::13:30 | ~$15\ils | ? eat standing at the counter
  > walk | @10.01.2026::15:30
  > "Ramparts Walk" | @10.01.2026::15:45 | $8\ils | ?link:parks.org.il/ramparts
  > walk
  > "Legacy Ottoman Hotel" | #loc(31.78,35.22) | @10.01.2026::22:00 | $280\ils
  > walk | @11.01.2026::08:00
  > "Mount of Olives" | #loc(31.77,35.24) | @11.01.2026::08:20 | $0 | ? go early — best light
  > bus | $5\ils | @11.01.2026::10:30
  > "Yad Vashem" | #loc(31.77,35.17) | @11.01.2026::11:00 | $0 | ?link:yadvashem.org/visit
```

---

## What the parser derives for free

From the example above, no extra annotations needed:

- Hotel stay duration: **10h** (22:00 → 08:00, per the rule: next edge departure − node arrival)
- Walk from hotel to Mount of Olives: **20 min**
- Bus travel time: **30 min** (10:30 departure → 11:00 arrival)
- Distance hotel → Mount of Olives: ~**2.2 km** (from `#loc` coords; distanceToNext = haversine to nearest subsequent node with location)
- Distance Mount of Olives → Yad Vashem: ~**6.6 km**
- Day 1 total cost: **~₪325**
