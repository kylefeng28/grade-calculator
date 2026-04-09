# Grade Calculator

Grade calculator built with Svelte and Tailwind.

https://kylefeng28.github.io/grade-calculator/

## Features and Usage

- Enter **grade category** weights (e.g. Quizzes 25%, Midterms 30%, Assignments 15%, Final Exam 30%)
- Enter **grade entries** with category and grade (e.g. Quiz 1 in category "Quizzes" with grade 95%, Quiz 2 in category Quizzes with grade 92%, etc)
- The calculated **weighted overall grade** will be shown below.

- **What-if mode**: mark an grade entry as "What-If" to explore hypothetical scenarios
  - e.g. Scenario A for getting a 80% on the next quiz, Scenario B for getting a 90% on the next quiz. etc
- **"What do I need?" mode**: mark an grade entry as "Calc" to find out what score you need to hit a target grade
  - e.g. Create an entry for the final exam and mark it as "Calc", and set a target score of 93% to see what you need to pass the class with an A

You can combine these two features to get an idea of how well you need to do for the next few exams and final to achieve a target grade. For example:
  - You can create a entry for the next quiz and mark it as "What-If", and then create an entry for the final exam and mark it as "Calc"
  - Then, you can create Scenario A for getting a 80% on the quiz, and Scenario B for getting a 90% on the quiz
  - The tool will show you what you need to get on the final exam for both Scenario A and Scenario B

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
