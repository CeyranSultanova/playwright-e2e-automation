# Automation Exercise end-to-end suite

Playwright + TypeScript tests for account registration and product discovery on [Automation Exercise](https://automationexercise.com). The suite prioritizes complete customer outcomes: an authenticated new account and the intended product added to a cart with the correct quantity and total.

There are 20 independent tests: 13 registration cases, 5 search/cart cases and 2 controlled browser checks for ad handling. The original, prioritized case designs and deferred scenarios are in [docs/test-design.md](docs/test-design.md).

## Install and run

Use Node.js 22 or newer and npm. From the repository root:

```sh
npm ci
npx playwright install --with-deps chromium
npm run typecheck
npm test
```

`npm test` runs the complete suite in parallel with two workers and no local retries. Run separate Playwright commands sequentially in this checkout because they share report and artifact directories. No manually registered account or test ordering is needed. A typical run performs real writes on the configured application; use a target you are authorized to test.

```sh
npm run test:smoke       # Three business-critical journeys
npm run test:headed      # Visible browser
npm run test:ui          # Interactive runner
npm run report          # Open the last HTML report
npm test -- --grep REG-02
```

## Configuration

Copy `.env.example` to `.env` when overrides are needed. Environment variables take precedence over `.env`.

| Setting | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `https://automationexercise.com` | UI and API target, with compatible routes and catalogue |
| `TEST_DATA_FILE` | `config/test-data.json` | Complete JSON fixture file, relative to repository root or absolute |
| `WORKERS` | `2` | Positive integer; keep low to respect the shared public service |
| `BROWSERS` | `chromium` | Comma-separated selection of `chromium,firefox,webkit` |
| `BLOCK_ADS` | `true` | Set `false` to diagnose behavior with real advertising |

Names, addresses, password, email prefix/domain, date of birth, search terms, product ID, expected price/availability and cart quantity are configurable without changing test code. A replacement JSON file should preserve the supplied schema. Use a supported title/country and date; the product quantity must be an integer greater than one to exercise quantity changes. Configuration fails early for missing user fields or invalid core product values. Keep the displayed price and numeric unit price consistent.

```sh
BASE_URL=https://automationexercise.com WORKERS=2 npm test
TEST_DATA_FILE=config/test-data.json npm run test:smoke
npx playwright install firefox webkit
BROWSERS=chromium,firefox,webkit npm test
```

Only Chromium is the default acceptance gate. Additional browsers are optional and should be validated before promoting them to release gates.

## Structure and technical choices

```text
config/test-data.json        Editable synthetic user and catalogue expectations
pages/                      Small page objects for shared signup/search actions
support/accounts.ts         Unique identities and verified API lifecycle
support/fixtures.ts         Per-test ownership and advertisement isolation
support/ads.ts              Ad frame dismissal and ad-tab handling
support/settings.ts         Environment and fixture loading
tests/                     Business assertions and parameterized validation cases
docs/test-design.md        Priorities, cases, expected outcomes and exclusions
.github/workflows/e2e.yml    CI run and report artifacts
```

Page objects encapsulate repeated UI operations; business assertions stay visible in tests. There is no generic base page, arbitrary sleep, forced click or dependency between tests. Locators use the site's `data-qa` attributes and accessible roles where available. Narrow CSS selectors are used for product cards, prices, cart rows and unlabeled controls that lack test IDs. Auto-waiting locators and web-first assertions synchronize against observable UI state. Navigation avoids `networkidle`, which is inappropriate for ad-heavy pages.

The mandatory-field matrix clears one field at a time from a valid form, so each test checks its own failure cause. Native `ValidityState` checks avoid language-dependent browser validation messages.

## Data ownership and cleanup

Each registration test uses a unique plus-address alias of `ceyrantest@gmail.com`, for example `ceyrantest+8a25d419b7e1429f@gmail.com`. The suffix uses 16 random UUID hex characters and is regenerated for every retry and browser project. Set `user.emailPrefix` and `user.emailDomain` in the JSON fixture to change the base address. Duplicate-email setup uses the public API, while the successful registration journey uses the full UI. Credentials in the checked-in fixture are synthetic and must never be reused for real accounts.

Fixture teardown runs in `finally`, even if setup or a UI assertion fails after an account was created. It attempts API deletion for its own email, accepts only deletion/not-found application response codes, then calls verify-login and requires not-found. Both HTTP success and the API's JSON `responseCode` are checked because this service reports application status inside the response body. Cleanup errors remain test failures; they are not swallowed.

Product tests share only immutable catalogue expectations. Browser contexts and cookies are isolated per test. The cart case removes its item explicitly; context disposal abandons the anonymous session if an earlier step fails. No shared login state or persistent account is used.

A killed process, machine loss or unavailable deletion endpoint can prevent teardown. This third-party demo has no account-inventory API suitable for a safe global janitor. Failure traces can help identify the owned test email for manual deletion through the [public API](https://automationexercise.com/api_list); never delete accounts outside the run's ownership.

## Ads, pop-ups and reliability

An automatic fixture installs context-wide routing before any test page navigates. It blocks requests to a small explicit set of known advertising domains and their subdomains: DoubleClick, Google syndication, ad services and tag services. This prevents their overlays and click-triggered ad windows at their source. First-party application, cart and account requests remain real. Service workers are disabled so they cannot bypass routing.

If an ad still loads, a locator handler checks recognized advertising frames before UI actions and clicks their Close ad / dismissal control. This covers the Google vignette observed during live inspection. New tabs navigating to the listed ad domains are closed; application tabs remain open. The two controlled browser checks verify ad dismissal while preserving the cart confirmation and application tabs. They use local responses for ad URLs so the checks do not depend on ad delivery.

The suite does not hide arbitrary overlays, remove application DOM elements, blanket-block third parties or force clicks through obstructions. Unexpected JavaScript dialogs are dismissed and reported as errors. New ad providers or regional consent overlays may require an explicit reviewed handler. `BLOCK_ADS=false npm run test:headed` allows real ads to load while keeping the close handlers active. These handlers apply inside Playwright sessions; they do not change your normal browser settings. Blocking ads changes the page's integration environment and disables browser cache through request routing; this suite is not an advertising, consent or performance acceptance test.

## CI and reports

GitHub Actions runs on main-branch pushes, pull requests and manual dispatch. It installs the lockfile dependencies and Chromium, checks TypeScript, then runs the suite with two workers. Set repository variable `BASE_URL` to use another compatible environment. Concurrent runs are not cancelled automatically, reducing the chance of abandoning accounts during teardown.

The final `always()` step publishes downloadable HTML, JUnit and failure diagnostics as an Actions artifact retained for seven days. Download the artifact and open the HTML report with Playwright. This publishes a report artifact, not a public GitHub Pages website. Traces, screenshots and videos are retained for failed attempts. Reports can include synthetic credentials and address values; restrict artifact access and do not substitute real customer data.

CI permits one retry to collect evidence of transient failures. Investigate any flaky classification. There are no retries around account creation that could conceal duplicate side effects, and no silently skipped assertions.

## Known limitations and validation evidence

The external site's availability, catalogue changes, network restrictions and rate limits can affect results. The suite cannot seed products; configure an existing known product for another environment. Empty-query behavior is a characterization of the current site. Search also matches categories: `top` includes shirts in the `Tops & Shirts` category. The partial-name case deliberately uses `blue` to test name matching across multiple products; category search needs its own metadata-aware oracle. Whitespace normalization, password policy and invalid cart quantities are explicitly designed but deferred in the test design rather than assigned invented requirements.

See [docs/validation.md](docs/validation.md) for the actual local execution results. CI configuration is supplied, but a remote CI run requires publishing this repository. Cross-browser, mobile, accessibility, security, performance and advertising behavior are outside the default acceptance scope.

## Publishing the repository

Create an empty repository on your chosen host, then run:

```sh
git init -b main
git add .
git commit -m "Add independent Playwright registration and search suite"
git remote add origin <your-repository-url>
git push -u origin main
```

Keep `.env`, generated reports and dependencies excluded via `.gitignore`. Share the resulting repository URL as the submission. Hosting requires your repository destination and authenticated access; a local implementation is not itself a hosted deliverable.

## References

The implementation uses the site's [documented account API](https://automationexercise.com/api_list) for lifecycle operations and Playwright's [test-scoped fixtures](https://playwright.dev/docs/test-fixtures) for ownership and teardown. The test designs are specific to the requested risks and were not copied from the site's published test cases.
