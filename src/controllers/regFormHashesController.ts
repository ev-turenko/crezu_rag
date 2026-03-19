import type { Request, Response } from 'express';

const REG_FORM_JS_URL = 'https://cdn.crezu.net/reg_form/dist/crezu_reg_form.iife.js';
const REG_FORM_CSS_URL = 'https://cdn.crezu.net/reg_form/dist/crezu_reg_form.css';
const DATA_V_HASH_PATTERN = /data-v-[A-Za-z0-9_-]+/g;

function withTimestamp(url: string): string {
    return `${url}?t=${+new Date()}`;
}

function extractDataVHashes(content: string): Set<string> {
    const matches = content.match(DATA_V_HASH_PATTERN) ?? [];
    return new Set(matches.filter((hash) => hash !== 'data-v-app'));
}

function compareDataVHashes(cssContent: string, jsContent: string): {
    cssCount: number;
    jsCount: number;
    onlyInCss: string[];
    onlyInJs: string[];
    hasMismatch: boolean;
} {
    const cssHashes = extractDataVHashes(cssContent);
    const jsHashes = extractDataVHashes(jsContent);

    const onlyInCss = [...cssHashes].filter((hash) => !jsHashes.has(hash)).sort();
    const onlyInJs = [...jsHashes].filter((hash) => !cssHashes.has(hash)).sort();

    return {
        cssCount: cssHashes.size,
        jsCount: jsHashes.size,
        onlyInCss,
        onlyInJs,
        hasMismatch: onlyInCss.length > 0 || onlyInJs.length > 0,
    };
}

async function fetchAssetContent(assetName: string, url: string): Promise<string> {
    let response: globalThis.Response;

    try {
        response = await fetch(withTimestamp(url), {
            signal: AbortSignal.timeout(10000),
        });
    } catch (error) {
        throw new Error(`Failed to load ${assetName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!response.ok) {
        throw new Error(`Failed to load ${assetName}: HTTP ${response.status}`);
    }

    return response.text();
}

export async function checkRegFormHashes(_: Request, res: Response) {
    try {
        const [jsContent, cssContent] = await Promise.all([
            fetchAssetContent('crezu_reg_form.iife.js', REG_FORM_JS_URL),
            fetchAssetContent('crezu_reg_form.css', REG_FORM_CSS_URL),
        ]);

        const comparison = compareDataVHashes(cssContent, jsContent);

        if (comparison.hasMismatch) {
            const details: string[] = [];

            if (comparison.onlyInCss.length > 0) {
                details.push(`onlyInCss: ${comparison.onlyInCss.join(', ')}`);
            }

            if (comparison.onlyInJs.length > 0) {
                details.push(`onlyInJs: ${comparison.onlyInJs.join(', ')}`);
            }

            return res.status(500).json({
                success: false,
                error: `Hash mismatch detected. ${details.join(' | ')}`,
            });
        }

        return res.status(200).json({
            success: true,
            comparison
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
