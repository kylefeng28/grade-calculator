# Grade Calculator

Grade calculator built with Svelte and Tailwind.

https://kylefeng28.github.io/grade-calculator/

## Usage

- Enter **grade category** weights (e.g. Quizzes 25%, Midterms 30%, Assignments 15%, Final Exam 30%)
- Enter **grade entries** with category and grade (e.g. Quiz 1 in category "Quizzes" with grade 95%, Quiz 2 in category Quizzes with grade 92%, etc)
- The calculated **weighted overall grade** will be shown
- **"What do I need"** feature: mark an entry as "Calculate" to find out what score you need to hit a target grade

Other features:
- Drag-and-drop reordering for grade entries
- Persistent storage via `localStorage`
- Import/Export JSON (export to/import from file, or copy/paste from text box)
- URL sharing (click "Copy Link")

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
