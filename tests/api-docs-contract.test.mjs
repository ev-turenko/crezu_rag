import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { afterAll, beforeAll, describe, it } from 'vitest';

const TEST_PORT = process.env.API_TEST_PORT || '3310';
const BASE_URL = (process.env.API_TEST_BASE_URL || `http://127.0.0.1:${TEST_PORT}`).replace(/\/+$/, '');
const START_SERVER = process.env.API_TEST_START_SERVER === '1';
const STRICT_DOC_STATUSES = process.env.API_TEST_STRICT_DOC_STATUSES === '1';
const REQUEST_TIMEOUT_MS = Number(process.env.API_TEST_REQUEST_TIMEOUT_MS || 15_000);
const SERVER_READY_TIMEOUT_MS = Number(process.env.API_TEST_SERVER_READY_TIMEOUT_MS || 20_000);
const REPORT_PATH = process.env.API_TEST_REPORT_PATH || 'test-results/api-docs-contract-report.json';

const DEFAULT_HEADERS = {
  Accept: 'application/json, text/html, application/pdf, */*',
  'User-Agent': 'crezu-rag-api-docs-contract-test',
  'x-forwarded-for': '127.0.0.1',
};

const json = body => ({
  body,
  headers: {
    'content-type': 'application/json',
  },
});

const check = (name, fn) => ({ name, fn });

const jsonObject = check('response body is a JSON object', ({ parsed }) => {
  assert.equal(typeof parsed, 'object');
  assert.notEqual(parsed, null);
  assert.equal(Array.isArray(parsed), false);
});

const jsonArray = check('response body is a JSON array', ({ parsed }) => {
  assert.ok(Array.isArray(parsed));
});

const jsonObjectOrDependencyFailure = check('response body is JSON or a dependency failure page', ({ parsed, status, text }) => {
  if (parsed !== undefined) {
    assert.equal(typeof parsed, 'object');
    assert.notEqual(parsed, null);
    assert.equal(Array.isArray(parsed), false);
    return;
  }

  assert.ok(status >= 500, `Expected non-JSON responses only for dependency failures, got status ${status}`);
  assert.ok(text.length > 0);
});

const jsonNull = check('response body is JSON null', ({ parsed, text }) => {
  assert.equal(parsed, null);
  assert.equal(text, 'null');
});

const errorJsonHasMessage = check('JSON error response includes an error or message field', ({ status, parsed }) => {
  if (status < 400 || parsed === undefined || typeof parsed !== 'object' || parsed === null) return;

  assert.ok(
    'error' in parsed || 'message' in parsed || 'details' in parsed || 'errors' in parsed,
    `Expected an error/message/details/errors field in ${JSON.stringify(parsed)}`
  );
});

const successFlagIsTrue = check('success flag is true', ({ parsed }) => {
  assert.equal(parsed?.success, true);
});

