# Execution results

Local verification against `https://automationexercise.com` on 28 October 2026, using Chromium.

## Latest functional checks

| Check | Result |
| --- | --- |
| Full suite, 2 workers, no retries | 19 passed, 1 failed in 1.2 minutes |
| Failed case | REG-05-password: navigation timed out after clicking Signup / Login, before reaching field validation; cleanup completed |
| Isolated recheck of REG-05-password | Passed in 13.8 seconds |
| Three smoke cases, headed, real ads enabled, 1 worker | Passed in 17.3 seconds, including account cleanup with Gmail aliases |
| Two controlled ad-handler checks | Passed in 1.5 seconds |
| TypeScript | Passed |
| Other browsers / GitHub Actions | Not run |

The isolated recheck does not make the full run a clean pass. Its navigation timeout remains an intermittent failure to investigate. Live ad delivery varies, so the controlled checks also verify dismissal when no live overlay is served.

An earlier pair of diagnostic runs overlapped and wrote to the same report folders. They were stopped; six test addresses recovered from the traces were confirmed absent. Separate runner commands should execute sequentially in this checkout.

The original 18-case suite, before the email and ad-handler changes, passed in 34.4 seconds. That result is historical, not the result for the current 20-case suite.

## Findings from live runs

- The Logout link includes a decorative icon in its accessible name. Its locator matches the text suffix.
- Empty search keeps the All Products heading and catalogue.
- Search matches category metadata as well as names; `top` includes a shirt in Tops & Shirts.
- A full-screen Google ad exposes a Close ad control inside its frame.

HTML reports are generated in `playwright-report/`, with JUnit and failure artifacts in `test-results/`. These folders are ignored by Git. Remote CI results will be available after the repository is published and the workflow runs.

## Documentation and naming review

The README, case descriptions, test titles and comments were simplified. TypeScript checking and test discovery passed: 20 cases, including 3 smoke cases. Test actions and assertions are unchanged; live tests were not rerun for these wording edits.
