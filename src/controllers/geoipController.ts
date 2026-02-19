import type { Request, Response } from 'express';
import axios from 'axios';
import net from 'node:net';

const GEOIP_ENDPOINT = 'https://geoip.loanfinder24.com/geoip/';
const EXCLUDED_IPS = new Set(['38.102.84.108']);

function normalizeIp(value: string): string {
    let ip = value.trim().replace(/^"|"$/g, '');

    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    if (ip.startsWith('[') && ip.includes(']')) {
        ip = ip.slice(1, ip.indexOf(']'));
    }

    if (ip.includes('.') && ip.includes(':') && ip.indexOf(':') === ip.lastIndexOf(':')) {
        ip = ip.substring(0, ip.lastIndexOf(':'));
    }

    if (ip.includes('%')) {
        ip = ip.substring(0, ip.indexOf('%'));
    }

    return ip;
}

function isPrivateOrLocalIp(ip: string): boolean {
    const version = net.isIP(ip);

    if (version === 4) {
        const [first, second] = ip.split('.').map(Number);

        if (first === 10 || first === 127 || first === 0) {
            return true;
        }

        if (first === 169 && second === 254) {
            return true;
        }

        if (first === 172 && second >= 16 && second <= 31) {
            return true;
        }

        if (first === 192 && second === 168) {
            return true;
        }

        if (first === 100 && second >= 64 && second <= 127) {
            return true;
        }

        if (first === 198 && (second === 18 || second === 19)) {
            return true;
        }

        return false;
    }

    if (version === 6) {
        const normalized = ip.toLowerCase();

        if (normalized === '::1' || normalized === '::') {
            return true;
        }

        if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
            return true;
        }

        if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
            return true;
        }

        return false;
    }

    return true;
}

function isPublicIp(ip: string): boolean {
    return net.isIP(ip) !== 0 && !isPrivateOrLocalIp(ip);
}

function isExcludedIp(ip: string): boolean {
    return EXCLUDED_IPS.has(ip);
}

function getFirstForwardedIp(forwardedForHeader: string | undefined): string {
    if (!forwardedForHeader) {
        return '';
    }

    const firstForwardedIp = normalizeIp(forwardedForHeader.split(',')[0] || '');

    if (!firstForwardedIp || net.isIP(firstForwardedIp) === 0) {
        return '';
    }

    return isExcludedIp(firstForwardedIp) ? '' : firstForwardedIp;
}

function buildForwardUrl(req: Request): string {
    const queryIndex = req.originalUrl.indexOf('?');
    const queryString = queryIndex >= 0 ? req.originalUrl.substring(queryIndex) : '';
    const forwardPath = req.path === '/' ? '' : req.path.replace(/^\//, '');

    return `${GEOIP_ENDPOINT}${forwardPath}${queryString}`;
}

function getRequestIp(req: Request): string {
    const forwardedIp = getFirstForwardedIp(req.header('x-forwarded-for') || undefined);

    if (forwardedIp) {
        return forwardedIp;
    }

    const directIp = normalizeIp(req.ip || req.socket.remoteAddress || '');

    return isPublicIp(directIp) && !isExcludedIp(directIp) ? directIp : '';
}

function buildForwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    const excludedHeaders = new Set(['host', 'content-length', 'x-forwarded-for', 'x-real-ip', 'x-forwarded-proto', 'forwarded']);

    for (const [key, value] of Object.entries(req.headers)) {
        if (excludedHeaders.has(key.toLowerCase())) {
            continue;
        }

        if (Array.isArray(value)) {
            headers[key] = value.join(',');
        } else if (typeof value === 'string') {
            headers[key] = value;
        }
    }

    const requestIp = getRequestIp(req);

    if (requestIp) {
        headers['x-forwarded-for'] = requestIp;
    }

    if (requestIp) {
        headers['x-real-ip'] = requestIp;
    }

    headers['x-forwarded-proto'] = req.protocol;

    return headers;
}

export const geoipProxy = async (req: Request, res: Response) => {
    try {

        console.log("HEADERS")
        console.log(req.headers)
        console.log("HEADERS END")
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