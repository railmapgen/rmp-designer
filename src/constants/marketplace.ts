import { Translation } from '@railmapgen/rmg-translate';

export const GITHUB_ISSUE_HEADER = 'Hi RMP team! I would like to contribute to the gallery with the data below.';
export const GITHUB_ISSUE_PREAMBLE = '**Paste or Upload below. They are meant for BOTS ONLY!!!**';

export interface MetadataDetail {
    name: Translation;
    desc: Translation;
    svgString: string;
    type: 'MiscNode' | 'Station';
}

export interface Metadata {
    name: Translation;
    desc: Translation;
    contributor: string;
    lastUpdateOn: string;
    type: 'MiscNode' | 'Station';
    status: 'public' | 'pending' | 'rejected';
    paramStr: string;
    svgString: string;
    svgHash: string;
}

export const defaultMetadata: Metadata = {
    name: {
        en: '',
    },
    desc: {
        en: '',
    },
    contributor: '',
    lastUpdateOn: '',
    type: 'MiscNode',
    status: 'public',
    paramStr: '',
    svgString: '',
    svgHash: '',
};

export interface Marketplace {
    [id: number]: Metadata;
}

export interface ResponseMetadata {
    id: number;
    data: string;
    hash: string;
    lastUpdateAt: string;
    status: 'public' | 'pending' | 'rejected';
    type: 'MiscNode' | 'Station';
    userId: number;
    svgString: string;
    svgHash: string;
}
