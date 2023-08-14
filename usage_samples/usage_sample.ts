import {ConnectedPapersClient} from "../src/connected_papers_client";
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

async function main() {
  const graph = await getGraph();
  console.log(`Graph: ${JSON.stringify(graph)}`);
  const remainingUses = await getKeyRemainingUses();
  console.log(`Remaining uses: ${remainingUses}`);
  const freeAccessPapers = await getFreeAccessPapers();
  console.log(`Free access papers: ${freeAccessPapers}`);
}

main();
