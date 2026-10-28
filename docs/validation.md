# Execution results

Local verification against `https://automationexercise.com` on 28 October 2026, using Chromium. Latest verification includes the product/cart navigation, CI worker and cleanup changes.

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| Test discovery | 14 live E2E cases; 2 separate helper checks |
| Ad helpers, 2 workers, zero retries | **2 passed in 2.1 seconds** |
| Latest live E2E suite, 1 worker, zero retries | **14 passed in 49.8 seconds** |
| Isolated cart journey after the readiness fix | **1 passed in 5.4 seconds** |
| Report generation | Separate, nonempty HTML reports and valid JUnit XML for both suites |
| Workflow configuration | YAML parses; both suites are configured to run and upload reports, including on failure |
| Other browsers / hosted GitHub Actions | Not run |

## Earlier server-failure run

Before the readiness fix, an earlier parallel run had 10 passes and four failures in 1.4 minutes. All four failed journeys encountered HTTP 503 responses, confirmed in their network traces:

| Case | Failed request | Effect |
| --- | --- | --- |
| REG-01 | `GET /login` | Signup heading never appeared; account creation was not reached |
| REG-05-password | `GET /` | Home displayed the heavy-load page; account creation was not reached |
| SEARCH-01 | `GET /add_to_cart/1` | Product details and quantity entry completed, but the cart confirmation stayed hidden |
| SEARCH-02 | `GET /products` | Catalogue setup failed before searching |

That full run failed. JUnit represented the four unsuccessful cases as three assertion failures and one timeout error. The latest successful full run has replaced the E2E reports; this section retains the earlier investigation.

A separate one-worker diagnostic had three passes and one failure in 49.1 seconds: REG-01, REG-05-password and SEARCH-02 passed, including registration cleanup. SEARCH-01 failed before searching because `GET /products` returned HTTP 503. It used a list reporter and `test-results/diagnostic/`, preserving the original reports. This follow-up did not turn that parallel run into a pass.

## Cart readiness investigation

A later run had 13 passes and one SEARCH-01 failure. The Add to cart click completed, but the confirmation remained hidden. Unlike the earlier HTTP 503 failure, this trace recorded no `/add_to_cart/1` request or failed application response. The test started clicking while the product page scripts were still loading. The site installs its cart handlers in synchronous scripts at the end of the page, so a visible button alone does not establish that its handler is ready.

The product and cart navigation methods now wait for the destination URL and `DOMContentLoaded`. This closes the initialization gap for Add to cart and Remove without fixed sleeps or retries. The isolated SEARCH-01 recheck passed in 5.4 seconds, including cart quantity, total and removal. Its list-only run used `test-results/cart-fix/`.

## Earlier evidence

These checks predate the suite split and are not evidence of a clean current full run:

- The former combined suite passed 16/16 in 27.0 seconds. Three headed smoke cases also passed with live ads enabled in 16.6 seconds.
- A subsequent combined run had 13 passes and three HTTP 503 failures. One occurred during cleanup verification; a separate API check later confirmed that account was absent.
- REG-01 passed with empty optional `company` and `address2` values in 12.5 seconds.
- A disposable failure-path test created an account, deliberately failed an assertion, then completed fixture deletion and absence verification. A separate API request confirmed response code 404. The temporary test and credential file were removed.
- A mocked reporting-failure probe confirmed DELETE ran before a deliberate attachment error. This protects cleanup from report-writing failures; it does not prove recovery when the API itself is unavailable.

## Reliability decisions

Navigation clicks return without waiting for full page loading, and tests assert a meaningful destination locator. Search, product details and cart navigation also wait for the destination URL and DOM content to avoid stale results and clicks before script initialization. No fixed sleeps or automatic retries are used.

Main-frame response timings are attached for diagnosis. The inspected traces proved server overload for the four failures in that run, but do not establish the cause of every timeout. Increasing assertion timeouts would not repair an HTTP 503 response.

Repeated runs of the same suite must use separate report/output folders or execute sequentially. The E2E and helper configs now use distinct folders. Hosted report uploads still need verification after the repository is published.
