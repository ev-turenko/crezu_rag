import type { Request, Response } from 'express';
import axios from 'axios';

const GEOIP_ENDPOINT = 'https://geoip.loanfinder24.com/geoip/';

function buildForwardUrl(req: Request): string {
    const queryIndex = req.originalUrl.indexOf('?');
    const queryString = queryIndex >= 0 ? req.originalUrl.substring(queryIndex) : '';
    const forwardPath = req.path === '/' ? '' : req.path.replace(/^\//, '');

    return `${GEOIP_ENDPOINT}${forwardPath}${queryString}`;
}

function getRequestIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || '';
}

function buildForwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};

    for (const [key, value] of Object.entries(req.headers)) {
        if (key === 'host' || key === 'content-length') {
            continue;
        }

        if (Array.isArray(value)) {
            headers[key] = value.join(',');
        } else if (typeof value === 'string') {
            headers[key] = value;
        }
    }

    const requestIp = getRequestIp(req);
    const incomingForwardedFor = req.header('x-forwarded-for');
    const forwardedFor = [incomingForwardedFor, requestIp].filter(Boolean).join(', ');

    if (forwardedFor) {
        headers['x-forwarded-for'] = forwardedFor;
    }

    if (requestIp) {
        headers['x-real-ip'] = requestIp;
    }

    headers['x-forwarded-proto'] = req.protocol;

    return headers;
}

export const geoipProxy = async (req: Request, res: Response) => {
    try {
        const response = await axios.request({
            method: req.method,
            url: buildForwardUrl(req),
            headers: buildForwardHeaders(req),
            data: req.body,
            validateStatus: () => true,
            responseType: 'arraybuffer'
        });

        const disallowedHeaders = new Set(['transfer-encoding', 'content-length', 'connection']);

        for (const [key, value] of Object.entries(response.headers)) {
            if (disallowedHeaders.has(key.toLowerCase()) || value === undefined) {
                continue;
            }

            res.setHeader(key, value as string);
        }

        return res.status(response.status).send(response.data);
    } catch (error) {
        return res.status(502).json({
            message: 'Failed to forward request to GeoIP service',
            error: (error as Error).message
        });
    }
};