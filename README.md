# Berkeley Study Spot Finder

A student-made web app for browsing and filtering study spots around UC Berkeley campus. Not affiliated with or endorsed by UC Berkeley. Always verify hours, food policies, and outlet availability in person.

## Features

- Filter by noise, size, lighting, outlets, food policy, indoor/outdoor, and space type (with live counts)
- Search by name, building, or activity, shows closest matches if no spot fits every filter
- Hidden gems toggle, cards/list view, sort by name/building/noise/distance
- "Near me" (geolocation) and "Surprise me" (random pick)
- Campus map with pins per building
- Live weather banner
- Dark mode

## File structure

```
study-finder/
├── index.html
├── style.css
├── script.js
└── data/
    └── study-spots.json
```

To run locally: `python3 -m http.server` from the project root (opening `index.html` directly can break the data fetch in some browsers).

## Data sources

- [Berkeley Library website](https://www.lib.berkeley.edu/)
- Personal experience and casual on-campus research
- [Open-Meteo](https://open-meteo.com/) for weather

Treat spot details as a helpful starting point, not ground truth.

## Credits

Built with 🐻💙 by Noor E.
