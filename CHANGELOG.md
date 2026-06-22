# RAIVANUA — Change log

Every change carries a unique tracking number **CHG-NNNN**, mirrored by a matching
git tag `chg-NNNN` on the exact commit. To inspect or revert a change:

```
git show chg-0007                 # see what CHG-0007 changed
git revert <commit>               # safely undo a change (keeps history)
git reset --hard chg-0006         # roll the working branch back to CHG-0006 (destructive)
git checkout chg-0006 -- <path>   # restore one file to its CHG-0006 state
```

Newest first.

| CHG | Date | Commit | Change |
|-----|------|--------|--------|
| CHG-0013 | 2026-06-19 | _this commit_ | Government view: default the contact filter to "District Officer" |
| CHG-0012 | 2026-06-19 | 4686cd0 | Run the API under PM2 (auto-restart + survives sessions/reboots); `pool.on('error')` guard |
| CHG-0011 | 2026-06-19 | 2c2fb7a | Government view: add a dropdown to filter contact cards by title |
| CHG-0010 | 2026-06-19 | 99ba470 | Add change-tracking: CHANGELOG.md + `chg-NNNN` git tags per change |
| CHG-0009 | 2026-06-19 | a4f4022 | Fix: let main content fill the full width on every page |
| CHG-0008 | 2026-06-18 | be6fb6e | Map Meda Matata Mada KPIs to TAB Platforms in the Government view |
| CHG-0007 | 2026-06-18 | 1c0a33d | VScorecard: simplify action plans to equal-sized, level-prefixed boxes |
| CHG-0006 | 2026-06-18 | 7ebcee3 | VScorecard: cascade as a single-column trickle-up pyramid |
| CHG-0005 | 2026-06-18 | f316b03 | Add VScorecard: Meda Matata Mada child-centric trickle-up BSC |
| CHG-0004 | 2026-06-18 | 2671bfb | Scorecard: lay perspectives in a 2-column grid to prevent wrapping |
| CHG-0003 | 2026-06-18 | 18abec9 | Add Vanua Scorecard: BSC-perspective KPI targets with hierarchy roll-up |
| CHG-0002 | 2026-06-18 | 2fa0aa5 | Rebrand app to RAIVANUA (title, header logo, hero tagline, Dev copy) |
| CHG-0001 | 2026-06-18 | 25d2c09 | Replace header logo with new RAIVANUA mark |
