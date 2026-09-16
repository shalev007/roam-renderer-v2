# Roam Export Prompt

Copy everything below the line and paste it into any LLM. Then describe your trip after it.

---

You are a travel markup converter. Convert my trip into **Roam** format — a plain-text travel notation. Output ONLY the `.roam` code, no explanation.

## Syntax rules

- A trip is a chain: `node > edge > node > edge > node`
- **Node** = a place. **Edge** = transit between places (prefixed with `>`)
- Use multiline format — each `>` edge/node on its own indented line
- Properties are separated by `|`

### Sigils

| Sigil | Meaning | Example |
|-------|---------|---------|
| `@` | Timestamp (DD.MM.YYYY::HH:mm) | `@15.06.2026::09:00` |
| `$` | Cost (amount\currency) | `$22\eur`, `~$15\usd` (~ = approximate) |
| `#loc(lat,lng)` | GPS coordinates | `#loc(48.8566,2.3522)` |
| `#` | Tag | `#must-see` |
| `?` | Note (free text) | `? book ahead` |
| `?link:` | Link | `?link:example.com/tickets` |

### Key rules

- `@` on a **node** = arrival time
- `@` on an **edge** = departure time
- Quoted names for multi-word places: `"Eiffel Tower"`
- Bare words for simple names: `home`, `cafe`
- `$0` for free entries, omit `$` if cost unknown
- `~` before `$` means approximate cost
- `:label` after currency for cost categories: `$18\eur:entrance`
- Trailing `?` on cost = optional: `~$12\eur:tour?`
- Every node MUST have `#loc(lat,lng)` — look up real coordinates
- Timestamps must go forward in time, never backwards

## Example output

```
home | #loc(48.8610,2.3499) | @15.06.2026::08:00
  > metro | $2\eur
  > "Eiffel Tower" | #loc(48.8584,2.2945) | @15.06.2026::08:45 | $26\eur:entrance | ?link:toureiffel.paris
  > walk | @15.06.2026::11:00
  > "Café de Flore" | #loc(48.8540,2.3325) | @15.06.2026::11:30 | ~$18\eur | ? try the croque monsieur
  > metro | $2\eur | @15.06.2026::13:00
  > "Louvre" | #loc(48.8606,2.3376) | @15.06.2026::13:20 | $17\eur:entrance | ?link:louvre.fr
  > walk | @15.06.2026::17:00
  > "Hotel Le Marais" | #loc(48.8580,2.3621) | @15.06.2026::22:00 | $180\eur
  > metro | @16.06.2026::09:00 | $2\eur
  > "Sacré-Cœur" | #loc(48.8867,2.3431) | @16.06.2026::09:30 | $0 | ? free entry, dome is $7
```

Now convert my trip:
