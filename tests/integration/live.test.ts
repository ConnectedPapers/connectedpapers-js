import {ConnectedPapersClient, GraphResponseStatuses} from '../../src/connected_papers_client';

// Run explicitly with test:integration; ordinary CI never uses the service.
const liveTest = process.env.CONNECTED_PAPERS_API_KEY ? it : it.skip;
liveTest('fetches the documented test paper', async () => {
  const paper = '9397e7acd062245d37350f5c05faf56e9cfae0d6';
  const response = await new ConnectedPapersClient().getGraph({paper_id: paper, fresh_only: true});
  expect(response.status).toBe(GraphResponseStatuses.FRESH_GRAPH);
  expect(response.graph_json?.start_id).toBe(paper);
}, 120000);
