import axios, {
AxiosInstance,
AxiosRequestConfig,
AxiosResponse,
Method,
} from "axios";
import https from "https";
import fs from "fs";
import { appendAxiosTrace, extractTestCaseId, getCurrentTestName, logger, sanitizeAxiosTraceHeaders, serializeAxiosTraceBody, shouldIncludeAxiosTraceHeaders, truncateAxiosTraceField } from "./commons/utils/logger";

export class BaseClient {
// protected baseUrl: string;
// protected axiosInstance: AxiosInstance;
protected axios: AxiosInstance;
protected httpAgent: https.Agent;

// constructor(baseUrl: string) {
// this.baseUrl = baseUrl;
// this.axiosInstance = axios.create({ baseURL: this.baseUrl });
// }
constructor(baseURL: string, defaultConfig?: AxiosRequestConfig) {
this.httpAgent = new https.Agent({
 rejectUnauthorized: false,
});

// protected async request(
// endpoint: string,
// options: RequestInit = {},
// ): Promise<any> {
// const url = `${this.baseUrl}${endpoint}`;
// const response = await fetch(url, options);

// if (!response.ok) {
// throw new Error(`HTTP error! status: ${response.status}`);
// }

// return response.json();
// }
this.axios = axios.create({
 baseURL,
 headers: defaultConfig?.headers,
});
this.axios.interceptors.request.use((req) => {
 // logger.info({ method: req.method, url: req.url, data: req.data }, '[REQUEST]');
 return req;
});

this.axios.interceptors.response.use(
 (res) => {
 // logger.info({ status: res.status, url: res.config.url, data: res.data }, '[RESPONSE]');
 const testName = getCurrentTestName();
 appendAxiosTrace({
 timestamp: new Date().toISOString(),
 testName,
 testCaseId: extractTestCaseId(testName),
 method: String(res.config.method || "").toUpperCase(),
 url: `${res.config.baseURL || ""}${res.config.url || ""}`,
 requestHeaders: shouldIncludeAxiosTraceHeaders
  ? sanitizeAxiosTraceHeaders(res.config.headers)
  : undefined,
 requestBody: serializeAxiosTraceBody(res.config.data),
 responseStatus: res.status,
 responseHeaders: shouldIncludeAxiosTraceHeaders
  ? sanitizeAxiosTraceHeaders(res.headers)
  : undefined,
 responseBody: serializeAxiosTraceBody(res.data),
 });

 if (process.env.JEST_LOG === "true") {
 let axiosLog = `Timestamp: ${new Date().toISOString()} \n`;
 axiosLog += `${res.config.method} ${res.config.baseURL || ""}${res.config.url} \n`;
 axiosLog += `RC ${res.status} \n`;

 // Parse and pretty-print request payload
 let requestPayload = res.config.data;
 if (typeof requestPayload === "string") {
  try {
  requestPayload = JSON.parse(requestPayload);
  } catch {
  // If parsing fails, keep as string
  }
 }
 axiosLog +=
  "Request Payload: " +
  JSON.stringify(requestPayload, null, 2) +
  "\n";
 axiosLog +=
  "Response Payload: " + JSON.stringify(res.data, null, 2) + "\n\n";
 try {
  fs.appendFileSync(
  `./${process.env.JEST_LOG_FILE || "runtimelog.log"}`,
  axiosLog,
  {
  flag: "a+",
  },
  );
 } catch (err) {
  console.error("Axios Log Error", err);
 }
 }
 return res;
 },
 (error) => {
 const testName = getCurrentTestName();
 appendAxiosTrace({
 timestamp: new Date().toISOString(),
 testName,
 testCaseId: extractTestCaseId(testName),
 method: String(error.config?.method || "").toUpperCase(),
 url: `${error.config?.baseURL || ""}${error.config?.url || ""}`,
 requestHeaders: shouldIncludeAxiosTraceHeaders
  ? sanitizeAxiosTraceHeaders(error.config?.headers)
  : undefined,
 requestBody: serializeAxiosTraceBody(error.config?.data),
 responseStatus: error.response?.status,
 responseHeaders: shouldIncludeAxiosTraceHeaders
  ? sanitizeAxiosTraceHeaders(error.response?.headers)
  : undefined,
 responseBody: serializeAxiosTraceBody(error.response?.data),
 error: truncateAxiosTraceField(
  String(error.message || "Unknown axios error"),
 ),
 });

 logger.error(
 {
  status: error.response?.status,
  url: error.config?.url,
  message: error.message,
  response: error.response?.data,
 },
 "[ERROR]",
 );
 return Promise.reject(error);
 },
);
}
protected async request<T>(
method: Method,
url: string,
config: AxiosRequestConfig = {},
): Promise<{ data: T; status: number; headers: any }> {
const response: AxiosResponse<T> = await this.axios.request<T>({
 method,
 url,
 proxy: false,
 maxRedirects: 0,
 httpAgent: this.httpAgent,
 validateStatus: () => true,
 ...config,
});
return {
 data: response.data,
 status: response.status,
 headers: response.headers,
};
}

public get<T>(url: string, config?: AxiosRequestConfig) {
return this.request<T>("GET", url, config);
}

public post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
return this.request<T>("POST", url, { data, ...config });
}

public put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
return this.request<T>("PUT", url, { data, ...config });
}

public delete<T>(url: string, data?: any, config?: AxiosRequestConfig) {
return this.request<T>("DELETE", url, { data, ...config });
}

public patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
return this.request<T>("PATCH", url, { data, ...config });
}
}

let orvalClient: BaseClient | null = null;

const getOrvalClient = (): BaseClient => {
if (!orvalClient) {
orvalClient = new BaseClient(
 process.env.ORVAL_BASE_URL || "https://petstore.swagger.io/v2",
 {
 headers: {
 "Content-Type": "application/json",
 },
 },
);
}

return orvalClient;
};

export const orvalMutator = async <T>(
config: AxiosRequestConfig,
options?: AxiosRequestConfig,
): Promise<T> => {
const mergedConfig: AxiosRequestConfig = {
...config,
...options,
headers: {
 ...(config.headers || {}),
 ...(options?.headers || {}),
},
};

const method = String(mergedConfig.method || "GET").toUpperCase();
const url = mergedConfig.url || "";
const { method: _method, url: _url, ...requestConfig } = mergedConfig;

const client = getOrvalClient();

switch (method) {
case "GET":
 return (await client.get<T>(url, requestConfig)).data;
case "POST":
 return (await client.post<T>(url, requestConfig.data, requestConfig)).data;
case "PUT":
 return (await client.put<T>(url, requestConfig.data, requestConfig)).data;
case "DELETE":
 return (await client.delete<T>(url, requestConfig.data, requestConfig)).data;
case "PATCH":
 return (await client.patch<T>(url, requestConfig.data, requestConfig)).data;
default:
 throw new Error(`Unsupported HTTP method for Orval mutator: ${method}`);
}
};
