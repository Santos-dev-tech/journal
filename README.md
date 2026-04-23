# 📈 Trade Journal — Performance Dashboard

A sleek, dark-themed trading performance tracker built with vanilla HTML, CSS, and JavaScript.

## Features

- **Monthly performance cards** — TP, SL, PTP, PTPA, LA, WA counts with proportional bars and win-rate badges  
- **3 live charts** — Monthly pips, TP vs SL grouped bar, all-time trade breakdown donut  
- **Summary bar** — Total pips, win rate, best month, total trades, losses avoided, wins avoided  
- **⚡ God Mode** — Toggle edit mode (`Ctrl+G`) to add, edit or delete any month  
- **LocalStorage persistence** — All data survives page refresh  

## Terminology

| Code | Meaning |
|------|---------|
| TP   | Take Profit — trade closed in full profit |
| SL   | Stop Loss — trade closed at a loss |
| PTP  | Partial Take Profit — partial exit at profit |
| PTPA | Partials Avoided — partial exit that was missed |
| LA   | Losses Avoided — potential losses that were avoided |
| WA   | Wins Avoided — wins that were not taken |

## Usage

Open `index.html` directly in any browser, **or** serve with Python:

```bash
python -m http.server 7865
```

Then visit [http://localhost:7865](http://localhost:7865)

## Stack

- HTML5 + Vanilla CSS (glassmorphism dark theme)
- Vanilla JavaScript (no frameworks)
- [Chart.js 4.4](https://www.chartjs.org/) via CDN
- Google Fonts — Inter + JetBrains Mono

## Author

**Santos-dev-tech**
