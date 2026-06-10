# Data Analysis Toolkit — User Guide

## Overview

This toolkit is a self-contained, browser-based statistical workbench. It covers the full data analysis pipeline — from loading raw data to running hypothesis tests and fitting regression models — without requiring any installation or programming knowledge.

---

## Getting Started

1. **Open `index.html`** in any modern web browser (Chrome, Firefox, Edge, or Safari).
2. The toolkit loads the built-in sample dataset automatically.
3. Navigate using the **top tab bar** to switch between modules.
4. To use your own data: go to the **Explorer** tab and click **Load CSV**.

---

## Module Guide

### Tab 1 — Data Explorer

**What it does:** Inspect, clean, and understand the structure of your dataset.

**Features:**
- **Dataset overview:** row count, column count, total missing values, numeric/categorical split
- **Column type detection:** automatically classifies each column as numeric or categorical
- **Missing value analysis:** visual bar chart showing percentage of missing values per column
- **Data preview table:** first 8 rows with null values highlighted
- **Load CSV:** upload any comma-separated file
- **Export CSV:** download the current (optionally cleaned) dataset

**How to use:**
1. Open the Explorer tab (loaded by default)
2. Review the summary cards at the top
3. Check the missing value bars — any bar showing red means that column has gaps
4. Click column headers in the preview table to sort

**Example analysis:** The sample dataset shows that `weight` and `score` each have 3 missing values (~15%). Before running statistics on these columns, consider whether to drop those rows or impute values.

---

### Tab 2 — Descriptive Statistics

**What it does:** Compute a full numerical summary of any variable.

**Statistics computed:**
| Statistic | Description |
|-----------|-------------|
| n | Count of non-missing values |
| Mean | Arithmetic average |
| Median | Middle value (50th percentile) |
| Mode | Most frequent value(s) |
| Std Dev (s) | Spread around the mean |
| Variance (s²) | Squared spread |
| Min / Max | Range endpoints |
| Q1 / Q3 | 25th and 75th percentiles |
| IQR | Interquartile range (Q3 − Q1) |
| Skewness | Asymmetry (0 = symmetric) |
| Kurtosis | Tail weight (0 = normal tails) |
| CV | Coefficient of variation (%) |
| SEM | Standard error of the mean |

**How to use:**
1. Select a numeric column from the dropdown
2. All statistics update instantly
3. Review the five-number summary box (visual strip at bottom)
4. Switch columns to compare distributions

**Interpretation tips:**
- Skewness > +1 or < −1: noticeably skewed distribution
- Kurtosis > +2: heavier tails than normal; < −2: lighter tails
- CV > 30%: high relative variability

---

### Tab 3 — Visualizations

**What it does:** Generate interactive charts for exploring distributions and relationships.

**Chart types:**
| Chart | Use case |
|-------|----------|
| Histogram | Distribution shape of one variable |
| Box plot | Spread, outliers, and quartiles |
| Scatter plot | Relationship between two variables |
| Bar chart | Category frequencies |
| Line chart | Trends over index/time |
| Correlation heatmap | Pairwise relationships (all numeric) |

**How to use:**
1. Select chart type from the buttons
2. Choose column(s) from the dropdowns
3. For scatter: select X and Y variables
4. Charts update immediately

**Example analysis:**
- Set chart to **Scatter**, X = `age`, Y = `income` → look for a positive trend
- Switch to **Histogram** of `score` → check if it looks bell-shaped
- Open **Correlation heatmap** → quickly spot which pairs are most related

---

### Tab 4 — Probability Distributions

**What it does:** Visualize theoretical probability distributions and compare them to your data.

**Supported distributions:**
- Normal (μ, σ)
- Exponential (λ)
- Uniform (a, b)
- Binomial (n, p)
- Poisson (λ)
- Student's t (df)
- Chi-squared (df)

**Interactive controls:**
- Use sliders to change distribution parameters
- PDF and CDF charts update in real time
- Probability calculator: enter a value to compute P(X ≤ x) or P(a ≤ X ≤ b)

**Goodness-of-fit panel:**
- Select a variable and target distribution
- The Kolmogorov-Smirnov (KS) test runs automatically
- D statistic and verdict shown alongside the Q-Q plot

**How to use:**
1. Select a distribution from the buttons
2. Adjust parameters with sliders
3. Observe the PDF and CDF shapes
4. Switch to **Goodness of Fit** tab, select a data column, choose a distribution
5. Read the KS test result: if D < D_critical, data is consistent with that distribution

**Probability calculator examples:**
- Normal(0,1): P(X ≤ 1.96) = 0.975 → this is the basis of 95% confidence intervals
- Set μ=0, σ=2: the curve widens and flattens — higher variance
- Exponential(λ=2): P(X ≤ 1) = 1 − e^(−2) ≈ 0.865

