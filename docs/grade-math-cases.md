# Grade math — hand-computed cases

These examples are the grade engine's test suite. Each fragment uses class `c1`, term `t1`, and
student `s1`; omitted document fields do not participate. Scores are keyed assignment first, then
student. Unless a case says otherwise, the letter scale is `A >= 90`, `B >= 80`, `C >= 70`, and
`F >= 0`.

The engine reports percentages without rounding. Decimal approximations below are only shorter
ways to write the displayed result; the fractions are the expected arithmetic.

## 1. Three weighted categories

```json
{"classes":[{"id":"c1","categories":[{"id":"tests","weight":50},{"id":"quiz","weight":30},{"id":"home","weight":20}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"tests","points":100},{"id":"a2","classId":"c1","termId":"t1","categoryId":"quiz","points":20},{"id":"a3","classId":"c1","termId":"t1","categoryId":"home","points":10}],
 "scores":{"a1":{"s1":{"v":80}},"a2":{"s1":{"v":18}},"a3":{"s1":{"v":10}}}}
```

Tests: `80 / 100 = 80%`. Quizzes: `18 / 20 = 90%`. Homework: `10 / 10 = 100%`.
All categories have work, so the grade is
`80 × 50/100 + 90 × 30/100 + 100 × 20/100 = 40 + 27 + 20 = 87%`.

Expected: category percentages `80`, `90`, `100`; class percentage `87`; letter `B`.

## 2. One assignment in the term

```json
{"classes":[{"id":"c1","categories":[{"id":"tests","weight":100}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"tests","points":40}],
 "scores":{"a1":{"s1":{"v":34}}}}
```

Tests: `34 / 40 = 85%`. Its 100% category weight leaves the same `85%` overall.

Expected: class percentage `85`; letter `B`.

## 3. Category with no assignments

```json
{"classes":[{"id":"c1","categories":[{"id":"tests","weight":60},{"id":"home","weight":40}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"tests","points":50}],
 "scores":{"a1":{"s1":{"v":40}}}}
```

Tests: `40 / 50 = 80%`. Homework has no possible points, so it has no percentage. The active
weight is 60 and Tests receives `60 / 60 = 100%` of it: `80 × 60/60 = 80%`.

Expected: Homework percentage `null`; class percentage `80`.

## 4. Every score in a category is excused

```json
{"classes":[{"id":"c1","categories":[{"id":"tests","weight":60},{"id":"home","weight":40}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"tests","points":50},{"id":"a2","classId":"c1","termId":"t1","categoryId":"home","points":20}],
 "scores":{"a1":{"s1":{"v":45}},"a2":{"s1":{"v":null,"flag":"excused"}}}}
```

Tests: `45 / 50 = 90%`. The excused cell adds neither earned nor possible, so Homework is empty.
Tests receives all active weight: `90 × 60/60 = 90%`.

Expected: Homework fraction `0/0` and percentage `null`; class percentage `90`.

## 5. Zero-point assignment adds extra credit

```json
{"classes":[{"id":"c1","categories":[{"id":"quiz","weight":100}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"quiz","points":20},{"id":"ec","classId":"c1","termId":"t1","categoryId":"quiz","points":0}],
 "scores":{"a1":{"s1":{"v":13}},"ec":{"s1":{"v":5}}}}
```

Quizzes: earned is `13 + 5 = 18`; possible is `20 + 0 = 20`; `18 / 20 = 90%`.
There is no assignment-level division, so the zero-point assignment cannot divide by zero.

Expected: Quiz fraction `18/20`; class percentage `90`.

## 6. Extra credit above 100 percent

```json
{"classes":[{"id":"c1","categories":[{"id":"quiz","weight":100}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"quiz","points":20},{"id":"ec","classId":"c1","termId":"t1","categoryId":"quiz","points":0}],
 "scores":{"a1":{"s1":{"v":20}},"ec":{"s1":{"v":5}}}}
```

Quizzes: `(20 + 5) / (20 + 0) = 25 / 20 = 125%`. With 100% of the active weight, the overall
grade is also `125%`. Neither result is capped.

Expected: category percentage `125`; class percentage `125`; letter `A`.

## 7. Category containing only zero-point assignments

```json
{"classes":[{"id":"c1","categories":[{"id":"tests","weight":70},{"id":"extra","weight":30}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"tests","points":100},{"id":"ec","classId":"c1","termId":"t1","categoryId":"extra","points":0}],
 "scores":{"a1":{"s1":{"v":80}},"ec":{"s1":{"v":10}}}}
```

Tests: `80 / 100 = 80%`. Extra Credit sums to `10/0`, which has no percentage; it is not 100% or
0%. Its weight drops out, leaving `80 × 70/70 = 80%`.

Expected: Extra Credit fraction `10/0` and percentage `null`; class percentage `80`, never `NaN`.

## 8. Weights cross from 95 to 100

The work and scores are the same as case 1, but the category weights first read 50, 30, and 15.
Their total is `50 + 30 + 15 = 95`, so no weighted arithmetic is performed.

Expected at 95: percentage `null`; reason `weights-unbalanced`; message
`The category weights total 95%, so there is no grade yet.`

Change only the third weight from 15 to 20. The total is now 100 and the case-1 arithmetic applies:
`80 × .50 + 90 × .30 + 100 × .20 = 87%`.

Expected at 100: percentage `87`; reason `null`. The same document crosses correctly both ways.

## 9. Missing compared with excused

```json
{"classes":[{"id":"c1","categories":[{"id":"tests","weight":100}]}],
 "assignments":[{"id":"a1","classId":"c1","termId":"t1","categoryId":"tests","points":10},{"id":"a2","classId":"c1","termId":"t1","categoryId":"tests","points":10}],
 "scores":{"a1":{"s1":{"v":8}},"a2":{"s1":{"v":null,"flag":"missing"}}}}
```

Missing: `(8 + 0) / (10 + 10) = 8/20 = 40%`. Change only `missing` to `excused`: the second
assignment drops out, giving `8/10 = 80%`.

Expected: missing percentage `40`; excused percentage `80`.

## 10. Late is a record, not a penalty

One 100%-weighted category contains a 100-point assignment scored `{ "v": 78, "flag": "late" }`.
Earned is 78 and possible is 100, so the grade is `78%`. Removing only the flag leaves the same
`78/100 = 78%`.

Expected: late and unflagged percentages are both `78`.

## 11. Blank cell compared with no key

One 100%-weighted category has two 10-point assignments. `a1` is scored 9. With
`a2: { "s1": { "v": null } }`, the second cell is blank and adds nothing: `9/10 = 90%`.
Delete the `s1` key under `a2`; no cell also adds nothing: `9/10 = 90%`.

Expected: blank-cell and absent-cell percentages are both `90`.

## 12. Every category empty

```json
{"classes":[{"id":"c1","categories":[{"id":"tests","weight":60},{"id":"home","weight":40}]}],
 "assignments":[],"scores":{}}
```

Both categories sum to `0/0` and have no percentage. There is no active weight and therefore no
weighted average to calculate.

Expected: percentage `null`; letter `null`; reason `no-graded-work`; message
`There is no graded work yet.` It is neither `0%` nor `NaN`.
