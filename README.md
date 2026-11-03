# connectedpapers-js
The JS client for the connected papers API.

## Development and CI

Use Node 26 and Yarn 1.22.22 to develop the SDK:

```bash
yarn install --frozen-lockfile
yarn typecheck
yarn lint:check
yarn test --runInBand
yarn build
yarn test:package
```

`yarn typecheck` runs native TypeScript 7 through the `@typescript/native` alias.
The `typescript` dependency aliases Microsoft's `@typescript/typescript6`
compatibility package, which supplies the classic compiler API needed by
TypeScript ESLint, ts-jest and declaration generation. Keep both packages until
those integrations support the native compiler API; the bridge is intentional.

The maintained XO flat config includes TypeScript rules and formatting. Use
`yarn lint` to apply fixes; `yarn lint:check` does not modify files. The 19 Jest
HTTP fixture and fake-timer tests are offline and need no API key or graph quota.

`tsdown` builds CommonJS, ESM, declarations and source maps. `yarn test:package`
installs the actual tarball outside the checkout, makes localhost HTTP calls
through both module formats, and compiles CJS/ESM consumers using native TS7
and the classic compiler. CI runs the frozen-lock checks on Linux Node 22, 24
and 26, plus Windows Node 22 and 26. Generated `dist` files are not committed;
`prepack` builds them for packaging. Publishing remains a separate action.

## Runtime support

The SDK requires Node 22 or newer. We qualify the latest patches of maintained
Node release families, currently 22, 24 and 26, separately from the Node 26 build
runtime. Keep this policy, package engines and the CI matrix aligned during
maintenance. The CJS/ESM entry filenames and existing published subpaths remain
available, including the existing default-import interop at the package root.
Explicit ESM imports use `connectedpapers-js/dist/index.mjs` and its matching
declarations.

This unreleased maintenance update replaces the previously unspecified Node
minimum with Node >=22. The package version remains unchanged until release.

For an explicit live check, set `CONNECTED_PAPERS_API_KEY` and run
`yarn test:integration`. This contacts the real API and may use graph quota.
Without a key the live test is skipped. Do not run it in ordinary CI.

## Dependency maintenance notes

The full lock refresh removes the high-severity matches observed during this
migration. The runtime-only audit reports no advisory matches. The
full development audit still reports low/moderate findings in these upstream
constraints (checked 3 November 2026):

- ESLint and TypeScript ESLint retain [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249)
  majors below patched 11.x. Jest/Babel coverage tooling retains
  [glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) majors below patched 14.x;
  even current test-exclude 8 still selects glob 13/minimatch 10.