---

### Tab 5 — Statistical Inference

**What it does:** Run hypothesis tests and compute confidence intervals.

#### 5a — Confidence Intervals
Estimates where the true population mean likely falls.

**How to use:**
1. Select a numeric column
2. Set alpha (α) with the slider (default: 0.05 → 95% CI)
3. Read: [ lower, upper ] interval
4. Formula: x̄ ± t* × (s/√n)

**Interpretation:** "We are 95% confident the true mean lies within this interval."
As α increases (less confident), the interval narrows. As α decreases, it widens.

#### 5b — One-Sample t-Test
Tests whether the sample mean equals a specified value.

**How to use:**
1. Select column
2. Set H₀ value (the value you want to test against)
3. Read: t-statistic, p-value, and decision

**Example:** Testing if mean score = 80:
- t = (observed_mean − 80) / SE
- If p < 0.05: reject H₀ → mean is significantly different from 80
- If p ≥ 0.05: fail to reject → not enough evidence to say it differs

#### 5c — Two-Sample t-Test
Compares means from two groups (Welch's test, no equal-variance assumption).

**How to use:**
1. Select column and grouping variable (e.g., gender)
2. The toolkit splits data into two groups and runs Welch's t-test
3. Read: group means, t-statistic, p-value, decision

#### 5d — Normality Test
Assesses whether a variable follows a normal distribution.

**Methods used:**
- Skewness and kurtosis moments
- Jarque-Bera statistic
- Shapiro-Wilk W approximation

**Interpretation:**
- W close to 1.0: approximately normal
- |Skewness| < 1: acceptable symmetry
- |Kurtosis| < 2: acceptable tail weight

---

### Tab 6 — Regression

**What it does:** Fit a simple linear regression model and examine diagnostics.

**Output:**
- Equation: ŷ = b₀ + b₁x
- Slope and intercept with standard errors, t-statistics, p-values
- R² (explained variance), Adjusted R², RMSE
- F-statistic for overall model significance
- Scatter plot with regression line
- Residual vs fitted plot
- Q-Q plot of residuals
- Cook's distance (influential observations)

**How to use:**
1. Select X (predictor) and Y (response) columns
2. Model fits instantly; review coefficient table
3. Check residual plots — residuals should scatter randomly around 0
4. Use the **Predict** box to get ŷ for a new x value

**Example:** Regress `income` on `age`:
- Positive slope: income tends to increase with age
- R² = 0.65: age explains 65% of income variation
- Check residuals are not fan-shaped (would indicate heteroscedasticity)

---

## Interpreting p-values

| p-value | Interpretation |
|---------|---------------|
| p < 0.001 | Very strong evidence against H₀ |
| 0.001 ≤ p < 0.01 | Strong evidence |
| 0.01 ≤ p < 0.05 | Moderate evidence (reject at α=0.05) |
| 0.05 ≤ p < 0.10 | Weak evidence (marginal) |
| p ≥ 0.10 | Little or no evidence against H₀ |

**Important:** p-value is NOT the probability that H₀ is true. It is the probability of observing results at least as extreme as these, given that H₀ is true.

---

## Common Analysis Workflows

### Workflow 1 — Explore a new dataset
1. Explorer → check dimensions, types, missing values
2. Descriptive Stats → review mean, spread, skewness per column
3. Visualizations → histogram each numeric variable, correlation heatmap
4. Distributions → fit normal distribution, run KS test

### Workflow 2 — Compare two groups
1. Visualizations → box plot split by group variable
2. Descriptive Stats → check means and SDs per group
3. Inference → two-sample t-test → read p-value and decision

### Workflow 3 — Predict a continuous outcome
1. Visualizations → scatter X vs Y
2. Regression → fit model, check R²
3. Regression → examine residuals → check model assumptions
4. Regression → use Predict box for new values

---

## Technical Notes

- All calculations run in the browser — no data is sent to any server
- Missing values are excluded from computations (listwise deletion)
- p-values use the normal approximation for large samples
- The Shapiro-Wilk test is an approximation valid for n ≥ 3
- KS critical values assume α = 0.05

---

## Glossary

**α (alpha):** Significance level; probability of a Type I error (false positive). Typically 0.05.

**p-value:** Probability of the observed result under H₀.

**t-statistic:** Standardized test statistic = (estimate − null value) / standard error.

**Confidence interval:** Range of plausible values for a parameter at a given confidence level.

**R²:** Proportion of variance in Y explained by X (0–1; higher is better).

**RMSE:** Root mean squared error; average prediction error in original units.

**KS test:** Kolmogorov-Smirnov test; measures maximum distance between empirical and theoretical CDFs.

**IQR:** Interquartile range = Q3 − Q1; robust measure of spread, not affected by outliers.
