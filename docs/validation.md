# Execution results

Local verification against `https://automationexercise.com` on 28 October 2026, using Chromium.

| Check | Result |
| --- | --- |
| Latest full suite, 2 workers, zero retries | **13 passed, 3 failed in 1.4 minutes** |
| REG-02 and REG-05-mobile_number | `/login` returned HTTP 503 and displayed the site's heavy-load / queue-full page |
| REG-05-address | UI validation completed; the account-absence API check returned HTTP 503 |
| Independent check after the cleanup API 503 | Account confirmed absent with application responseCode 404; original test stays failed |
| Blank optional company/address2 fields | REG-01 passed separately in 12.5 seconds, including account cleanup |
| Report-attachment failure probe | Mocked DELETE ran once before the deliberate attachment error; previously it ran zero times |
| TypeScript and test discovery | Passed; 16 cases |
| Other browsers / GitHub Actions | Not run |

The latest full run is not a clean pass. Its failures remain in the HTML/JUnit reports. Traces confirm HTTP 503 responses; increasing waits or retrying automatically would hide the site's availability problem.

The optional-field check used a separate output folder and list reporter, preserving the full-run report. The attachment-failure probe used a mocked API outside the project and deliberately failed reporting; deletion still completed. No additional cases were added to the 16-case suite.

Before these two review fixes, the refactored suite passed all 16 tests in 27.0 seconds, and the three headed smoke cases passed with real ads enabled in 16.6 seconds. Those are historical results, not the latest run. Navigation timing and owned-email attachments are available when their collection completes.

## Navigation timeout investigation

The previous 20-case suite had one failure after the Signup / Login click. The click completed, but Playwright timed out waiting for scheduled navigation. Its isolated recheck passed. Other diagnostic runs also encountered API timeouts. The available evidence does not establish whether the original delay came from the server, network or third-party loading.

The revised Page Objects return from navigation clicks without waiting for page loading. Tests then wait for a meaningful destination locator. The signup heading uses the configured navigation timeout. Search waits for the submitted query URL and DOM content before checking results, including when the heading is unchanged. This prevents the empty-query case from passing against the previous page.

Retries are disabled in both local and CI runs. Main-frame response timings are attached for future failures. The clean parallel run recorded 40 responses with status 200 or 302; the largest response-start time was 1,306.723 ms. No navigation timeout occurred in that earlier run or its headed smoke run. The latest run now provides concrete evidence of server overload: two login responses and one API response returned HTTP 503. This does not prove that every earlier timeout had the same cause.

## Findings retained in the tests

- The Logout link includes a decorative icon in its accessible name; its locator matches the text suffix.
- Empty search keeps the All Products heading and catalogue.
- Search matches category metadata as well as names; `top` includes a shirt in Tops & Shirts.
- The observed full-screen Google ad exposes a Close ad control inside its frame.

Separate Playwright commands must run sequentially in the same checkout or use separate report/output folders. An earlier overlapping diagnostic run caused report-file collisions; recovered test addresses were subsequently checked and confirmed absent.

## Cleanup failure-path check

A disposable test created an account through the API and deliberately failed an assertion. The fixture completed deletion and absence verification. A separate API request then returned `responseCode: 404` for the same credentials. The temporary test and credential file were removed; this probe is not part of the 16-case suite. Its expected failure used a separate output folder and did not replace the full-suite report.
