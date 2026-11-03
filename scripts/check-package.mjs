import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const directory = mkdtempSync(path.join(tmpdir(), 'connectedpapers-package-'));
const npm = process.platform === 'win32'
  ? path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
  : realpathSync(path.join(path.dirname(process.execPath), 'npm'));

function run(arguments_, cwd = directory) {
  return execFileSync(process.execPath, arguments_, {
    cwd,
    encoding: 'utf8',
    env: {...process.env, CONNECTED_PAPERS_API_KEY: 'packed-test'},
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

try {
  // Build first. Skip lifecycle hooks here so the tarball contains that exact build.
  const [pack] = JSON.parse(run([
    npm, 'pack', '--ignore-scripts', '--json', '--pack-destination', directory,
  ], root));
  const files = pack.files.map(file => file.path);
  for (const name of ['index.js', 'index.mjs', 'index.d.ts', 'index.d.mts']) {
    assert.ok(files.includes(`dist/${name}`), `Missing dist/${name}`);
  }
  assert.ok(files.every(file => !/^(src|tests|scripts|node_modules)\//.test(file)));
  writeFileSync(path.join(directory, 'package.json'), JSON.stringify({private: true}));
  run([npm, 'install', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error',
    path.join(directory, pack.filename)]);

  const installed = JSON.parse(readFileSync(path.join(directory, 'node_modules/connectedpapers-js/package.json')));
  assert.equal(installed.engines.node, '>=22');
  assert.deepEqual(Object.keys(installed.dependencies), ['axios']);
  for (const name of ['index.js', 'index.mjs', 'index.d.ts', 'index.d.mts']) {
    const code = readFileSync(path.join(directory, 'node_modules/connectedpapers-js/dist', name), 'utf8');
    const map = code.match(/\/\/# sourceMappingURL=(.+)/)?.[1].trim();
    if (map && !map.startsWith('data:')) {
      assert.ok(files.includes(path.posix.join('dist', map)), `Missing source map for ${name}`);
    }
  }

  const smoke = `
const server = createServer((request, response) => {
  assert.equal(request.headers['x-api-key'], 'packed-test');
  const payloads = {
    '/papers-api/remaining-usages': {remaining_uses: 7},
    '/papers-api/free-access-papers': {papers: ['paper']},
    '/papers-api/graph/1/paper': {status: 'FRESH_GRAPH', graph_json: {start_id: 'paper'}},
  };
  assert.ok(request.url in payloads, request.url);
  response.writeHead(200, {'Content-Type': 'application/json'});
  response.end(JSON.stringify(payloads[request.url]));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = new ConnectedPapersClient({server_addr: 'http://127.0.0.1:' + server.address().port});
    assert.equal(await client.getRemainingUsages(), 7);
    assert.deepEqual(await client.getFreeAccessPapers(), ['paper']);
    assert.equal((await client.getGraph({paper_id: 'paper', fresh_only: true})).graph_json.start_id, 'paper');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
`;
  writeFileSync(path.join(directory, 'consumer.cjs'), `
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {ConnectedPapersClient} = require('connectedpapers-js');
assert.ok(require.resolve('connectedpapers-js').endsWith('index.js'));
assert.equal(require('connectedpapers-js/dist/index.js').ConnectedPapersClient, ConnectedPapersClient);
${smoke}`);
  writeFileSync(path.join(directory, 'consumer.mjs'), `
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import sdk, {ConnectedPapersClient as RootClient} from 'connectedpapers-js';
import {ConnectedPapersClient} from 'connectedpapers-js/dist/index.mjs';
assert.equal(sdk.ConnectedPapersClient, RootClient);
assert.ok(import.meta.resolve('connectedpapers-js').endsWith('index.js'));
assert.ok(import.meta.resolve('connectedpapers-js/dist/index.mjs').endsWith('index.mjs'));
${smoke}`);
  run(['consumer.cjs']);
  run(['consumer.mjs']);

  const consumer = `
import {ConnectedPapersClient, type Graph, type PaperId} from 'connectedpapers-js';
const id: PaperId = 'paper';
const client = new ConnectedPapersClient({access_token: 'type-check-only'});
const graph: Promise<Graph | undefined> = client.getGraph({paper_id: id}).then(result => result.graph_json);
void graph;
// @ts-expect-error Installed declarations must reject an invalid paper ID.
client.getGraph({paper_id: 123});
`;
  writeFileSync(path.join(directory, 'consumer.mts'), consumer + `
import sdk from 'connectedpapers-js';
import {ConnectedPapersClient as EsmClient} from 'connectedpapers-js/dist/index.mjs';
const defaultClient: typeof ConnectedPapersClient = sdk.ConnectedPapersClient;
const esmGraph: Promise<Graph | undefined> = new EsmClient().getGraph({paper_id: id}).then(result => result.graph_json);
void defaultClient;
void esmGraph;
`);
  writeFileSync(path.join(directory, 'consumer.cts'), consumer);
  writeFileSync(path.join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noEmit: true},
    files: ['consumer.mts', 'consumer.cts'],
  }));
  for (const compiler of [
    path.join(root, 'node_modules/@typescript/native/bin/tsc'),
    require.resolve('typescript/bin/tsc6'),
  ]) {
    process.stdout.write(run([compiler, '--version']));
    process.stdout.write(run([compiler, '--project', path.join(directory, 'tsconfig.json')]));
  }
  console.log('Packed SDK: CJS/ESM HTTP calls, legacy subpaths and TS7/classic consumer types passed.');
} finally {
  assert.equal(path.dirname(realpathSync(directory)), realpathSync(tmpdir()));
  rmSync(directory, {recursive: true, force: true});
}
