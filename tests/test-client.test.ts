import {describe} from "node:test";
import {ConnectedPapersClient, GraphResponseStatuses} from "../src/connected_papers_client";

const deepftuitsPaperId = "9397e7acd062245d37350f5c05faf56e9cfae0d6"

describe('test-connected-papers-client',async  () => {
  it('test-get-paper', async () => {
    const client = new ConnectedPapersClient();
    const response = await client.getGraph({paper_id: deepftuitsPaperId, fresh_only: true});
      expect(response.status).toBe(GraphResponseStatuses.FRESH_GRAPH);
      expect(response.graph_json).toBeDefined();
      const graph = response.graph_json;
      expect(graph?.start_id).toBe(deepftuitsPaperId);
  });
})
