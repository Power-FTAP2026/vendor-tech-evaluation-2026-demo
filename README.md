# 2026 Vendor's Technicians Evaluation: DEMO website

Practice copy of the evaluation app. **Nothing is saved to Google:** registrations and practice scores stay only in
the visitor's own browser. The Theoretical exam's sign-in page can be viewed, but **starting the exam is turned off**
(the real questions are never published).

- Practical: evaluators log in with the **demo PIN** (given to evaluators only) to review the real scenarios of their own station.
  The scenarios are loaded read-only from the evaluation backend after the PIN is checked; they are not in this code.
- To try the afternoon session in the morning, add `?session=PM` to a page address (e.g. `exam.html?session=PM`).
- "Start over" in the yellow banner clears this browser's demo data.

This folder is generated from the main project with `node tools/build-demo.mjs`. Don't edit it by hand.
