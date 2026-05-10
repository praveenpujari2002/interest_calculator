# Interest Calculator

A beautiful, monthly-based interest calculator with Simple & Compound interest calculations, deployed on Vercel.

## Features

- **4 Calculation Modes:**
  1. Simple Interest – Floor (months)
  2. Compound Interest – Floor (months)
  3. Simple Interest – Ceil (months)
  4. Compound Interest – Ceil (months)

- **Exact Month Calculation:** Computes fractional months from any start/end date, then provides both floor and ceiling values
- **Year-by-Year Breakdown:** Detailed table showing how interest accumulates per year
- **Live Duration Badge:** Shows exact/floor/ceil months as you change dates
- **Formula Display:** Shows the exact formula applied for each calculation

## How It Works

### Month Calculation
Given start date and end date:
- **Exact months** = whole months + fractional days (day fraction relative to the partial month's days)
- **Floor months** = `Math.floor(exactMonths)` – conservative estimate
- **Ceil months**  = `Math.ceil(exactMonths)` – upper-bound estimate

### Simple Interest
```
SI = P × (r/12) × n
```
Where `r` is annual rate (decimal), `n` is number of months.

### Compound Interest (Monthly compounding)
```
A = P × (1 + r/12)^n
CI = A - P
```

## Deployment

This is a pure static site — no build step needed.

### Vercel
1. Push this folder to a GitHub repo
2. Import to Vercel
3. Done! Vercel auto-detects static HTML

Or via CLI:
```bash
npm i -g vercel
vercel --prod
```

## Tech Stack
- HTML5, CSS3 (vanilla), JavaScript (vanilla)
- Google Fonts: Inter + JetBrains Mono
- No dependencies, no build step
