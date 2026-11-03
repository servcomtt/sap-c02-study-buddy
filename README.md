# SAP-C02 Study Buddy

A static, offline-first study app for **AWS Certified Solutions Architect - Professional (SAP-C02)**. It is adapted from the AZ-700 Study Buddy and keeps its engine, layout, navigation and learning flow: lessons, scenarios, guided labs, flashcards, a practice quiz and a summary for every chapter.

**Status: structure only.** The course map, 20 task-statement lessons, build pipeline, tests and UI are in place. Lesson bodies, labs, knowledge checks and quiz questions are placeholders marked `SCAFFOLD` until authored.

## Run it locally

```bash
python3 -m http.server 8702
# open http://127.0.0.1:8702/lms/
```

## Course structure

Source: the exam guide in `docs/` (domains, task statements and "Skills in" bullets are used verbatim as lesson objectives; see `source/exam-tasks.json`).

| Chapter | Exam weight | Lessons (one per task statement) |
|---|---|---|
| Orientation | Foundation | Certification map, Architect toolkit |
| 1 Design Solutions for Organizational Complexity | 26% | network connectivity, security controls, resilient architectures, multi-account, cost visibility |
| 2 Design for New Solutions | 29% | deployment strategy, business continuity, security from requirements, reliability, performance, cost strategy |
| 3 Continuous Improvement for Existing Solutions | 25% | operational excellence, security, performance, reliability, cost |
| 4 Accelerate Workload Migration and Modernization | 20% | select workloads, migration approach, new architecture, modernization |
| Final Review | Capstone | Scenario review |

Exam facts used in the app (from the exam guide): 65 scored + 10 unscored questions, multiple choice and multiple response, scaled score 100-1,000, minimum passing score 750. The app does not predict your score.

## Authoring flow

1. Author in `source/`: `lessons.json` (topics and blocks, schema in the AZ-700 `notes/SCHEMA.md`), `extra-lessons.cjs` (orientation/review + flashcards), `labs.cjs`, `knowledge-checks.cjs`, `quiz.cjs` (+ `quiz-a.cjs`, `quiz-b.cjs`), `learn-urls.json`, `course.cjs`.
2. `npm run build:content` regenerates `lms/*.js` data and `lms/assets/*.svg`. It fails on duplicate ids, bad cross-references, non-AWS URLs (docs.aws.amazon.com, aws.amazon.com, skillbuilder.aws) and invalid answer keys. Never edit generated files by hand.
3. `node tools/coverage-report.js` writes `docs/COVERAGE.md`.
4. `npm run check:syntax && npm run test:unit`. For e2e: `npm install`, then `npm run test:e2e` (the specs still carry AZ-700-specific assertions; update them as content lands).

Rules: original wording only. `docs/Q&A/` and the unofficial study guide are private study material: never copy them into published files. Documentation links in `source/learn-urls.json` are seeded from memory; open and confirm each before relying on it.

## Layout

```
index.html            redirects to lms/
lms/                  the app (runtime files + generated data + assets/)
source/               authored content (not published)
tools/                build-content, build-maps, build-bank, coverage-report, build-site
tests/                unit tests and Playwright e2e + axe
docs/                 exam guide and reference material (PDFs are gitignored)
.github/workflows/    CI (validation) and Pages deploy
```

## Storage

Browser keys are namespaced `sapc02-*`; progress from other Study Buddy apps is never read, and a backup from another course is rejected on import.

## License

MIT, see [LICENSE](LICENSE). AWS and Amazon Web Services are trademarks of Amazon; this is an independent study aid.
