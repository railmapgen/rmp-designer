import { Translation } from '@railmapgen/rmg-translate';

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
