#  Data Analysis Toolkit

A fully interactive, browser-based statistical analysis workbench — no installation, no coding required.

**[→ Live Demo: Open `index.html` in your browser]**

---

## Features

| Module | Capabilities |
|--------|-------------|
| **Data Explorer** | Upload CSV, preview data, detect types, missing-value heatmap, export cleaned data |
| **Descriptive Stats** | Mean, median, SD, variance, skewness, kurtosis, IQR, five-number summary, frequency tables |
| **Visualizations** | Histogram, scatter plot, box plot, bar chart, line chart, correlation matrix |
| **Distributions** | Normal, Exponential, Uniform, Binomial, Poisson — live PDF/CDF with parameter sliders |
| **Goodness of Fit** | KS test, Chi-squared test, QQ plots |
| **Inference** | Confidence intervals, one-sample t-test, two-sample t-test, proportion test, ANOVA |
| **Regression** | Simple linear regression, residual plots, R², RMSE |
| **Probability Calc** | P(X < x), P(a < X < b), inverse CDF for any distribution |

---

## Project Structure

```
data-analysis-toolkit/
├── index.html                  ← Full standalone app (open this)
├── README.md
├── src/
│   ├── modules/
│   │   ├── explorer.js         ← Data loading, cleaning, preview
│   │   ├── descriptive.js      ← Summary statistics
│   │   ├── visualizations.js   ← Chart rendering (Chart.js)
│   │   ├── distributions.js    ← PDF/CDF/sampling for all distributions
│   │   ├── inference.js        ← Hypothesis tests, confidence intervals
│   │   ├── regression.js       ← Linear regression engine
│   │   └── probability.js      ← Probability calculator utilities
│   ├── utils/
│   │   ├── stats.js            ← Core statistical functions
│   │   ├── csvParser.js        ← CSV parsing and type detection
│   │   └── formatters.js       ← Number formatting helpers
│   └── data/
│       └── sample_dataset.csv  ← Built-in demo dataset (20 obs, 8 vars)
└── docs/
    └── user_guide.md           ← Full user guide
```

---

## Quick Start

1. Clone or download this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. The toolkit loads with the built-in sample dataset
4. Use the top navigation tabs to switch between modules
5. Upload your own CSV using the **Load CSV** button in the Explorer tab

### No server required — runs entirely in-browser.

---

## Sample Dataset

The built-in dataset (`src/data/sample_dataset.csv`) contains:

| Variable | Type | Description |
|----------|------|-------------|
| `id` | integer | Record identifier |
| `age` | numeric | Age in years |
| `height` | numeric | Height in cm |
| `weight` | numeric | Weight in kg (3 missing values) |
| `score` | numeric | Test score 0–100 (3 missing values) |
| `city` | categorical | Berlin / Hamburg / Munich / Frankfurt |
| `gender` | categorical | M / F |
| `income` | numeric | Annual income in EUR |

---

## Module Reference

### `src/utils/stats.js`
Core statistical engine used by all modules.
```js
import { describe, tTest, pearsonR, linearRegression } from './src/utils/stats.js';

const summary = describe([23, 31, 27, 45, 38]);
// { n, mean, median, sd, variance, min, max, q1, q3, skew, kurt }

const result = tTest(sample, mu0 = 75);
// { t, df, pValue, reject }
```

### `src/modules/distributions.js`
Generate PDF, CDF, and random samples for any supported distribution.
```js
import { Distribution } from './src/modules/distributions.js';

const normal = new Distribution('normal', { mu: 0, sigma: 1 });
normal.pdf(1.96);   // → 0.0584
normal.cdf(1.96);   // → 0.9750
normal.sample(100); // → array of 100 random draws
```

### `src/modules/inference.js`
Hypothesis testing and confidence intervals.
```js
import { confidenceInterval, tTestOneSample, tTestTwoSample } from './src/modules/inference.js';

const ci = confidenceInterval(data, alpha = 0.05);
// { lower, upper, margin, tcrit, mean, se }

const test = tTestOneSample(data, mu0 = 75, alpha = 0.05);
// { t, df, pValue, reject, direction }
```

### `src/modules/regression.js`
Simple linear regression with diagnostics.
```js
import { linearRegression } from './src/modules/regression.js';

const model = linearRegression(x, y);
// { slope, intercept, r2, rmse, residuals, predict(x) }
```

---

## Technologies

- **Vanilla JS** — no build tools, no Node.js required
- **Chart.js 4.4** — all charts and visualizations
- **CSS custom properties** — theming and dark mode support
- Built-in CSV parser (no Papa Parse dependency for core features)

---

## Usage Examples

### Example 1 Load your own CSV
```
1. Click the "Explorer" tab
2. Click "Load CSV" and select your file
3. The toolkit auto-detects column types and flags missing values
4. Switch to any other tab — your data is now active everywhere
```

### Example 2 Test if a mean equals a target
```
1. Go to "Inference" tab
2. Select your numeric column
3. Set H₀ value (e.g. μ = 75)
4. Read the t-statistic, p-value, and decision
```

### Example 3 Fit a distribution to your data
```
1. Go to "Distributions" tab
2. Select "Goodness of Fit"
3. Pick your column and a candidate distribution
4. Read the KS statistic and verdict
```

---

## License

MIT License free to use, modify, and share.

---

## Author

Kaushal patidar 
