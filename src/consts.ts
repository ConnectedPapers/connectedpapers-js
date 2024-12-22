const testToken = 'TEST_TOKEN';
const defaultServerAddress = 'https://rest.prod.connectedpapers.com';

export const accessToken = process.env.CONNECTED_PAPERS_API_KEY ?? testToken;
export const connectedPapersRestApi = process.env.CONNECTED_PAPERS_REST_API ?? defaultServerAddress;
