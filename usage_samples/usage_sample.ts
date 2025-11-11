import {ConnectedPapersClient, GraphResponseStatuses} from "../src/connected_papers_client";
import {Graph} from "../src/graph";

async function getKeyRemainingUses(): Promise<number> {
  const client = new ConnectedPapersClient();
  return client.getRemainingUsages();
}

async function getFreeAccessPapers(): Promise<string[]> {
  const client = new ConnectedPapersClient();
  return client.getFreeAccessPapers();
}

const deepftuitsPaperId = "9397e7acd062245d37350f5c05faf56e9cfae0d6"

async function getGraph(): Promise<Graph | undefined> {
  const client = new ConnectedPapersClient();
  return client.getGraph({paper_id: deepftuitsPaperId, fresh_only: true}).then((response) => {
    return response.graph_json;
  });
}

async function getGraphWithRetry(): Promise<Graph | undefined> {
  const client = new ConnectedPapersClient();

  // Default behavior: automatically retries on OVERLOADED with exponential backoff
  const response = await client.getGraph({
    paper_id: deepftuitsPaperId,
    fresh_only: true,
    retry_on_overloaded: true // This is the default, can be omitted
  });

  if (response.status === GraphResponseStatuses.OVERLOADED) {
    console.log("System is still overloaded after retries");
    return undefined;
  }

  return response.graph_json;
}

async function getGraphWithoutRetry(): Promise<Graph | undefined> {
  const client = new ConnectedPapersClient();

  // Disable automatic retry on OVERLOADED
  const response = await client.getGraph({
    paper_id: deepftuitsPaperId,
    fresh_only: true,
    retry_on_overloaded: false
  });

  if (response.status === GraphResponseStatuses.OVERLOADED) {
    console.log("System is overloaded, will implement custom retry logic");
    // Implement your own retry logic here
    return undefined;
  }

  return response.graph_json;
}

async function main() {
  console.log("=== Basic Usage ===");
  const graph = await getGraph();
  console.log(`Graph: ${JSON.stringify(graph)}`);

  console.log("\n=== With Retry on Overloaded ===");
  const graphWithRetry = await getGraphWithRetry();
  console.log(`Graph (with retry): ${graphWithRetry ? "Retrieved" : "Failed"}`);

  console.log("\n=== Without Retry on Overloaded ===");
  const graphWithoutRetry = await getGraphWithoutRetry();
  console.log(`Graph (without retry): ${graphWithoutRetry ? "Retrieved" : "Failed"}`);

  console.log("\n=== API Information ===");
  const remainingUses = await getKeyRemainingUses();
  console.log(`Remaining uses: ${remainingUses}`);

  const freeAccessPapers = await getFreeAccessPapers();
  console.log(`Free access papers: ${freeAccessPapers.length} papers`);
}

main();
