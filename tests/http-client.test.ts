import {createServer, type Server} from 'node:http';
import {type AddressInfo} from 'node:net';
import {ConnectedPapersClient, GraphResponseStatuses} from '../src/connected_papers_client';

describe('client HTTP transport', () => {
  let server: Server;
  let client: ConnectedPapersClient;
  let requests: Array<{url?: string; key?: string | string[]}>;
  let statusCode: number;
  let payload: unknown;

  beforeEach(async () => {
    requests = [];
    statusCode = 200;
    payload = {};
    server = createServer((request, response) => {
      requests.push({url: request.url, key: request.headers['x-api-key']});
      response.writeHead(statusCode, {'Content-Type': 'application/json'});
      response.end(JSON.stringify(payload));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    client = new ConnectedPapersClient({
      access_token: 'local-test-key',
      server_addr: `http://127.0.0.1:${address.port}`,
    });
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('sends the API key and preserves graph JSON', async () => {
    payload = {status: GraphResponseStatuses.FRESH_GRAPH, graph_json: {start_id: 'paper'}};
    await expect(client.getGraph({paper_id: 'paper', fresh_only: true})).resolves.toEqual(payload);
    expect(requests).toEqual([{url: '/papers-api/graph/1/paper', key: 'local-test-key'}]);
  });

  it('returns overloaded without retry when disabled', async () => {
    payload = {status: GraphResponseStatuses.OVERLOADED};
    await expect(client.getGraph({paper_id: 'paper', retry_on_overloaded: false})).resolves.toEqual(payload);
    expect(requests).toHaveLength(1);
  });

  it('parses remaining usages', async () => {
    payload = {remaining_uses: 7};
    await expect(client.getRemainingUsages()).resolves.toBe(7);
    expect(requests).toEqual([{url: '/papers-api/remaining-usages', key: 'local-test-key'}]);
  });

  it('preserves HTTP authentication errors', async () => {
    statusCode = 401;
    payload = {error: 'bad token'};
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(client.getRemainingUsages()).rejects.toMatchObject({response: {status: 401, data: payload}});
      expect(requests).toHaveLength(1);
    } finally {
      log.mockRestore();
    }
  });
});