const API_CASES = [
  {
    method: 'POST',
    path: '/api/ai/message',
    name: 'sends the documented inference payload shape and validates empty-message rejection',
    ...json({
      message: '',
      messages: [],
      params: {
        country: 2,
        provider: 373,
        client_id: 'api-test-client',
        is_guest_chat: true,
      },
    }),
    expectedStatuses: [400],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/message/stream',
    name: 'sends the documented streaming inference payload shape',
    ...json({
      message: '',
      messages: [],
      params: {
        country: 2,
        provider: 373,
        client_id: 'api-test-client',
        is_guest_chat: true,
      },
    }),
    expectedStatuses: [400, 500],
    checks: [errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/chats',
    name: 'sends the client chat lookup payload',
    ...json({ client_id: 'api-test-client' }),
    expectedStatuses: [200, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage, check('successful chat lookup has chats array', ({ parsed, status }) => {
      if (status !== 200) return;
      assert.equal(parsed.success, true);
      assert.ok(Array.isArray(parsed.chats));
    })],
  },
  {
    method: 'GET',
    path: '/api/ai/client/{client_id}/chats',
    name: 'sends the authenticated client chat list request',
    pathParams: { client_id: 'api-test-client' },
    expectedStatuses: [200, 401, 404, 500],
    checks: [errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/client/{client_id}/chats',
    name: 'sends the authenticated client chat write payload',
    pathParams: { client_id: 'api-test-client' },
    ...json({
      chat_id: 'api-test-chat',
      chat_name: 'API test chat',
    }),
    expectedStatuses: [200, 401, 404, 500],
    checks: [errorJsonHasMessage],
  },
  {
    method: 'DELETE',
    path: '/api/ai/client/{client_id}/chats/{chat_id}',
    name: 'sends the authenticated chat deletion request',
    pathParams: { client_id: 'api-test-client', chat_id: 'api-test-chat' },
    expectedStatuses: [200, 400, 401, 404, 500],
    checks: [errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/history',
    name: 'sends the documented history payload',
    ...json({ params: { chat_id: 'api-test-chat' }, limit: 20, offset: 0 }),
    expectedStatuses: [200, 400, 404, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/history/infinite',
    name: 'sends the documented infinite-history payload',
    ...json({ params: { chat_id: 'api-test-chat', limit: 20, offset: 0 } }),
    expectedStatuses: [200, 400, 404, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/suggestions',
    name: 'returns localized chat suggestions',
    ...json({ params: { country: 2 } }),
    expectedStatuses: [200],
    checks: [jsonObject, successFlagIsTrue, check('suggestions is an array', ({ parsed: body }) => {
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.suggestions));
    })],
  },
  {
    method: 'POST',
    path: '/api/ai/report',
    name: 'sends the documented message report payload',
    ...json({
      params: { chat_id: 'api-test-chat' },
      answer_index: 0,
      message: 'API test report',
    }),
    expectedStatuses: [200, 400, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/offers/report',
    name: 'sends the documented offer report payload',
    ...json({
      offer_id: 'api-test-offer',
      description: 'API test report',
      client_id: 'api-test-client',
      chat_id: 'api-test-chat',
    }),
    expectedStatuses: [200, 400, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/ai/chats/share/{chat_id}',
    name: 'sends the documented chat sharing payload',
    pathParams: { chat_id: 'api-test-chat' },
    ...json({ is_public: true }),
    expectedStatuses: [200, 400, 404, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/health',
    name: 'returns service health',
    expectedStatuses: [200],
    checks: [jsonObject, check('health status and timestamp are present', ({ parsed: body }) => {
      assert.equal(body.status, 'OK');
      assert.ok(body.timestamp);
    })],
  },
  {
    method: 'GET',
    path: '/api/health/mongo',
    name: 'returns MongoDB health or a dependency failure',
    expectedStatuses: [200, 500],
    checks: [jsonObject, check('Mongo health includes service status', ({ parsed: body }) => {
      assert.ok(['OK', 'ERROR'].includes(body.status));
      assert.equal(body.service, 'mongodb');
    })],
  },
  {
    method: 'POST',
    path: '/api/profile/data',
    name: 'accepts profile data requests',
    ...json({ client_id: 'api-test-client' }),
    expectedStatuses: [200],
    checks: [jsonObject, successFlagIsTrue],
  },
  {
    method: 'GET',
    path: '/api/search',
    name: 'responds on the GET search route',
    query: { query: 'loan', country_code: 'se' },
    expectedStatuses: [200, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/search',
    name: 'responds on the POST search route',
    ...json({ query: 'loan', country_code: 'se' }),
    expectedStatuses: [200, 500],
    checks: [jsonObject, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/client-id',
    name: 'sends the client id lookup request with uuid cookie',
    headers: { Cookie: 'uuid=api-test-uuid' },
    expectedStatuses: [200, 400, 404, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/attribution',
    name: 'sends the documented attribution payload',
    ...json({
      client_id: 'api-test-client',
      appsflyer_data: { payload: { campaign: 'api-test' }, status: 'success' },
      install_referrer: 'utm_source=api-test',
      appsflyer_id: 'api-test-appsflyer',
      maestra_uuid: 'api-test-maestra',
    }),
    expectedStatuses: [200, 400, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/notifications',
    name: 'saves notification preferences',
    ...json({ client_id: 'api-test-client', push_enabled: true }),
    expectedStatuses: [200],
    checks: [jsonObject, successFlagIsTrue],
  },
  {
    method: 'POST',
    path: '/api/account-deletion/request',
    name: 'sends the documented account deletion request payload',
    ...json({ email: 'api-test@example.com', reason: 'API contract test' }),
    expectedStatuses: [200, 400, 500],
    checks: [jsonObject, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/trial/status',
    name: 'sends the trial status query',
    query: { client_id: 'api-test-client' },
    expectedStatuses: [200, 400, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/trial/eligible',
    name: 'sends the trial eligibility query',
    query: { client_id: 'api-test-client' },
    expectedStatuses: [200, 400, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/trial/accept',
    name: 'sends the documented trial acceptance payload',
    ...json({ client_id: 'api-test-client', accept_trial: true }),
    expectedStatuses: [200, 400, 409, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/view/chat/{chat_id}',
    name: 'responds on the shared chat view route',
    pathParams: { chat_id: 'api-test-chat' },
    expectedStatuses: [200, 403, 404, 500],
    checks: [check('shared chat response has HTML or JSON error data', ({ contentType, parsed, text }) => {
      assert.ok(contentType.includes('text/html') || parsed !== undefined || text.length > 0);
    })],
  },
  {
    method: 'GET',
    path: '/api/view/chat/{chat_id}/pdf',
    name: 'responds on the shared chat PDF route',
    pathParams: { chat_id: 'api-test-chat' },
    expectedStatuses: [200, 403, 404, 500],
    checks: [check('shared chat PDF response has a body', ({ text }) => {
      assert.ok(text.length > 0);
    })],
  },
  {
    method: 'GET',
    path: '/api/test/reg-form/check-hashes',
    name: 'checks registration form asset hashes',
    expectedStatuses: [200, 500],
    timeoutMs: 20_000,
    checks: [jsonObject, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/geoip',
    name: 'proxies GeoIP requests',
    query: { ip: '8.8.8.8' },
    expectedStatuses: [200, 400, 500, 502],
    checks: [check('GeoIP proxy returns data or an error body', ({ parsed, text }) => {
      assert.ok(parsed !== undefined || text.length > 0);
    })],
  },
  {
    method: 'GET',
    path: '/api/files/list',
    name: 'rejects unauthenticated file listing',
    expectedStatuses: [401],
    checks: [jsonObject, errorJsonHasMessage],
  },
  {
    method: 'POST',
    path: '/api/files/upload',
    name: 'rejects unauthenticated file upload',
    headers: { 'x-file-password': 'wrong-password' },
    expectedStatuses: [401],
    checks: [jsonObject, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/files/download/{fileName}',
    name: 'rejects unauthenticated file downloads',
    pathParams: { fileName: 'missing.txt' },
    expectedStatuses: [401],
    checks: [jsonObject, errorJsonHasMessage],
  },
  {
    method: 'DELETE',
    path: '/api/files/{fileName}',
    name: 'rejects unauthenticated file deletion',
    pathParams: { fileName: 'missing.txt' },
    expectedStatuses: [401],
    checks: [jsonObject, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/config',
    name: 'responds on the app configuration route',
    query: { country_code: 'mx', lang: 'en', client_id: 'api-test-client' },
    expectedStatuses: [200, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/countries',
    name: 'returns supported countries',
    expectedStatuses: [200],
    checks: [jsonObject, successFlagIsTrue, check('countries data is an array', ({ parsed: body }) => {
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
    })],
  },
  {
    method: 'GET',
    path: '/api/localization',
    name: 'returns supported localization options',
    expectedStatuses: [200],
    checks: [jsonObject, successFlagIsTrue, check('languages and countries are arrays', ({ parsed: body }) => {
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.languages));
      assert.ok(Array.isArray(body.countries));
    })],
  },
  {
    method: 'GET',
    path: '/api/fields/industries',
    name: 'returns employment industries',
    query: { lang: 'en' },
    expectedStatuses: [200],
    checks: [jsonArray, check('industry items have value and label', ({ parsed: body }) => {
      assert.ok(body.length > 0);
      assert.equal(typeof body[0].value, 'string');
      assert.equal(typeof body[0].label, 'string');
    })],
  },
  {
    method: 'GET',
    path: '/api/fields/income-types',
    name: 'returns income types',
    query: { lang: 'en' },
    expectedStatuses: [200],
    checks: [jsonArray, check('income type items have value and label', ({ parsed: body }) => {
      assert.ok(body.length > 0);
      assert.equal(typeof body[0].value, 'string');
      assert.equal(typeof body[0].label, 'string');
    })],
  },
  {
    method: 'GET',
    path: '/api/offer',
    name: 'responds on the offer feed route',
    query: { country_code: 'mx' },
    expectedStatuses: [200, 500],
    checks: [jsonObjectOrDependencyFailure, errorJsonHasMessage],
  },
  {
    method: 'GET',
    path: '/api/disclaimer',
    name: 'returns disclaimer configuration',
    expectedStatuses: [200],
    checks: [jsonObject, check('disclaimer shape is stable', ({ parsed: body }) => {
      assert.equal(body.show, true);
      assert.equal(body.overrideSystem, false);
      assert.ok('message' in body);
    })],
  },
  {
    method: 'GET',
    path: '/api/chat-greeting',
    name: 'returns the chat greeting payload',
    expectedStatuses: [200],
    checks: [jsonNull],
  },
];

let serverProcess;
let serverOutput = '';
let runResults = [];
let swaggerSpec;
let swaggerOperations = [];

function operationKey(method, path) {
  return `${method.toUpperCase()} ${path}`;
}

function replacePathParams(path, pathParams = {}) {
  return path.replace(/\{([^}]+)\}/g, (_, name) => {
    assert.ok(
      Object.hasOwn(pathParams, name),
      `Missing path param "${name}" for ${path}`
    );
    return encodeURIComponent(pathParams[name]);
  });
}

function buildUrl(testCase) {
  const url = new URL(replacePathParams(testCase.path, testCase.pathParams), BASE_URL);
  for (const [key, value] of Object.entries(testCase.query || {})) {
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (contentType.includes('application/json') && text) {
    try {
      return { parsed: JSON.parse(text), text };
    } catch {
      return { parsed: undefined, text };
    }
  }
  return { parsed: undefined, text };
}

function truncate(value, maxLength = 2_000) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...<truncated>`;
}

function requestDefinition(testCase) {
  return {
    pathParams: testCase.pathParams || {},
    query: testCase.query || {},
    headers: testCase.headers || {},
    body: Object.hasOwn(testCase, 'body') ? testCase.body : undefined,
  };
}

function responseSample(parsed, text) {
  if (parsed !== undefined) {
    return truncate(parsed);
  }
  return truncate(text);
}

function formatStatusReport(results) {
  return results
    .map(result => `${result.response.status} ${result.method} ${result.path} (${result.checks.filter(item => item.passed).length}/${result.checks.length} checks)`)
    .join('\n');
}

async function writeContractReport(spec, results) {
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    strictDocStatuses: STRICT_DOC_STATUSES,
    totals: {
      documentedOperations: documentedOperations(spec).length,
      executedCases: results.length,
      passedChecks: results.reduce((total, result) => total + result.checks.filter(item => item.passed).length, 0),
      failedChecks: results.reduce((total, result) => total + result.checks.filter(item => !item.passed).length, 0),
    },
    results,
  };

  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

async function request(testCase) {
  const headers = {
    ...DEFAULT_HEADERS,
    ...(testCase.headers || {}),
  };

  const init = {
    method: testCase.method,
    headers,
    signal: AbortSignal.timeout(testCase.timeoutMs || REQUEST_TIMEOUT_MS),
  };

  if (Object.hasOwn(testCase, 'body')) {
    init.body = JSON.stringify(testCase.body);
  }

  return fetch(buildUrl(testCase), init);
}

async function fetchSwaggerSpec() {
  const response = await fetch(new URL('/api-docs/swagger.json', BASE_URL), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const { parsed, text } = await parseResponseBody(response);
  assert.equal(response.status, 200, `Expected Swagger JSON to return 200. Body: ${text.slice(0, 300)}`);
  assert.equal(parsed?.openapi, '3.0.0');
  assert.ok(parsed?.paths && typeof parsed.paths === 'object');
  return parsed;
}

function documentedOperations(spec) {
  const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
  return Object.entries(spec.paths)
    .flatMap(([path, pathItem]) =>
      Object.entries(pathItem)
        .filter(([method]) => methods.has(method.toLowerCase()))
        .map(([method, operation]) => ({
          key: operationKey(method, path),
          method: method.toUpperCase(),
          path,
          operation,
        }))
    )
    .sort((a, b) => a.key.localeCompare(b.key));
}

function docsStatusCodesFor(spec, testCase) {
  const pathItem = spec.paths[testCase.path];
  const operation = pathItem?.[testCase.method.toLowerCase()];
  return Object.keys(operation?.responses || {}).map(Number).filter(Number.isFinite);
}

async function waitForServer() {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < SERVER_READY_TIMEOUT_MS) {
    try {
      const response = await fetch(new URL('/api/health', BASE_URL), {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.status === 200) {
        return;
      }
      lastError = new Error(`Unexpected /api/health status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error(`Server was not ready at ${BASE_URL}: ${lastError?.message || 'unknown error'}\n${serverOutput}`);
}

async function startLocalServerIfRequested() {
  if (!START_SERVER) return;

  serverProcess = spawn(process.execPath, ['dist/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: TEST_PORT,
      PB_URL: process.env.API_TEST_PB_URL || 'http://127.0.0.1:1/',
      MONGODB_URI: process.env.API_TEST_MONGODB_URI || 'mongodb://127.0.0.1:1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', chunk => {
    serverOutput += chunk.toString();
  });
  serverProcess.stderr.on('data', chunk => {
    serverOutput += chunk.toString();
  });

  await waitForServer();
}

async function stopLocalServerIfStarted() {
  if (!serverProcess) return;

  serverProcess.kill('SIGTERM');
  await new Promise(resolve => {
    const timeout = setTimeout(resolve, 2_000);
    serverProcess.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

describe('generated Swagger docs and every documented endpoint contract case', () => {
  beforeAll(async () => {
    await startLocalServerIfRequested();
    swaggerSpec = await fetchSwaggerSpec();
    swaggerOperations = documentedOperations(swaggerSpec);
    runResults = [];
  }, SERVER_READY_TIMEOUT_MS + REQUEST_TIMEOUT_MS);

  afterAll(async () => {
    try {
      if (swaggerSpec && runResults.length > 0) {
        await writeContractReport(swaggerSpec, runResults);
        console.info(`\nResponse status report:\n${formatStatusReport(runResults)}`);
        console.info(`Detailed API contract report: ${REPORT_PATH}`);
      }
    } finally {
      await stopLocalServerIfStarted();
    }
  }, 10_000);

  it('Swagger JSON has documented operations', () => {
    assert.ok(swaggerOperations.length > 0, 'Expected at least one documented operation');
    for (const operation of swaggerOperations) {
      assert.ok(operation.operation.summary, `${operation.key} is missing a summary`);
      assert.ok(operation.operation.responses, `${operation.key} is missing responses`);
    }
  });

  it('each documented operation has exactly one contract case', () => {
    const documentedKeys = swaggerOperations.map(operation => operation.key);
    const caseKeys = API_CASES.map(testCase => operationKey(testCase.method, testCase.path)).sort();
    assert.deepEqual(caseKeys, documentedKeys);
  });

  for (const testCase of API_CASES) {
    it(`${operationKey(testCase.method, testCase.path)} - ${testCase.name}`, async () => {
      const url = buildUrl(testCase);
      const response = await request(testCase);
      const { parsed, text } = await parseResponseBody(response);
      const contentType = response.headers.get('content-type') || '';
      const checks = [];
      const result = {
        key: operationKey(testCase.method, testCase.path),
        method: testCase.method,
        path: testCase.path,
        name: testCase.name,
        url: url.toString(),
        request: requestDefinition(testCase),
        expectedStatuses: testCase.expectedStatuses,
        documentedStatuses: docsStatusCodesFor(swaggerSpec, testCase),
        response: {
          status: response.status,
          contentType,
          bodySample: responseSample(parsed, text),
        },
        checks,
      };
      runResults.push(result);

      if (!testCase.expectedStatuses.includes(404)) {
        assert.notEqual(response.status, 404, `${operationKey(testCase.method, testCase.path)} returned 404. Body: ${text.slice(0, 300)}`);
      }
      assert.ok(
        testCase.expectedStatuses.includes(response.status),
        `${operationKey(testCase.method, testCase.path)} returned ${response.status}; expected one of ${testCase.expectedStatuses.join(', ')}. Body: ${text.slice(0, 500)}`
      );

      if (STRICT_DOC_STATUSES) {
        const documentedStatuses = docsStatusCodesFor(swaggerSpec, testCase);
        assert.ok(
          documentedStatuses.includes(response.status),
          `${operationKey(testCase.method, testCase.path)} returned undocumented status ${response.status}; documented statuses: ${documentedStatuses.join(', ')}`
        );
      }

      for (const responseCheck of testCase.checks || []) {
        const checkResult = { name: responseCheck.name, passed: false };
        checks.push(checkResult);

        try {
          responseCheck.fn({
            contentType,
            parsed,
            response,
            status: response.status,
            testCase,
            text,
          });
          checkResult.passed = true;
        } catch (error) {
          checkResult.error = error instanceof Error ? error.message : String(error);
          throw error;
        }
      }
    }, testCase.timeoutMs || REQUEST_TIMEOUT_MS + 2_000);
  }
});
