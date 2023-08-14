import axios from 'axios';

import {accessToken, connectedPapersRestApi} from './consts';
import {type Graph, type PaperId} from './graph';

export enum GraphResponseStatuses {
	BAD_ID = 'BAD_ID',
	ERROR = 'ERROR',
	NOT_IN_DB = 'NOT_IN_DB',
	OLD_GRAPH = 'OLD_GRAPH',
	FRESH_GRAPH = 'FRESH_GRAPH',
	IN_PROGRESS = 'IN_PROGRESS',
	QUEUED = 'QUEUED',
	BAD_TOKEN = 'BAD_TOKEN',
	BAD_REQUEST = 'BAD_REQUEST',
	OUT_OF_REQUESTS = 'OUT_OF_REQUESTS',
}

export type GraphResponse = {
	status: GraphResponseStatuses;
	graph_json?: Graph;
	progress?: number;
};

const sleepTimeBetweenChecks = 1000;
const sleepTimeAfterError = 5000;

const endResponseStatuses = [
	GraphResponseStatuses.BAD_ID,
	GraphResponseStatuses.ERROR,
	GraphResponseStatuses.NOT_IN_DB,
	GraphResponseStatuses.FRESH_GRAPH,
	GraphResponseStatuses.BAD_TOKEN,
	GraphResponseStatuses.BAD_REQUEST,
	GraphResponseStatuses.OUT_OF_REQUESTS,
];

export class ConnectedPapersClient {
	private readonly accessToken: string;
	private readonly serverAddr: string;

	constructor(args: {access_token?: string; server_addr?: string} = {}) {
		this.accessToken = args.access_token ?? accessToken;
		this.serverAddr = args.server_addr ?? connectedPapersRestApi;
	}

	public async * getGraphAsyncIterator(args: {paper_id: PaperId; fresh_only?: boolean; loop_until_fresh?: boolean}): AsyncGenerator<GraphResponse> {
		let retryCounter = 3;
		while (retryCounter > 0) {
			try {
				let newestGraph: Graph | undefined;
				while (true) {
					// eslint-disable-next-line no-await-in-loop
					const resp = await axios.get(
						`${this.serverAddr}/papers-api/graph/${Number(args.fresh_only ?? false)}/${args.paper_id}`,
						{headers: {'X-Api-Key': this.accessToken}},
					);
					if (resp.status !== 200) {
						throw new Error(`Bad response: ${resp.status}`);
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {data} = resp;
					if (!data) {
						throw new Error(`Bad response: ${resp.status}`);
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					if (!Object.values(GraphResponseStatuses).includes(data.status)) {
						data.status = GraphResponseStatuses.ERROR;
					}

					args.fresh_only = true;
					const response: GraphResponse = data as GraphResponse;
					if (response.graph_json) {
						newestGraph = response.graph_json;
					}

					// eslint-disable-next-line no-constant-binary-expression
					if (endResponseStatuses.includes(response.status) || ((!args.loop_until_fresh) ?? true)) {
						yield response;
						return;
					}

					response.graph_json = newestGraph;
					yield response;
					// eslint-disable-next-line no-await-in-loop, no-promise-executor-return
					await new Promise(resolve => setTimeout(resolve, sleepTimeBetweenChecks));
				}
			} catch (e) {
				retryCounter -= 1;
				if (retryCounter === 0) {
					throw e;
				}

				// eslint-disable-next-line no-await-in-loop, no-promise-executor-return
				await new Promise(resolve => setTimeout(resolve, sleepTimeAfterError));
			}
		}
	}

	public async getGraph(args: {paper_id: PaperId; fresh_only?: boolean}): Promise<GraphResponse> {
		const generator = this.getGraphAsyncIterator(args);
		let result: GraphResponse = {
			status: GraphResponseStatuses.ERROR,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			graph_json: undefined,
			progress: undefined,
		};
		for await (const response of generator) {
			result = response;
		}

		return result;
	}

	public async getRemainingUsages(): Promise<number> {
		try {
			const response = await axios.get(`${this.serverAddr}/papers-api/remaining-usages`, {
				headers: {'X-Api-Key': this.accessToken},
			});

			if (response.status !== 200) {
				throw new Error(`Bad response: ${response.status}`);
			}

			switch (typeof response.data.remaining_uses) {
				case 'number':
					return response.data.remaining_uses as number;
				default:
					throw new Error(`Bad response: ${JSON.stringify(response)}`);
			}
		} catch (error) {
			// Handle error as needed
			console.error(error);
			throw error;
		}
	}

	public async getFreeAccessPapers(): Promise<PaperId[]> {
		try {
			const response = await axios.get(`${this.serverAddr}/papers-api/free-access-papers`, {
				headers: {'X-Api-Key': this.accessToken},
			});

			if (response.status !== 200) {
				throw new Error(`Bad response: ${response.status}`);
			}

			return response.data.papers as PaperId[];
		} catch (error) {
			// Handle error as needed
			console.error(error);
			throw error;
		}
	}
}
