export type PaperId = string;

export type CommonAuthor = {
	id: PaperId;
	mention_indexes: number[];
	mentions: PaperId[];
	name: string;
	url: string;
};

export type PaperAuthor = {
	ids: Array<PaperId | undefined>;
	name: string;
};

export type ExternalIds = {
	ACL?: string;
	ArXiv?: string;
	CorpusId?: string;
	DBLP?: string;
	DOI?: string;
	MAG?: string;
	PubMed?: string;
	PubMedCentral?: string;
};

export type BasePaper = {
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

export type CommonCitation = {
	edges_count: number;
	local_references: PaperId[];
	paper_id: PaperId;
	pi_name?: string;
} & BasePaper;

export type CommonReference = {
	edges_count: number;
	local_citations: PaperId[];
	paper_id: PaperId;
	pi_name?: string;
} & BasePaper;

export type Paper = {
	path: PaperId[];
	path_length: number;
	pos: number[];
} & BasePaper;

export type Edge = [PaperId, PaperId, number];

export type Graph = {
	common_authors: CommonAuthor[];
	common_citations: CommonCitation[];
	common_references: CommonReference[];
	edges: Edge[];
	nodes: Record<PaperId, Paper>;
	path_lengths: Record<PaperId, number>;
	start_id: PaperId;
};
