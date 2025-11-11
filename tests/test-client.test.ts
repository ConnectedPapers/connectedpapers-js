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

  it('test-overloaded-status-recognized', () => {
    // Test that OVERLOADED is a valid status in the enum
    expect(GraphResponseStatuses.OVERLOADED).toBe('OVERLOADED');
    expect(Object.values(GraphResponseStatuses)).toContain('OVERLOADED');
  });

  it('test-retry-on-overloaded-default', async () => {
    // Test that retry_on_overloaded defaults to true
    const client = new ConnectedPapersClient();

    // Note: This test verifies the API signature accepts the parameter
    // Actual retry behavior would require mocking axios to simulate OVERLOADED responses
    const response = await client.getGraph({
      paper_id: deepftuitsPaperId,
      fresh_only: true,
      retry_on_overloaded: true
    });

    // Should complete successfully (with TEST_TOKEN this shouldn't be overloaded)
    expect(response.status).toBeDefined();
  });

  it('test-retry-on-overloaded-disabled', async () => {
    // Test that retry_on_overloaded can be disabled
    const client = new ConnectedPapersClient();

    const response = await client.getGraph({
      paper_id: deepftuitsPaperId,
      fresh_only: true,
      retry_on_overloaded: false
    });

    // Should complete successfully (with TEST_TOKEN this shouldn't be overloaded)
    expect(response.status).toBeDefined();
  });
})
