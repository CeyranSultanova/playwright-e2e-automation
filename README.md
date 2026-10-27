# Automation Exercise tests

Playwright and TypeScript tests for registration and product search on [Automation Exercise](https://automationexercise.com).

The suite has 16 tests: 9 for registration, 5 for search and cart, and 2 for the ad handlers. The three smoke tests cover account creation, duplicate email rejection, and finding a product and adding it to the cart.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npx playwright install --with-deps chromium
npm run typecheck
npm test
```

Tests run with two workers. Each test has its own browser context and data, so no account setup or test ordering is needed.

```sh
npm run test:headed       # Watch the browser
npm run test:smoke        # Run the three main journeys
npm run test:ui           # Open the interactive runner
npm run report           # Open the HTML report
npm test -- --grep REG-02 # Run one case
```

Run these commands one at a time in the same checkout; separate runs share the report folders.

## Configuration

Copy `.env.example` to `.env` to change the defaults. Environment variables override `.env`.

| Variable | Default | Use |
| --- | --- | --- |
| `BASE_URL` | `https://automationexercise.com` | Target for UI and API requests |
| `TEST_DATA_FILE` | `config/test-data.json` | JSON file containing user and product data |
| `WORKERS` | `2` | Number of parallel workers |
| `BROWSERS` | `chromium` | Comma-separated browser names |
| `BLOCK_ADS` | `true` | Set to `false` to load real ads |

Edit [config/test-data.json](config/test-data.json) to change the name, address, email prefix/domain, password or product expectations. A replacement file must use the same structure. The target must have compatible UI/API routes and the configured product. Keep `price` and `unitPrice` consistent, and use a quantity greater than one.

For another browser, install it first, then select it:

```sh
npx playwright install firefox
BROWSERS=firefox npm test
```

Chromium is the browser used for local verification and CI. Test, assertion, action, navigation, API and cleanup timeouts are configurable through the `*_TIMEOUT_MS` variables in `.env.example`.

## How the suite is organised

- `tests/` contains the scenarios and assertions. Case IDs link to [the test design](docs/test-design.md).
- `pages/` contains locators and actions for signup, product search, product details and cart. Business assertions stay in the test files; a shared search assertion lives in `search.spec.ts`.
- `support/` handles configuration, account setup/cleanup and ads.
- `.github/workflows/e2e.yml` runs the suite in GitHub Actions.

Locators use `data-qa` and accessible roles where possible. Product cards and cart rows need a few CSS selectors because the site has no test IDs for them. Playwright assertions wait for the expected UI state; `networkidle` is avoided because ad requests can keep the page busy.

Four required-field checks cover credentials, identity, delivery and contact details: password, first name, address and mobile. Each clears one field from a valid form and checks browser validity flags. Other required fields remain in the manual design to limit repeated browser/API work on the shared site.

## Accounts and cleanup

Each registration test generates a unique email, display name and password from the configured template. Emails use `ceyrantest+<UUID>@gmail.com`. Names include a short run suffix, and passwords include the full UUID. Country, date of birth and address values stay valid and configurable; catalogue expectations stay fixed so tests can detect unexpected product changes. The successful registration uses the full UI; the duplicate-email test creates its starting account through the [public API](https://automationexercise.com/api_list).

Cleanup runs in a test-scoped fixture with its own timeout: delete the account, then verify that its credentials no longer work. It also runs after assertion failures, and the report includes the owned email for recovery. HTTP/schema guards in API helpers and teardown checks throw errors when setup or cleanup cannot be trusted. Business response assertions stay in the tests. A cleanup failure fails the test. Newsletter and partner-offer checkboxes stay unchecked.

The cart test removes its item at the end. Each browser context also has separate session cookies. Forced termination or an unavailable API can prevent cleanup; use the email in the failure trace to check the affected account.

## Ads and pop-ups

Known advertising domains are blocked before navigation. If an ad loads, the handler clicks its close control inside a recognized ad frame. It also closes tabs that navigate to known ad domains. The cart confirmation and application tabs remain available; two controlled tests check this behavior.

To try the suite with real ads enabled:

```sh
BLOCK_ADS=false npm run test:headed
```

Close handlers stay active in this mode. They apply to the Playwright browser only. New ad providers or consent dialogs may need additional handling. `AD_DOMAINS` controls the provider list. The ad-handler tests build controlled HTML pages directly; these are test harnesses, so they do not need application Page Objects.

## CI and reports

GitHub Actions runs on pull requests, pushes to `main`, and manual dispatch. It installs dependencies and Chromium, checks TypeScript, and runs tests with two workers. Repository variables `BASE_URL`, `WORKERS` and `TEST_DATA_FILE` override the target, concurrency and data file.

HTML and JUnit reports, plus failure traces, screenshots and videos, are uploaded as an artifact for seven days, including when tests fail. Locally, reports are in `playwright-report/` and `test-results/`. They can contain test credentials, so use test data only.

Retries are disabled locally and in CI. Every failed attempt remains a failed run. Automatic cancellation of an active CI run is disabled to give account cleanup a chance to finish.

## Findings and limits

- Search matches categories too: `top` returns some shirts. The partial-name test uses `blue` and checks every result name.
- Empty search shows the full catalogue.
- The public site has produced navigation and API timeouts. Clicks that navigate now return without waiting for page loading; the next locator assertion checks readiness. Search waits for its query URL and DOM content to avoid reading results from the previous query. Each report includes main-frame response timing. See [execution results](docs/validation.md) for the investigation and latest run.
- Product data belongs to the site and can change. Update expected values only after checking the change.
- Other browsers and remote CI have not been verified. Mobile, accessibility, performance and security testing are outside this suite.

Further cases and their priorities are listed in [docs/test-design.md](docs/test-design.md). Publishing requires a hosted repository; the workflow has not yet been run on GitHub.
