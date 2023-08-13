# connectedpapers-js
The JS client for the connected papers API.

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

const client = new ConnectedPapersClient();
client.getGraph({paper_id: DEEPFRUITS_PAPER_ID, fresh_only: true}).then((paper) => {
  console.log(paper);
});
client.getRmainingUsages().then((remainingUses) => {
  console.log(`Remaining uses: ${remainingUses}`);
});
client.getFreeAccessPapers().then((freeAccessPapers) => {
  console.log(`Free access papers: ${freeAccessPapers}`);
});
```

## API
The following async functions are part of the connected papers API:
* `getPaper({paper_id: string, fresh_only: boolean})`: Returns the paper with the given id. If `fresh_only` is true, then if the graph is over 30 days old, the call will wait for a rebuild.
* `getRmainingUsages()`: Returns the number of remaining usages for the current API key.
* `getFreeAccessPapers()`: Returns the number of free access papers for the current API key.

## Free access papers
If you have accessed a paper's graph in the last 30 days, 
accessing it again will not count towards your usage limit
on subsequent calls. This is called a free access paper.

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
}

export type GraphResponse = {
  status: GraphResponseStatuses;
  graph_json?: Graph;
  progress?: number;
};
```
Once the status is one of `BAD_ID`, `ERROR`, `NOT_IN_DB`, `BAD_TOKEN`, `BAD_REQUEST`, `OUT_OF_REQUESTS`,
the iterator will stop yielding values.

Signature:
```ts
class ConnectedPapersClient {
  // ...
  public async* getGraphAsyncIterator(args: {
    paper_id: PaperId;
    fresh_only?: boolean;
    loop_until_fresh?: boolean
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

# Supplying an API key
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
