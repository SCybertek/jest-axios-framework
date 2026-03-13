import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';

export type AxiosTraceEntry = {
timestamp: string;
testName?: string;
testCaseId?: string;
method?: string;
url?: string;
requestHeaders?: Record<string, string>;
requestBody?: string;
responseStatus?: number;
responseHeaders?: Record<string, string>;
responseBody?: string;
error?: string;
};

const AXIOS_TRACE_FILE = process.env.JEST_AXIOS_TRACE_FILE || 'jest-axios-trace.ndjson';
const AXIOS_TRACE_PER_WORKER = process.env.JEST_AXIOS_TRACE_PER_WORKER?.toLowerCase() === 'true';
const toPositiveNumber = (value: string | undefined, fallback: number): number => {
const parsed = Number(value);
return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MAX_TRACE_FIELD_CHARS = toPositiveNumber(process.env.JEST_AXIOS_TRACE_FIELD_MAX_CHARS, 500);
const MAX_TRACE_BODY_CHARS = toPositiveNumber(process.env.JEST_AXIOS_TRACE_BODY_MAX_CHARS, 3000);

export const logger = pino({
transport: {
target: 'pino-pretty',
options: {
colorize: true,
translateTime: 'SYS:standard',
ignore: 'pid,hostname',
},
},
});

export const shouldIncludeAxiosTraceHeaders =
process.env.JEST_AXIOS_TRACE_INCLUDE_HEADERS?.toLowerCase() === 'true';

export const resolveAxiosTraceFilePath = (): string => {
if (!AXIOS_TRACE_PER_WORKER) {
return AXIOS_TRACE_FILE;
}

const workerId = process.env.JEST_WORKER_ID;
if (!workerId) {
return AXIOS_TRACE_FILE;
}

const parsedPath = path.parse(AXIOS_TRACE_FILE);
return path.join(parsedPath.dir, `${parsedPath.name}.worker-${workerId}${parsedPath.ext || ''}`);
};

const truncateText = (value: string, maxChars: number): string => {
if (value.length <= maxChars) {
return value;
}

return `${value.slice(0, maxChars)}\n... [truncated ${value.length - maxChars} chars]`;
};

export const truncateAxiosTraceField = (value: string): string => {
return truncateText(value, MAX_TRACE_FIELD_CHARS);
};

export const serializeAxiosTraceBody = (value: unknown): string | undefined => {
if (value === undefined) {
return undefined;
}

const normalizedValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
return truncateText(String(normalizedValue), MAX_TRACE_BODY_CHARS);
};

export const sanitizeAxiosTraceHeaders = (headers: unknown): Record<string, string> | undefined => {
if (!headers || typeof headers !== 'object') {
return undefined;
}

const blockedHeaders = new Set(['authorization', 'cookie', 'x-api-key', 'private-token']);
const sanitized: Record<string, string> = {};

Object.entries(headers as Record<string, unknown>).forEach(([headerName, headerValue]) => {
if (blockedHeaders.has(headerName.toLowerCase())) {
return;
}

const serialized = Array.isArray(headerValue)
? headerValue.join('; ')
: String(headerValue ?? '');

sanitized[headerName] = truncateText(serialized, MAX_TRACE_FIELD_CHARS);
});

return Object.keys(sanitized).length ? sanitized : undefined;
};

export const getCurrentTestName = (): string | undefined => {
const jestExpect = (globalThis as { expect?: { getState?: () => { currentTestName?: string } } })
.expect;

if (!jestExpect?.getState) {
return undefined;
}

const currentTestName = jestExpect.getState().currentTestName;
if (typeof currentTestName !== 'string' || !currentTestName.trim()) {
return undefined;
}

return currentTestName;
};

export const extractTestCaseId = (testName: string | undefined): string | undefined => {
if (!testName) {
return undefined;
}

const match = testName.match(/\b(?:tc-)?C(\d+)\b/i);
return match ? `C${match[1]}` : undefined;
};

export const appendAxiosTrace = (entry: AxiosTraceEntry): void => {
if (process.env.JEST_AXIOS_TRACE_ENABLED?.toLowerCase() === 'false') {
return;
}

try {
const traceFilePath = resolveAxiosTraceFilePath();
const traceDir = path.dirname(traceFilePath);
if (traceDir && traceDir !== '.' && !fs.existsSync(traceDir)) {
fs.mkdirSync(traceDir, { recursive: true });
}

fs.appendFileSync(traceFilePath, `${JSON.stringify(entry)}\n`, {
encoding: 'utf8',
flag: 'a',
});
} catch (error) {
logger.warn({ error }, '[AXIOS_TRACE_WRITE_ERROR]');
}
};
