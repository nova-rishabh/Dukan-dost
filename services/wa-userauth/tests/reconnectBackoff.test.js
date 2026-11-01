import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { BerryAdapter } from '../src/messaging/berryAdapter.js';

/**
 * Regression test for the "QR changes every 3 seconds" storm: the adapter used to start a brand-new
 * WhatsApp client 2.5 s after EVERY close, with no backoff, so a client that kept closing right away
 * produced a fresh QR every few seconds. Now repeated closes back off: 2.5 s, 5 s, 10 s, 20 s, 40 s, 60 s.
 */
describe('BerryAdapter reconnect backoff', () => {
  afterEach(() => mock.timers.reset());

  function adapterWithFakeClient() {
    const adapter = new BerryAdapter({ mode: 'mock' });
    adapter.client = Object.assign(new EventEmitter(), { disconnect: async () => {} });
    adapter.setupListeners(null);
    let inits = 0;
    adapter.initialize = async () => {
      inits++;
    };
    return { adapter, inits: () => inits };
  }

  test('the first close restarts after 2.5 seconds, as before', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const { adapter, inits } = adapterWithFakeClient();
    adapter.client.emit('connection.close', { reason: 'connection_closed' });
    mock.timers.tick(2400);
    assert.equal(inits(), 0);
    mock.timers.tick(200);
    assert.equal(inits(), 1);
  });

  test('closes that keep coming back-to-back slow down instead of spinning', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const { adapter, inits } = adapterWithFakeClient();
    const delays = [];
    for (let i = 0; i < 6; i++) {
      adapter.client.emit('connection.close', { reason: 'connection_closed' });
      let waited = 0;
      const before = inits();
      while (inits() === before && waited < 70_000) {
        mock.timers.tick(500);
        waited += 500;
      }
      delays.push(waited);
    }
    assert.deepEqual(delays, [2500, 5000, 10000, 20000, 40000, 60000]);
  });

  test('a stable QR (no close for 30 s) resets the backoff', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const { adapter, inits } = adapterWithFakeClient();
    for (let i = 0; i < 3; i++) {
      adapter.client.emit('connection.close', { reason: 'connection_closed' });
      mock.timers.tick(61_000);
    }
    assert.equal(inits(), 3);
    mock.timers.tick(31_000);
    adapter.client.emit('auth.qr', { value: 'fake-qr' });
    adapter.client.emit('connection.close', { reason: 'connection_closed' });
    mock.timers.tick(2600);
    assert.equal(inits(), 4, 'after a stable stretch the next restart is quick again');
  });

  test('a manual logout does not restart at all', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const { adapter, inits } = adapterWithFakeClient();
    adapter.client.emit('connection.close', { reason: 'manual_logout' });
    mock.timers.tick(120_000);
    assert.equal(inits(), 0);
  });

  test('one restart is pending at a time, however many closes arrive', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const { adapter, inits } = adapterWithFakeClient();
    for (let i = 0; i < 5; i++) adapter.client.emit('connection.close', { reason: 'connection_closed' });
    mock.timers.tick(200_000);
    assert.equal(inits(), 1);
  });
});
