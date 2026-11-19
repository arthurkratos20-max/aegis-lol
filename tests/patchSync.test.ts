import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/index.mjs';

test('patch sync endpoint rejects non-POST methods', async () => {
  const response = await worker.fetch(new Request('https://aegis.example/api/patch/sync'), {});
  assert.equal(response.status, 405);
});

test('patch sync endpoint fails closed when its server secret is absent', async () => {
  const response = await worker.fetch(new Request('https://aegis.example/api/patch/sync', {method:'POST'}), {});
  assert.equal(response.status, 503);
});

test('patch sync endpoint rejects an invalid bearer secret before touching storage', async () => {
  const response = await worker.fetch(new Request('https://aegis.example/api/patch/sync', {
    method:'POST', headers:{Authorization:'Bearer wrong-token'}
  }), {PATCH_SYNC_TOKEN:'a'.repeat(32)});
  assert.equal(response.status, 401);
});
