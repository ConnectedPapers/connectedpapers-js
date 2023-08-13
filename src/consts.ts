const testToken = 'TEST_TOKEN';
// Const defaultServerAddress = 'https://rest.connectedpapers.com';
const defaultServerAddress = 'http://localhost:8002';

export const accessToken = process.env.CONNECTED_PAPERS_API_KEY ?? testToken;
export const connectedPapersRestApi = process.env.CONNECTED_PAPERS_REST_API ?? defaultServerAddress;
