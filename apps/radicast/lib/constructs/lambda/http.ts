const request = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }
  return response;
};

export const fetchText = async (url: string) => (await request(url)).text();

export const fetchBuffer = async (url: string) =>
  Buffer.from(await (await request(url)).arrayBuffer());

export const fetchJson = async <T>(url: string) => (await (await request(url)).json()) as T;
