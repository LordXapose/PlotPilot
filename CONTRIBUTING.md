# Contributing to Data Analysis Toolkit

Thank you for your interest in contributing. This guide explains how to add a new module,
fix a bug, or improve documentation.

---

## Project structure

```
data-analysis-toolkit/
├── index.html                  The complete standalone web app
├── src/
│   ├── modules/                One JS file per analysis module
│   │   ├── explorer.js         Data loading and schema
│   │   ├── descriptive.js      Descriptive statistics
│   │   ├── visualizations.js   Chart rendering (Chart.js wrappers)
│   │   ├── distributions.js    Probability distributions
│   │   ├── inference.js        Hypothesis tests and CIs
│   │   ├── regression.js       Simple OLS regression
│   │   ├── multiRegression.js  Multiple OLS regression
│   │   ├── anova.js            ANOVA and Tukey HSD
│   │   ├── cleaning.js         Data cleaning and preprocessing
│   │   ├── timeseries.js       Time series analysis
│   │   ├── sampling.js         Sampling distributions and power
│   │   └── probability.js      Probability calculator
│   ├── utils/
│   │   ├── stats.js            Core statistical math
│   │   ├── csvParser.js        CSV parsing and type detection
│   │   └── formatters.js       Number formatting helpers
│   └── data/
│       └── sample_dataset.csv  Built-in demo dataset
├── docs/
│   └── user_guide.md           User documentation
└── .github/
    └── workflows/
        └── deploy.yml          GitHub Pages deployment
```

---

## How to add a new module

1. Create `src/modules/yourModule.js` — export pure functions only (no DOM access).
   Follow the existing pattern: JSDoc comments, named exports, import from utils.

2. Add a new tab button in `index.html`:
   ```html
   <button class="nav-tab" data-tab="yourmodule">Your Module</button>
   ```

3. Add a tab panel `<section class="tab-panel" id="tab-yourmodule">` with your HTML layout.

4. Add a render function `function renderYourModule() { ... }` inside the `<script>` block.

5. Register it in the `renderTab` function:
   ```js
   const fns = { ..., yourmodule: renderYourModule };
   ```

6. Document it in `docs/user_guide.md` and update `CHANGELOG.md`.

---

## Coding conventions

- All statistical computation goes in `src/modules/` or `src/utils/`, not in the HTML script block.
- The HTML script block should only handle DOM interaction (reading inputs, rendering results, calling module functions).
- Use `const` and `let`, no `var`.
- Format numbers before displaying: use `formatters.js` helpers.
- Test with the built-in sample dataset before submitting.
- No external dependencies beyond Chart.js (already loaded via CDN in index.html).

---

## Reporting issues

Open a GitHub Issue with:
- Browser and version
- Steps to reproduce
- Expected vs actual behaviour
- Sample data if relevant (anonymise if needed)
