# Risk-based test design

These cases were designed from the requested user journeys and observed UI behavior, independently of the site's published test-case list.

## Scope and priorities

P0 protects the two primary customer outcomes: creating an authenticated account and finding/purchasing the intended item. P1 protects common mistakes and search recovery. P2 cases remain exploratory because their expected behavior requires a product decision, or their value is lower than the core paths. The public site is a shared external dependency: tests own accounts and browser sessions, but cannot provision its product catalogue.

Every automated test gets a fresh browser context. Every registration test, including validation cases, gets a unique plus-address email and a teardown that attempts deletion and confirms login no longer works. Product tests use the existing read-only catalogue; each cart is isolated by its anonymous session. The cart journey explicitly removes its item; context disposal also discards the anonymous session on failure.

## Automated registration cases

| ID / priority | Preconditions and actions | Expected result |
| --- | --- | --- |
| REG-01 / P0 | Fresh identity; open home → Signup / Login; submit name/email; complete title, date of birth, password and address details; create account; continue | Creation confirmation; correct logged-in name and Logout link; API confirms credentials work. Teardown deletes and verifies absence. |
| REG-02 / P0 | Create a unique account through API; submit its email through signup | Exact duplicate-email error; signup remains available; no authenticated Logout link. Original fixture account is deleted. |
| REG-03-name / P1 | Fill email, leave name empty; submit | Native `valueMissing`; focus on name; remain on login page. |
| REG-03-email / P1 | Fill name, leave email empty; submit | Native `valueMissing`; focus on email; remain on login page. |
| REG-04 / P1 | Submit a unique malformed address without `@` | Native `typeMismatch`; remain on login page. Locale-dependent browser tooltip text is not asserted. |
| REG-05 / P1 | Start with a complete valid details form; independently clear password, first name, last name, address, state, city, postcode or mobile; submit | Eight isolated cases: missing field focused, native `valueMissing`, no creation confirmation, remain on signup page. |

The valid form deliberately leaves newsletter/partner marketing opt-ins unchecked. Tests must not subscribe test addresses to communications. Company and second address are populated in the happy path but are not treated as required.

## Automated search cases

| ID / priority | Preconditions and actions | Expected result |
| --- | --- | --- |
| SEARCH-01 / P0 | Open Products; search configured exact name; inspect every result; open exact matching card; change quantity; Add to cart; View Cart | Every result name contains query; correct detail URL/name/price/availability; quantity initially 1 and editable; visible add confirmation; cart has correct product, unit price, quantity and calculated total; remove item and verify empty cart. |
| SEARCH-02 / P1 | Search UUID-based nonexistent term, then a known product in the same session | Searched Products heading, zero cards; subsequent valid search recovers and shows matching results. |
| SEARCH-03-partial / P1 | Search configured partial name term (`blue`) | Nonempty results; every product name matches case-insensitively; configured known product is present. |
| SEARCH-03-uppercase / P1 | Search uppercased known name | Nonempty relevant results and known product present. |
| SEARCH-04 / P1 | Capture catalogue names; submit an empty query | The All Products heading and the same ordered catalogue remain available. This is the site's current behavior, not a proposed requirement. |

## Additional designed cases and decisions

| ID / priority | Test design | Expected result / reason not in the default suite |
| --- | --- | --- |
| REG-06 / P1 | Complete only mandatory account details, leaving DOB/title/company/address2 empty | Account created and authenticated; useful additional positive path, deferred behind full-form coverage. |
| REG-07 / P2 | Retry the duplicate email with case variations and surrounding whitespace | Product owner must specify email normalization policy before asserting a contract. |
| REG-08 / P2 | Unicode/apostrophes/hyphens in names and address | Values preserved and safely displayed; requires agreed supported-character policy. |
| REG-09 / P2 | Password length boundaries and weak passwords | Requires an explicit password policy; do not invent acceptance rules from assumptions. |
| REG-10 / P2 | Refresh/back/double-submit during creation | At most one account; useful race exploration, but destructive timing tests are unsuitable for routine load on a shared demo. |
| SEARCH-05 / P2 | Surround query with spaces | Decide whether trimming is required; assess observed behavior before making a gate. |
| SEARCH-06 / P2 | Query punctuation, Unicode, and a very long string | No server error or unsafe rendering; clarify matching and length requirements. |
| CART-02 / P1 | Enter zero, negative, decimal and nonnumeric quantity; click Add to cart | Invalid quantities must not be added. Native `min=1` alone does not guarantee the JavaScript button enforces it; retain as focused exploratory validation. |
| RES-01 / P2 | Fail product/account requests or simulate poor connectivity in a controlled environment | Useful actionable error and recovery; fault injection deferred because this suite validates the real third-party service. |

## Oracles and exit criteria

Product expectations come from versioned, configurable fixture data, not a live API that could repeat the same application bug. Empty search compares against the catalogue observed before submission. Search relevance is checked for every card, avoiding the false confidence of checking only the first result. The known exact product must be unique.

Release evidence requires type checking and a complete parallel run without failures. CI retries once for diagnostics, but a retry-pass is still a flaky result requiring investigation; it is not equivalent to a clean first-pass run. Cleanup failures fail the test. Changes to catalogue data should be reviewed and applied to configuration, not hidden by weakened assertions.

Live discovery: `top` also matches category metadata, including Little Girls Mr. Panda Shirt in Tops & Shirts. The partial-name case uses `blue` to exercise multiple name matches. A future category-search case should validate category metadata rather than incorrectly require every displayed name to include the term.

## Ad-handling checks

- ADS-01: Serve a controlled Google ad iframe with a close control. A blocked page action resumes after dismissal, while the cart confirmation remains visible.
- ADS-02: Open a known advertising tab and an application tab. The advertising tab closes; the application tab remains usable.

These two checks use controlled responses. They verify the handler boundaries separately from the 18 live end-to-end cases.