- XO's Markdown dependency selects micromark-extension-math 3, which constrains
  [KaTeX](https://github.com/advisories/GHSA-238p-pmpm-9mq7) to 0.16; the reported fix is in a newer incompatible line. SDK lint is
  scoped to TypeScript source, not Markdown rendering.
- Jest's configuration loader uses [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
  4.3.1, for which the advisory
  currently lists no fixed release.

Recheck released parent dependencies when these constraints change, refresh the
compatible lock and rerun the existing checks. These are unresolved development
findings, not a zero-advisory exception or evidence of runtime exposure. Do not
force incompatible transitive majors just to silence the audit. The runtime
and development graphs can be checked separately with `yarn audit --groups
dependencies` and `yarn audit`.

## Installation
For npm:
```bash
npm install connectedpapers-js
```
For yarn:
```bash
yarn add connectedpapers-js
```

## Usage
```js
import { ConnectedPapersClient } from 'connectedpapers-js';

const DEEPFRUITS_PAPER_ID = "9397e7acd062245d37350f5c05faf56e9cfae0d6"

const client = new ConnectedPapersClient({access_token: "TEST_TOKEN"});
client.getGraph({paper_id: DEEPFRUITS_PAPER_ID, fresh_only: true}).then((paper) => {
  console.log(paper);
});
client.getRemainingUsages().then((remainingUses) => {
  console.log(`Remaining uses: ${remainingUses}`);
});
client.getFreeAccessPapers().then((freeAccessPapers) => {
  console.log(`Free access papers: ${freeAccessPapers}`);
});
```

## API
The following async functions are part of the connected papers API:
* `getGraph({paper_id: string, fresh_only?: boolean, retry_on_overloaded?: boolean})`: Returns the paper with the given ID. If fresh_only is true, then if the graph is over 30 days old, the call will wait for a rebuild. If retry_on_overloaded is true (default), automatically retries when receiving OVERLOADED status.
* `getRemainingUsages()`: Returns the number of remaining usages for the current API key.
* `getFreeAccessPapers()`: Returns the number of free access papers for the current API key.

## Free access papers
If you've already accessed a paper's graph within the past
30 days, any additional access to the same graph during
this period won't be counted against your usage limit.
Such repeated access is considered "free," and the paper
in question is referred to as a "free access paper."

## Rate Limiting and OVERLOADED Status

The Connected Papers API implements per-API-key rate limiting (default: 5 builds per minute). When rate limits are exceeded or the system is overloaded, the API returns an `OVERLOADED` status.

### Automatic Retry on OVERLOADED

By default, the client automatically retries requests when receiving an `OVERLOADED` status with exponential backoff delays:
- 1st retry: 5 seconds
- 2nd retry: 10 seconds
- 3rd retry: 20 seconds
- 4th retry: 40 seconds

After 4 retry attempts, the `OVERLOADED` status is returned to the caller.

### Disabling Automatic Retry

You can disable automatic retry by setting `retry_on_overloaded: false`:

```js
const response = await client.getGraph({
  paper_id: PAPER_ID,
  fresh_only: true,
  retry_on_overloaded: false
});

if (response.status === GraphResponseStatuses.OVERLOADED) {
  console.log("System is overloaded, please try again later");
}
```

### Higher Rate Limits

If you need higher rate limits for your use case, please contact us at `hello@connectedpapers.com`.

## Supplying an API key
There are two ways to supply an API key to the client:
* Set the `CONNECTED_PAPERS_API_KEY` environment variable.
```bash
export CONNECTED_PAPERS_API_KEY="<your api key>"
```
Then create the client without any arguments:
```js
const client = new ConnectedPapersClient();
```
* Pass the API key as an argument to the constructor:
```js
const client = new ConnectedPapersClient({access_token: "<your api key>"});
```

## Getting an API key
To get an early-access API key, contact us at
`hello@connectedpapers.com`.

You can use the API key `TEST_TOKEN` to access the graph of
the paper with ID `9397e7acd062245d37350f5c05faf56e9cfae0d6` for 
testing purposes.

## Paper IDs
We use ShaIDs by [Semantic Scholar](https://www.semanticscholar.org/) as paper IDs.
You can find the ShaID of a paper by going to its Semantic Scholar page and
copying the ID from the URL. For example, the ShaID of the paper
[DeepFruits: A Fruit Detection System Using Deep Neural Networks](https://www.semanticscholar.org/paper/DeepFruits%3A-A-Fruit-Detection-System-Using-Deep-Bargoti-Underwood/9397e7acd062245d37350f5c05faf56e9cfae0d6)
is `9397e7acd062245d37350f5c05faf56e9cfae0d6`.

## Async iterator access
The client also supports async iterator access to the API. This is useful for
tracking the progress of graph builds and getting existing as well as rebuilt papers.

Calling the `getGraphAsyncIterator` returns an async iterator that yields
the GraphResponse type:
```ts
export enum GraphResponseStatuses {
  BAD_ID = 'BAD_ID',
  ERROR = 'ERROR',
  NOT_IN_DB = 'NOT_IN_DB',
  OLD_GRAPH = 'OLD_GRAPH',
  FRESH_GRAPH = 'FRESH_GRAPH',
  IN_PROGRESS = 'IN_PROGRESS',
  QUEUED = 'QUEUED',
  BAD_TOKEN = 'BAD_TOKEN',
  BAD_REQUEST = 'BAD_REQUEST',
  OUT_OF_REQUESTS = 'OUT_OF_REQUESTS',
  OVERLOADED = 'OVERLOADED',
}

export type GraphResponse = {
  status: GraphResponseStatuses;
  graph_json?: Graph;
  progress?: number;
};
```
Once the status is one of `BAD_ID`, `ERROR`, `NOT_IN_DB`, `BAD_TOKEN`, `BAD_REQUEST`, `OUT_OF_REQUESTS`, or `OVERLOADED` (after retries if enabled),
the iterator will stop yielding values.

Signature:
```ts
class ConnectedPapersClient {
  // ...
  public async* getGraphAsyncIterator(args: {
    paper_id: PaperId;
    fresh_only?: boolean;
    loop_until_fresh?: boolean;
    retry_on_overloaded?: boolean;
  }): AsyncGenerator<GraphResponse>;
}
```
Call with `fresh_only = false`, `loop_until_fresh = true`
to get the currently existing graph and keep waiting for a rebuild.

The response will have status `GraphResponseStatuses.OLD_GRAPH` in the first response, then
it will go throught the `GraphResponseStatuses.QUEUED`, `GraphResponseStatuses.IN_PROGRESS` states
with the progress field set to the percentage of the graph build that is done. When
the rebuild is done, the status will be `GraphResponseStatuses.FRESH_GRAPH` and the loop
will stop. The `graph_json` field will have the graph at each of these responses.
