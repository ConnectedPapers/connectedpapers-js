type PaperId = string;
type CommonAuthor = {
    id: PaperId;
    mention_indexes: number[];
    mentions: PaperId[];
    name: string;
    url: string;
};
type PaperAuthor = {
    ids: Array<PaperId | undefined>;
    name: string;
};
type ExternalIds = {
    ACL?: string;
    ArXiv?: string;
    CorpusId?: string;
    DBLP?: string;
    DOI?: string;
    MAG?: string;
    PubMed?: string;
    PubMedCentral?: string;
};
type BasePaper = {
    abstract?: string;
    arxivId?: string;
    authors: PaperAuthor[];
    corpusid: number;
    doi?: string;
    externalIds: ExternalIds;
    fieldsOfStudy?: string[];
    id: PaperId;
    isOpenAccess?: boolean;
    journalName?: string;
    journalPages?: string;
    journalVolume?: string;
    magId?: string;
    number_of_authors: number;
    paperId: PaperId;
    pdfUrls?: string[];
    pmid?: string;
    publicationDate?: string;
    publicationTypes?: string[];
    title: string;
    tldr?: string;
    url: string;
    venue?: string;
    year?: number;
};
type CommonCitation = {
    edges_count: number;
    local_references: PaperId[];
    paper_id: PaperId;
    pi_name?: string;
} & BasePaper;
type CommonReference = {
    edges_count: number;
    local_citations: PaperId[];
    paper_id: PaperId;
    pi_name?: string;
} & BasePaper;
type Paper = {
    path: PaperId[];
    path_length: number;
    pos: number[];
} & BasePaper;
type Edge = [PaperId, PaperId, number];
type Graph = {
    common_authors: CommonAuthor[];
    common_citations: CommonCitation[];
    common_references: CommonReference[];
    edges: Edge[];
    nodes: Record<PaperId, Paper>;
    path_lengths: Record<PaperId, number>;
    start_id: PaperId;
};

declare enum GraphResponseStatuses {
    BAD_ID = "BAD_ID",
    ERROR = "ERROR",
    NOT_IN_DB = "NOT_IN_DB",
    OLD_GRAPH = "OLD_GRAPH",
    FRESH_GRAPH = "FRESH_GRAPH",
    IN_PROGRESS = "IN_PROGRESS",
    QUEUED = "QUEUED",
    BAD_TOKEN = "BAD_TOKEN",
    BAD_REQUEST = "BAD_REQUEST",
    OUT_OF_REQUESTS = "OUT_OF_REQUESTS"
}
type GraphResponse = {
    status: GraphResponseStatuses;
    graph_json?: Graph;
    progress?: number;
};
declare class ConnectedPapersClient {
    private readonly accessToken;
    private readonly serverAddr;
    constructor(args?: {
        access_token?: string;
        server_addr?: string;
    });
    getGraphAsyncIterator(args: {
        paper_id: PaperId;
        fresh_only?: boolean;
        loop_until_fresh?: boolean;
    }): AsyncGenerator<GraphResponse>;
    getGraph(args: {
        paper_id: PaperId;
        fresh_only?: boolean;
    }): Promise<GraphResponse>;
    getRemainingUsages(): Promise<number>;
    getFreeAccessPapers(): Promise<PaperId[]>;
}

export { ConnectedPapersClient };
