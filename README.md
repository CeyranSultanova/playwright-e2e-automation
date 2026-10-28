# playwright-e2e

Playwright and TypeScript tests for registration and product search on [Automation Exercise](https://automationexercise.com).

The live E2E suite has 14 tests: 9 for registration and 5 for search and cart. Three smoke tests cover account creation, duplicate email rejection, and finding a product and adding it to the cart. Two ad-helper checks run separately against controlled HTML; they do not count as live application coverage.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npx playwright install --with-deps chromium
npm run typecheck
npm test
```

Tests run with two workers and `fullyParallel: true`, including cases in the same file. Each test has a fresh browser context, and registration accounts are test-scoped. No shared account or execution order is required. Two workers keep the run short without sending excessive traffic to the shared public site.

```sh
npm run test:headed       # Watch the browser
npm run test:smoke        # Run the three main journeys
npm run test:ui           # Open the interactive runner
npm run test:helpers      # Check ad handlers against controlled HTML
npm run report           # Open the HTML report
npm run report:helpers   # Open the ad-helper report
npm test -- --grep REG-02 # Run one case
```

Repeated runs of the same suite share report folders; run them sequentially in one checkout. E2E and helper checks have separate output folders.

## Configuration

Copy `.env.example` to `.env` to change the defaults. Environment variables override `.env`.

| Variable | Default | Use |
| --- | --- | --- |
| `BASE_URL` | `https://automationexercise.com` | Target for UI and API requests |
| `TEST_DATA_FILE` | `config/test-data.json` | JSON file containing user and product data |
| `WORKERS` | `2` | Number of parallel workers |
| `BROWSERS` | `chromium` | Comma-separated browser names |
| `BLOCK_ADS` | `true` | Set to `false` to load real ads |

Edit [config/test-data.json](config/test-data.json) to change the name, address, email prefix/domain, password or product expectations. A replacement file must use the same structure. Optional `company` and `address2` values may be empty strings. The target must have compatible UI/API routes and the configured product. Keep `price` and `unitPrice` consistent, and use a quantity greater than one.

For another browser, install it first, then select it:

```sh
npx playwright install firefox
BROWSERS=firefox npm test
```

Chromium is the browser used for local verification and CI. Test, assertion, action, navigation, API and cleanup timeouts are configurable through the `*_TIMEOUT_MS` variables in `.env.example`.

## How the suite is organised

```text
playwright-e2e/
├── .github/
│   └── workflows/
│       └── e2e.yml
├── config/
│   └── test-data.json
├── checks/
│   └── ad-handling.spec.ts
├── docs/
│   ├── test-design.md
│   └── validation.md
├── pages/
│   ├── cart-page.ts
│   ├── product-page.ts
│   ├── products-page.ts
│   └── signup-page.ts
├── support/
│   ├── accounts.ts
│   ├── ads.ts
│   ├── fixtures.ts
│   └── settings.ts
├── tests/
│   ├── registration.spec.ts
│   └── search.spec.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts
├── playwright.checks.config.ts
├── README.md
└── tsconfig.json
```

- `tests/` contains the scenarios and assertions. Case IDs link to [the test design](docs/test-design.md).
- `checks/` verifies ad-helper behavior independently of live ad delivery. Its config inherits the shared browser and timeout settings.
- `pages/` contains locators and actions for signup, product search, product details and cart. Business assertions stay in the test files; a shared search assertion lives in `search.spec.ts`.
- `support/` handles configuration, account setup/cleanup and ads.
- `.github/workflows/e2e.yml` runs the suite in GitHub Actions.

Locators use `data-qa` and accessible roles where possible. Product cards and cart rows need a few CSS selectors because the site has no test IDs for them. Playwright assertions wait for the expected UI state; `networkidle` is avoided because ad requests can keep the page busy. Product and cart navigation also wait for `DOMContentLoaded`: their buttons can become visible before the synchronous cart script attaches click handlers. Native validity flags and the unchanged form URL prove validation; focus is not a business requirement. The cart's quantity and total prove that quantity entry and Add to cart work together.

Four required-field checks cover credentials, identity, delivery and contact details: password, first name, address and mobile. Each clears one field from a valid form and checks browser validity flags. Other required fields remain in the manual design to limit repeated browser/API work on the shared site.

## Accounts and cleanup

Each registration test generates a unique email, display name and password from the configured template. Emails use `ceyrantest+<UUID>@gmail.com`. Names include a short run suffix, and passwords include the full UUID. Country, date of birth and address values stay valid and configurable; catalogue expectations stay fixed so tests can detect unexpected product changes. The successful registration uses the full UI; the duplicate-email test creates its starting account through the [public API](https://automationexercise.com/api_list).

Tests mark an account immediately after the create request completes. Only marked accounts enter the fixture's cleanup `finally` block, so validation-only cases do not send unnecessary delete/verify requests. Cleanup still runs after a marked test fails and has its own timeout. It accepts deletion response codes 200 (deleted) or 404 (already absent), then requires the login API to return 404 for those credentials. HTTP, schema or unexpected application responses fail the test; a failed deletion request stops further verification. API helpers check transport and response shape, while business assertions stay in the tests.

The `account-email` attachment is written only after deletion and absence verification succeed, so reporting cannot prevent cleanup. Forced termination or an unavailable API can leave an account behind; if the attachment is missing, inspect the signup/API request in the failure trace to recover its email. Newsletter and partner-offer checkboxes stay unchecked.

The cart test removes its item after its assertions succeed. If it fails earlier, Playwright disposes its isolated browser context; there is no API cart cleanup or guarantee that server-side session data is purged.

## Ads and pop-ups

Known advertising domains are blocked before navigation. If an ad loads, the handler clicks its close control inside a recognized ad frame. It also closes tabs that navigate to known ad domains. The cart confirmation and application tabs remain available; `npm run test:helpers` checks both behaviors with intercepted responses.

To try the suite with real ads enabled:

```sh
BLOCK_ADS=false npm run test:headed
```

Close handlers stay active in this mode and apply to the Playwright browser only. `AD_DOMAINS` controls the provider list. New providers or consent dialogs may need additional handling. The helper checks cover known frame/tab patterns, not every live advertising provider; their synthetic pages do not need application Page Objects.

## CI and reports

GitHub Actions runs on pull requests, pushes to `main`, and manual dispatch. It installs locked dependencies and Chromium, checks TypeScript, then runs the helper checks and live E2E suite. CI defaults to one worker because the target is a shared public service that returns queue-full responses under concurrent traffic; the `WORKERS` repository variable can override this when using a controlled target. The E2E step still runs if a helper check fails, provided type checking passed. Either suite's failure fails the job. Repository variables `BASE_URL`, `WORKERS` and `TEST_DATA_FILE` override the target, concurrency and data file.

HTML reports are in `playwright-report/e2e/` and `playwright-report/checks/`. JUnit XML and diagnostics are in the corresponding `test-results/e2e/` and `test-results/checks/` folders. The workflow uploads both parent folders as a seven-day artifact, including on failure. Download it from the Actions run and open the relevant HTML report with Playwright. This publishes a downloadable artifact, not a public report website. Traces, screenshots and videos are retained on failure and can contain credentials; use test data only.

Retries are disabled locally and in CI. Every failed attempt remains a failed run. Automatic cancellation of an active CI run is disabled to give account cleanup a chance to finish.

## Findings and limits

- Search matches categories too: `top` returns some shirts. The partial-name test uses `blue` and checks every result name.
- Empty search shows the full catalogue.
- The public site has produced navigation/API timeouts and HTTP 503 overload responses. Navigation clicks return without waiting for page loading; the next locator assertion checks readiness. Search waits for its query URL and DOM content to avoid reading previous results. Main-frame response timing is attached for diagnosis. See [execution results](docs/validation.md) for actual outcomes.
- Product data belongs to the site and can change. Update expected values only after checking the change.
- Other browsers and remote CI have not been verified. Mobile, accessibility, performance and security testing are outside this suite.

Further cases and their priorities are listed in [docs/test-design.md](docs/test-design.md). Publishing requires a hosted repository; the workflow has not yet been run on GitHub.
