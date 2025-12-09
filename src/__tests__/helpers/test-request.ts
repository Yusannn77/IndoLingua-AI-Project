/**
 * Test Request Helper
 * 
 * Utility untuk membuat Request object dalam API testing
 */

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

interface RequestOptions {
    method?: HttpMethod;
    body?: unknown;
    searchParams?: Record<string, string>;
    headers?: Record<string, string>;
}

/**
 * Create a Request object for API route testing
 */
export function createTestRequest(
    path: string,
    options: RequestOptions = {}
): Request {
    const { method = 'GET', body, searchParams, headers = {} } = options;

    // Build URL with search params
    let url = `http://localhost${path}`;
    if (searchParams) {
        const params = new URLSearchParams(searchParams);
        url += `?${params.toString()}`;
    }

    // Build request init
    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
        init.body = JSON.stringify(body);
    }

    return new Request(url, init);
}

/**
 * Shorthand helpers for common request types
 */
export const testRequest = {
    get: (path: string, searchParams?: Record<string, string>) =>
        createTestRequest(path, { method: 'GET', searchParams }),

    post: (path: string, body: unknown) =>
        createTestRequest(path, { method: 'POST', body }),

    patch: (path: string, body: unknown, searchParams?: Record<string, string>) =>
        createTestRequest(path, { method: 'PATCH', body, searchParams }),

    delete: (path: string, searchParams: Record<string, string>) =>
        createTestRequest(path, { method: 'DELETE', searchParams }),
};

/**
 * Helper to parse JSON response from API route
 */
export async function parseResponse<T>(response: Response): Promise<{
    status: number;
    data: T;
}> {
    const data = await response.json() as T;
    return {
        status: response.status,
        data,
    };
}
