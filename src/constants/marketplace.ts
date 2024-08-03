import { Translation } from '@railmapgen/rmg-translate';

export const GITHUB_ISSUE_HEADER = 'Hi RMP team! I would like to contribute to the gallery with the data below.';
export const GITHUB_ISSUE_PREAMBLE = '**Paste or Upload below. They are meant for BOTS ONLY!!!**';

export interface MetadataDetail {
    name: Translation;
    desc: Translation;
    justification: string;
}

export interface Metadata {
    name: Translation;
    desc: Translation;
    contributor: string;
    lastUpdateOn: number;
}

export const defaultMetadata: Metadata = {
    name: {
        en: '',
    },
    desc: {
        en: '',
    },
    contributor: '',
    lastUpdateOn: 0,
};

export interface Marketplace {
    [styleName: string]: Metadata;
}
