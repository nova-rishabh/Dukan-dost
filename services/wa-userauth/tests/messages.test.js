import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.js';

describe('POST /api/v1/messages/send', () => {
  let server;
  let baseUrl;
  const sent = [];
  const apps = new Map([['dukaan_test', 'secret_test_value_123456']]);
  const adapter = {
    getStatus: () => 'CONNECTED',
    sendMessage: async (to, text) => {
      sent.push({ to, text });
      return { success: true, delivered: true, id: `m${sent.length}` };
    },
  };
  const post = (body) =>
    fetch(`${baseUrl}/api/v1/messages/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const ok = { appKey: 'dukaan_test', appSecret: 'secret_test_value_123456', to: '+15550000001', text: 'Namaste' };

  before(async () => {
    const app = createApp({ adapter, allowedApps: apps, maxPerMinute: 3 });
    server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${s.address().port}`;
        resolve(s);
      });
    });
  });
  after(() => server.close());

  test('rejects missing or wrong credentials and sends nothing', async () => {
    assert.equal((await post({ ...ok, appSecret: 'wrong' })).status, 401);
    assert.equal((await post({ ...ok, appKey: 'other' })).status, 401);
    assert.equal((await post({ to: ok.to, text: ok.text })).status, 401);
    assert.equal(sent.length, 0);
  });

  test('rejects bad numbers and bad text', async () => {
    assert.equal((await post({ ...ok, to: 'abc' })).status, 400);
    assert.equal((await post({ ...ok, text: '   ' })).status, 400);
    assert.equal((await post({ ...ok, text: 'x'.repeat(1001) })).status, 400);
    assert.equal(sent.length, 0);
  });

  test('sends through the adapter, then rate limits', async () => {
    const a = await post(ok);
    assert.equal(a.status, 200);
    const body = await a.json();
    assert.equal(body.success, true);
    assert.equal(body.simulated, false);
    assert.equal(sent[0].to, '+15550000001');
    assert.equal((await post(ok)).status, 200);
    assert.equal((await post(ok)).status, 200);
    assert.equal((await post(ok)).status, 429);
  });
});
