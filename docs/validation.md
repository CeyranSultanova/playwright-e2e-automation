# Execution results

Local verification against `https://automationexercise.com` on 28 October 2026, using Chromium.

| Check | Result |
| --- | --- |
| Refactored suite, 2 workers, zero retries | **16 passed in 27.0 seconds** |
| Three smoke cases, headed, real ads enabled, 1 worker | **3 passed in 16.6 seconds** |
| Registration cleanup in the full suite | Passed for all 9 cases |
| Cleanup after a deliberate assertion failure | Independent API verification returned 404 (account absent) |
| TypeScript and test discovery | Passed; 16 cases |
| Other browsers / GitHub Actions | Not run |

The full-suite HTML report remains in `playwright-report/`. The headed smoke run used a separate output folder and list reporter to preserve it. Navigation timing and account-email attachments are available in the report. The ad-handler checks use controlled responses because live ads do not appear consistently.

## Navigation timeout investigation

The previous 20-case suite had one failure after the Signup / Login click. The click completed, but Playwright timed out waiting for scheduled navigation. Its isolated recheck passed. Other diagnostic runs also encountered API timeouts. The available evidence does not establish whether the original delay came from the server, network or third-party loading.

The revised Page Objects return from navigation clicks without waiting for page loading. Tests then wait for a meaningful destination locator. The signup heading uses the configured navigation timeout. Search waits for the submitted query URL and DOM content before checking results, including when the heading is unchanged. This prevents the empty-query case from passing against the previous page.

Retries are disabled in both local and CI runs. Main-frame response timings are attached for future failures. The clean parallel run recorded 40 responses with status 200 or 302; the largest response-start time was 1,306.723 ms. No navigation timeout occurred in this run or the headed smoke run. These successful runs do not rule out future service delays.

## Findings retained in the tests

- The Logout link includes a decorative icon in its accessible name; its locator matches the text suffix.
- Empty search keeps the All Products heading and catalogue.
- Search matches category metadata as well as names; `top` includes a shirt in Tops & Shirts.
- The observed full-screen Google ad exposes a Close ad control inside its frame.

Separate Playwright commands must run sequentially in the same checkout or use separate report/output folders. An earlier overlapping diagnostic run caused report-file collisions; recovered test addresses were subsequently checked and confirmed absent.

## Cleanup failure-path check

A disposable test created an account through the API and deliberately failed an assertion. The fixture completed deletion and absence verification. A separate API request then returned `responseCode: 404` for the same credentials. The temporary test and credential file were removed; this probe is not part of the 16-case suite. Its expected failure used a separate output folder and did not replace the full-suite report.
