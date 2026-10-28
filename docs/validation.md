# Execution results

Local verification against `https://automationexercise.com` on 28 October 2026, using Chromium. Results below refer to the split suites after removing focus checks and redundant assertions.

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| Test discovery | 14 live E2E cases; 2 separate helper checks |
| Ad helpers, 2 workers, zero retries | **2 passed in 2.1 seconds** |
| Live E2E suite, 2 workers, zero retries | **10 passed, 4 failed in 1.4 minutes** |
| One-worker diagnostic, four affected cases, zero retries | **3 passed, 1 failed in 49.1 seconds** |
| Report generation | Separate, nonempty HTML reports and valid JUnit XML for both suites |
| Workflow configuration | YAML parses; both suites are configured to run and upload reports, including on failure |
| Other browsers / hosted GitHub Actions | Not run |

## Current failures

All four failed journeys encountered HTTP 503 responses, confirmed in their network traces:

| Case | Failed request | Effect |
| --- | --- | --- |
| REG-01 | `GET /login` | Signup heading never appeared; account creation was not reached |
| REG-05-password | `GET /` | Home displayed the heavy-load page; account creation was not reached |
| SEARCH-01 | `GET /add_to_cart/1` | Product details and quantity entry completed, but the cart confirmation stayed hidden |
| SEARCH-02 | `GET /products` | Catalogue setup failed before searching |

The full run remains failed. Its reports are preserved in `playwright-report/e2e/` and `test-results/e2e/`. JUnit represents the four unsuccessful cases as three assertion failures and one timeout error. The helper reports are in the corresponding `checks/` folders.

The separate one-worker diagnostic passed REG-01, REG-05-password and SEARCH-02, including registration cleanup. SEARCH-01 failed before searching because `GET /products` returned HTTP 503. It used a list reporter and `test-results/diagnostic/`, preserving the original reports. This follow-up does not turn the parallel run into a pass; the revised cart journey still needs a complete successful execution when the service is available.

## Earlier evidence

These checks predate the suite split and are not evidence of a clean current full run:

- The former combined suite passed 16/16 in 27.0 seconds. Three headed smoke cases also passed with live ads enabled in 16.6 seconds.
- A subsequent combined run had 13 passes and three HTTP 503 failures. One occurred during cleanup verification; a separate API check later confirmed that account was absent.
- REG-01 passed with empty optional `company` and `address2` values in 12.5 seconds.
- A disposable failure-path test created an account, deliberately failed an assertion, then completed fixture deletion and absence verification. A separate API request confirmed response code 404. The temporary test and credential file were removed.
- A mocked reporting-failure probe confirmed DELETE ran before a deliberate attachment error. This protects cleanup from report-writing failures; it does not prove recovery when the API itself is unavailable.

## Reliability decisions

Earlier runs encountered navigation timeouts. Navigation clicks now return without waiting for page loading, and tests assert a meaningful destination locator. Search waits for the submitted query URL and DOM content so unchanged headings cannot hide stale results. No fixed sleeps or automatic retries are used.

Main-frame response timings are attached for diagnosis. Current traces prove server overload for the four failures above, but do not establish the cause of every earlier timeout. Increasing assertion timeouts would not repair an HTTP 503 response.

Repeated runs of the same suite must use separate report/output folders or execute sequentially. The E2E and helper configs now use distinct folders. Hosted report uploads still need verification after the repository is published.
