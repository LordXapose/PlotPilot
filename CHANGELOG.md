# Changelog

All notable changes to the Data Analysis Toolkit are documented here.

---

## [2.0.0] — 2024

### Added

**New modules (7 tabs added to the navigation bar)**
- **Data Cleaning** — impute missing values (mean/median/mode/zero/forward fill), detect outliers (IQR fence, Z-score), normalize/standardize columns (min-max, z-score, log transform), filter rows by condition, discretize continuous variables into bins (equal-width and equal-frequency)
- **ANOVA** — one-way ANOVA with full F-table (SS, df, MS, F, p-value), effect sizes (eta-squared, omega-squared), Tukey HSD post-hoc pairwise comparisons, group means chart
- **Multiple Regression** — checkbox predictor selection, OLS via normal equations, full coefficient table with t-stats and p-values, VIF (variance inflation factor), AIC/BIC, fitted-vs-actual chart, residuals chart
- **Time Series** — moving average with adjustable window, exponential smoothing with adjustable alpha, linear trend decomposition (slope, direction), ACF (autocorrelation function) bar chart, rolling statistics, ADF stationarity test approximation
- **Sampling & Power** — Central Limit Theorem interactive demo (adjustable sample size and iterations), bootstrap confidence interval (mean/median/SD), sample size calculator (for mean and proportion), statistical power curve by effect size and alpha
- **Chi-squared Tests** — independence test on two categorical variables, full contingency table with observed and expected counts, Cramer's V effect size, observed vs expected bar chart
- **Data Story** — one-click auto-generated narrative insights: skewness warnings, outlier alerts, correlation flags, missing value reports, category distribution summary, normality checks

**Enhancements to existing modules**
- Visualizations: added line chart, bubble chart, area chart (3 new chart types)
- Visualizations: scatter plot now shows Pearson r in chart title live
- Descriptive Stats: added "Full summary table" button for all numeric columns
- Inference: added two-sample Welch t-test card with Cohen's d
- Distributions: added Binomial and Poisson distributions (6 total, up from 4)
- Probability Calculator: added Binomial and Poisson options

**New source files**
- `src/modules/visualizations.js` — chart rendering module
- `src/modules/descriptive.js` — descriptive stats module
- `src/modules/explorer.js` — data loading and schema module
- `src/modules/probability.js` — probability calculator module
- `src/utils/formatters.js` — number and display formatting helpers

**Repository**
- Added `LICENSE` (MIT)
- Added `CHANGELOG.md`
- Added `CONTRIBUTING.md`

---

## [1.0.0] — 2024

### Initial release

**Modules**
- Data Explorer — CSV load, schema detection, missing-value bars, preview table
- Descriptive Statistics — mean, median, SD, variance, skewness, kurtosis, IQR, CV, SEM, five-number summary, frequency table, histogram
- Visualizations — histogram, scatter plot, box plot, bar chart, correlation matrix
- Probability Distributions — Normal, Exponential, Uniform, Student t; PDF, CDF, KS goodness-of-fit, Q-Q plot
- Statistical Inference — confidence intervals, one-sample t-test, normality test (Jarque-Bera + Shapiro-Wilk)
- Regression — OLS simple linear regression, coefficient table, R2, RMSE, scatter + regression line, residuals vs fitted, prediction with interval
- Probability Calculator — P(X <= x), P(X >= x), P(a <= X <= b), inverse CDF for 4 distributions
- User Guide — built-in quick-reference

**Source files**
- `src/utils/stats.js` — core statistical functions
- `src/utils/csvParser.js` — CSV parsing and type detection
- `src/modules/distributions.js` — Distribution class with PDF/CDF/sampling
- `src/modules/inference.js` — hypothesis tests and confidence intervals
- `src/modules/regression.js` — OLS regression engine
- `src/modules/anova.js` — ANOVA and post-hoc (included in release, not yet wired to UI)
- `src/modules/cleaning.js` — data cleaning functions (included, not yet wired to UI)
- `src/modules/timeseries.js` — time series analysis (included, not yet wired to UI)
- `src/modules/sampling.js` — sampling and power analysis (included, not yet wired to UI)
- `src/modules/multiRegression.js` — multiple regression (included, not yet wired to UI)

**Documentation**
- `README.md` with full project description and code examples
- `docs/user_guide.md` with module-by-module user guide
- `src/data/sample_dataset.csv` with 20-observation demo dataset
- `DataAnalysisToolkit_Documentation.pdf` — complete PDF documentation and FAQ
