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


test('patch sync accepts a valid bearer token and returns fresh state without refetching', async () => {
  const current = {
    version: '16.23.1',
    checkedAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    source: 'https://ddragon.leagueoflegends.com'
  };
  const bucket = {
    async get(key: string) {
      return key === 'patch/current.json' ? { json: async () => current } : null;
    },
    async put() { throw new Error('fresh catalog must not be rewritten'); },
    async delete() { throw new Error('fresh catalog must not be deleted'); }
  };
  const response = await worker.fetch(new Request('https://aegis.example/api/patch/sync', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + 'a'.repeat(40) }
  }), { PATCH_SYNC_TOKEN: 'a'.repeat(40), BUCKET: bucket });
  assert.equal(response.status, 200);
  const body = await response.json() as { status: string; version: string };
  assert.equal(body.status, 'fresh');
  assert.equal(body.version, '16.23.1');
});
