# Grade Calculator

Grade calculator built with Svelte and Tailwind.

https://kylefeng28.github.io/grade-calculator/

## Features and Usage

- Enter **grade category** weights (e.g. Quizzes 25%, Midterms 30%, Assignments 15%, Final Exam 30%)
- Enter **grade entries** with category and grade (e.g. Quiz 1 in category "Quizzes" with grade 95%, Quiz 2 in category Quizzes with grade 92%, etc)
- The calculated **weighted overall grade** will be shown below.

- **What-if mode**: mark a grade entry as "What-If" to explore hypothetical scenarios
  - e.g. Scenario A for getting a 80% on the next quiz, Scenario B for getting a 90% on the next quiz, etc
- **"What do I need?" mode**: mark a grade entry as "Calc" to find out what score you need to hit a target grade
  - e.g. Create an entry for the final exam and mark it as "Calc", and set a target score of 93% to see what you need to pass the class with an A
- **Score trade-off sliders**: when there are 2+ "Calc" entries, use sliders to explore how scores on different items can trade off against each other while still hitting your target

You can combine these features to get an idea of how well you need to do for the next few exams and final to achieve a target grade. For example:
  - You can create an entry for the next quiz and mark it as "What-If", and then create an entry for the final exam and mark it as "Calc"
  - Then, you can create Scenario A for getting a 80% on the quiz, and Scenario B for getting a 90% on the quiz
  - The tool will show you what you need to get on the final exam for both Scenario A and Scenario B

Other features:
- Multiple classes (tabs) with independent data
- Drag-and-drop reordering for grade entries
- "Show calculation" step-by-step breakdown of the math
- Persistent storage via `localStorage`
- Import/Export JSON (export to/import from file, or copy/paste from text box)
- URL sharing (click "Copy Link")

## How the math works

### Weighted overall grade

Each category has a weight (e.g. Quizzes 25%). The overall grade is:

```
overall = Σ(category_average * category_weight) / Σ(weights with grades)
```

Categories without any graded entries are excluded from both the numerator and denominator, so the grade stays meaningful even when not all categories have grades yet.

### "What do I need?" calculation

When entries are marked as "Calc", the tool solves for the unknown score X. Since each category average is a linear function of X, the overall grade is also linear in X:

```
Calculate average for each category:
for each category c with entries:
  avg_c(X) = (known_scores_sum + num_calc_entries * X) / total_entries_in_category

total_weight = Σ(weight_c) # ideally the weights add up to 100%, but we don't strictly enforce it
overall(X) = Σ(avg_c(X) * weight_i) / total_weight
```

This simplifies to `A * X + B = target`, which solves directly as `X = (target - B) / A`

### What-if scenarios

The baseline calculation uses the current grade entries, excluding all the what-if entries, and runs the "what do I need" calculation based solely on the known grades.

Then, when evaluating a what-if scenario:
- The scores for each what-if scenario is treated as known scores, then the "what do I need" calculation is applied on top of that. This means each scenario can produce a different needed score for the "Calc" entries.

### Trade-off sliders

For N = 2 (two unknown entries):
  - 1 slider to control the score for one entry, and the other will be computed
  - Linear constraint: `coeff_1 * X1 + coeff_2 * X2 = target - B`
  - Solution: `X2 = (target - B - coeff_1 * X1) / coeff_2`
For N = 3 (three unknown entries):
  - 2 sliders, 1 computed result
  - Linear constraint: `coeff_1 * X1 + coeff_2 * X2 + coeff_3 * X3 = target - B`
  - Solution: `X3 = (target - B - coeff_1 * X1 + coeff_2 * X2) / coeff_3`

Generalizing to `N` unknown entries, there will be $N-1$ sliders controlling entries $X-1$ through $X_{N-1}$, and the linear constraint is:

```
coeff_1 * X_1 + coeff_2 * X_2 + ... + coeff_N * X_N = target - B
= Σ(coeff_i × X_i) = target - B
```

where `coeff_i = (category_weight / 100) / total_entries_in_category` for the category containing entry i.

This is one linear equation with N unknowns, so there are N-1 degrees of freedom. $X_N$ is solved:

```
X_N = (target - B - Σ(coeff_i * X_i for i=1..N-1)) / coeff_N
```

## Developing

```sh
npm install
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.
