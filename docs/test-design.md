# Test design

The main risks are a customer being unable to register, getting misleading search results, or adding the wrong product or quantity to the cart. The cases below follow those journeys and the site's observed behavior.

- **P0:** Main journeys; included in `npm run test:smoke`.
- **P1:** Common errors and validation; included in the full suite where automated.
- **P2:** Additional edge cases or behavior that needs a requirement clarified.

Each registration test gets a unique email and API cleanup, including the validation tests. Search tests use the shared catalogue and separate browser sessions. Case IDs match the test names; parameterized cases add a field or query variant to the ID.

## Registration

| Case | Priority | Steps | Expected result |
| --- | --- | --- | --- |
| REG-01 | P0 | Open Signup / Login from home, enter a new name/email, complete all account details, create the account and continue | Account Created confirmation, correct logged-in name and Logout link; API accepts the credentials |
| REG-02 | P0 | Create an account through the API, then try signing up with its email | Duplicate-email error; signup stays available and the user is not logged in |
| REG-03-name | P1 | Fill email, leave name empty and submit | Name has `valueMissing`, receives focus, and signup does not advance |
| REG-03-email | P1 | Fill name, leave email empty and submit | Email has `valueMissing`, receives focus, and signup does not advance |
| REG-04 | P1 | Submit an email without `@` | Email has `typeMismatch`; remain on the login page |
| REG-05 | P1 | Fill a valid details form, clear one required field and submit | Cleared field has `valueMissing` and receives focus; no account confirmation; remain on signup |

REG-05 runs for password, first name, address and mobile: credentials, identity, delivery and contact information. Clearing one field at a time avoids the first invalid field hiding a later one. Last name, state, city and postcode checks remain manual; they use the same native validation mechanism and add lower-value repeated setup against the shared service.

The happy path includes optional company/address details and date of birth. Marketing opt-ins stay unchecked. Every case attempts account deletion in teardown and verifies that the account is absent.

## Search and cart

| Case | Priority | Steps | Expected result |
| --- | --- | --- | --- |
| SEARCH-01 | P0 | Search for the configured product, open its result, change quantity, add it and open the cart | Every result name matches; correct detail URL, name, price and availability; quantity starts at 1 and can be changed; cart shows the selected product, price, quantity and calculated total |
| SEARCH-02 | P1 | Search for a unique nonexistent term, then search for the known product | Zero product cards for the first query; matching results for the second |
| SEARCH-03-partial | P1 | Search for the configured partial name, currently `blue` | Nonempty results; every name contains the term; the known product is present |
| SEARCH-03-uppercase | P1 | Search for the known name in uppercase | Matching results include the known product |
| SEARCH-04 | P1 | Record the catalogue, then submit an empty query | All Products heading and the same ordered product names |

SEARCH-01 removes its cart item and checks the empty cart. Product expectations come from the JSON fixture. The empty-query case compares against the catalogue loaded before searching.

The `top` query also matches categories: Little Girls Mr. Panda Shirt belongs to Tops & Shirts. A category-search test would need to check that metadata. Requiring every result name to contain `top` would be an incorrect expectation.

## Ad handlers

These checks use controlled responses because live ads do not appear consistently.

| Case | Steps | Expected result |
| --- | --- | --- |
| ADS-01 | Show a Google ad iframe over a page that also contains a cart confirmation; try a page action | Ad closes, action completes, cart confirmation stays visible |
| ADS-02 | Open an advertising tab and an application tab | Ad tab closes; application tab remains usable |

## Further coverage

These cases are designed but not automated in the default suite.

| Case | Priority | Check | Decision or open question |
| --- | --- | --- | --- |
| REG-05-extra | P2 | Clear last name, state, city or postcode independently | Manual checks for remaining required fields |
| REG-06 | P1 | Register with mandatory details only | Useful second positive path; full-form registration was implemented first |
| REG-07 | P2 | Duplicate email with different casing or surrounding spaces | Confirm email normalization rules |
| REG-08 | P2 | Names and addresses with Unicode, apostrophes and hyphens | Confirm supported characters and check values are preserved |
| REG-09 | P2 | Password length boundaries and weak passwords | Needs a defined password policy |
| REG-10 | P2 | Refresh, back navigation or double-submit during creation | Check that only one account is created; investigate in a controlled environment |
| SEARCH-05 | P2 | Query with leading/trailing spaces | Confirm whether trimming is required |
| SEARCH-06 | P2 | Punctuation, Unicode and long search queries | Check error handling and rendering; clarify length limits |
| CART-02 | P1 | Zero, negative, decimal or nonnumeric quantity | Check invalid quantities cannot be added; `min=1` alone does not prove the JavaScript button enforces it |
| RES-01 | P2 | Failed requests and slow connections | Check error messages and recovery in a controlled environment |

## Passing criteria

Type checking and the complete parallel suite should pass. Cleanup failures count as failures. Retries are disabled locally and in CI; failed attempts remain visible. Main-frame response timing is attached to help distinguish slow responses from UI synchronization problems. Changes to product expectations should follow a checked catalogue change.
