import axios from 'axios';
import {ConnectedPapersClient, GraphResponseStatuses as Status} from '../src/connected_papers_client';

jest.mock('axios');
const get = jest.mocked(axios.get);
const client = () => new ConnectedPapersClient({access_token: 'local-key', server_addr: 'http://unused.invalid'});
const response = (status: string, extra = {}) => ({status: 200, data: {status, ...extra}});

beforeEach(() => {
  jest.useFakeTimers();
  get.mockReset();
  // Fail closed if an unexpected extra request is made.
  get.mockRejectedValue(new Error('Unexpected request'));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('polls with fresh requests, carries the cached graph, and stops at fresh', async () => {
  const cached = {start_id: 'cached'};
  const fresh = {start_id: 'fresh'};
  get.mockResolvedValueOnce(response(Status.OLD_GRAPH, {graph_json: cached}))
    .mockResolvedValueOnce(response(Status.IN_PROGRESS, {progress: 42}))
    .mockResolvedValueOnce(response(Status.FRESH_GRAPH, {graph_json: fresh}));
  const iterator = client().getGraphAsyncIterator({paper_id: 'paper', loop_until_fresh: true});
  expect((await iterator.next()).value).toEqual({status: Status.OLD_GRAPH, graph_json: cached});
  const next = iterator.next();
  await jest.advanceTimersByTimeAsync(999);
  expect(get).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(1);
  expect((await next).value).toEqual({status: Status.IN_PROGRESS, progress: 42, graph_json: cached});
  const last = iterator.next();
  await jest.advanceTimersByTimeAsync(1000);
  expect((await last).value).toEqual({status: Status.FRESH_GRAPH, graph_json: fresh});
  expect((await iterator.next()).done).toBe(true);
  expect(get.mock.calls.map(call => call[0])).toEqual([
    'http://unused.invalid/papers-api/graph/0/paper',
    'http://unused.invalid/papers-api/graph/1/paper',
    'http://unused.invalid/papers-api/graph/1/paper',
  ]);
});

it('backs off for 5, 10, 20, 40 seconds then returns overloaded', async () => {
  get.mockResolvedValue(response(Status.OVERLOADED));
  const result = client().getGraph({paper_id: 'paper'});
  await jest.advanceTimersByTimeAsync(0);
  for (const [index, delay] of [5000, 10000, 20000, 40000].entries()) {
    await jest.advanceTimersByTimeAsync(delay - 1);
    expect(get).toHaveBeenCalledTimes(index + 1);
    await jest.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(index + 2);
  }
  await expect(result).resolves.toEqual({status: Status.OVERLOADED});
  expect(jest.getTimerCount()).toBe(0);
});

it('recovers from overload and resets backoff after a successful poll', async () => {
  get.mockResolvedValueOnce(response(Status.OVERLOADED))
    .mockResolvedValueOnce(response(Status.QUEUED))
    .mockResolvedValueOnce(response(Status.OVERLOADED))
    .mockResolvedValueOnce(response(Status.FRESH_GRAPH));
  const iterator = client().getGraphAsyncIterator({paper_id: 'paper', loop_until_fresh: true});
  const first = iterator.next();
  await jest.advanceTimersByTimeAsync(5000);
  expect((await first).value.status).toBe(Status.QUEUED);
  const last = iterator.next();
  await jest.advanceTimersByTimeAsync(6000);
  expect((await last).value.status).toBe(Status.FRESH_GRAPH);
  expect(get).toHaveBeenCalledTimes(4);
  expect((await iterator.next()).done).toBe(true);
});

it('retries transport failures twice and preserves the final error', async () => {
  const error = new Error('connection reset');
  get.mockRejectedValue(error);
  const assertion = expect(client().getGraph({paper_id: 'paper'})).rejects.toBe(error);
  await jest.advanceTimersByTimeAsync(9999);
  expect(get).toHaveBeenCalledTimes(2);
  await jest.advanceTimersByTimeAsync(1);
  await assertion;
  expect(get).toHaveBeenCalledTimes(3);
  expect(jest.getTimerCount()).toBe(0);
});

it('recovers from a transient transport error', async () => {
  get.mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce(response(Status.FRESH_GRAPH));
  const result = client().getGraph({paper_id: 'paper'});
  await jest.advanceTimersByTimeAsync(5000);
  await expect(result).resolves.toEqual({status: Status.FRESH_GRAPH});
  expect(get).toHaveBeenCalledTimes(2);
});

it.each([Status.BAD_ID, Status.BAD_TOKEN, Status.NOT_IN_DB, Status.BAD_REQUEST, Status.ERROR, Status.OUT_OF_REQUESTS, 'NEW_STATUS'])(
  'terminates for status %s without polling', async status => {
    get.mockResolvedValueOnce(response(status));
    await expect(client().getGraph({paper_id: 'paper'})).resolves.toEqual({
      status: status === 'NEW_STATUS' ? Status.ERROR : status,
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  },
);

it('returns the current progress when looping is disabled', async () => {
  get.mockResolvedValueOnce(response(Status.QUEUED));
  await expect(client().getGraph({paper_id: 'paper'})).resolves.toEqual({status: Status.QUEUED});
  expect(get).toHaveBeenCalledTimes(1);
});
