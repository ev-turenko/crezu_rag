import { Request, Response } from 'express';

const GEOIP_UPSTREAM_BASE = new URL('https://geoip.loanfinder24.com/geoip/');
const ROUTE_PREFIX = '/api/geoip';

const HOP_BY_HOP_HEADERS = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade'
]);

function buildUpstreamUrl(req: Request): URL {
	const [pathname, query = ''] = req.originalUrl.split('?');
	const remainder = pathname.startsWith(ROUTE_PREFIX)
		? pathname.slice(ROUTE_PREFIX.length)
		: pathname;
	const normalizedRemainder = remainder.replace(/^\/+/, '');
	const url = new URL(normalizedRemainder, GEOIP_UPSTREAM_BASE);

	if (query) {
		url.search = query;
	}

	return url;
}

function buildForwardHeaders(req: Request): Headers {
	const headers = new Headers();

	for (const [key, rawValue] of Object.entries(req.headers)) {
		if (!rawValue) continue;

		const lowerKey = key.toLowerCase();
		if (HOP_BY_HOP_HEADERS.has(lowerKey) || lowerKey === 'host' || lowerKey === 'content-length') {
			continue;
		}

		if (Array.isArray(rawValue)) {
			headers.set(key, rawValue.join(','));
			continue;
		}

		headers.set(key, rawValue);
	}

	return headers;
}

function buildForwardBody(req: Request, headers: Headers): BodyInit | undefined {
	const method = req.method.toUpperCase();
	if (method === 'GET' || method === 'HEAD') {
		return undefined;
	}

	const body = req.body;
	if (body === undefined || body === null) {
		return undefined;
	}

	if (typeof body === 'string') {
		return body;
	}

	if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
		const bytes = Uint8Array.from(body);
		return new Blob([bytes]);
	}

	if (!headers.has('content-type')) {
		headers.set('content-type', 'application/json');
	}

	return JSON.stringify(body);
}

export async function geoipProxy(req: Request, res: Response) {
	try {
		const url = buildUpstreamUrl(req);
		const headers = buildForwardHeaders(req);
		const body = buildForwardBody(req, headers);

		const upstreamResponse = await fetch(url, {
			method: req.method,
			headers,
			body,
			redirect: 'manual'
		});

		res.status(upstreamResponse.status);

		upstreamResponse.headers.forEach((value, key) => {
			if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
				return;
			}
			res.setHeader(key, value);
		});

		const payload = Buffer.from(await upstreamResponse.arrayBuffer());
		res.send(payload);
	} catch (error) {
		console.error('GeoIP proxy request failed:', error);
		res.status(502).json({
			success: false,
			error: 'Bad Gateway'
		});
	}
}
