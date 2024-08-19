import { Translation } from '@railmapgen/rmg-translate';

export interface MetadataDetail {
    name: Translation;
    desc: Translation;
    param: string;
    svgString: string;
    type: 'MiscNode' | 'Station';
    from: 'designer' | 'ticket';
    id: number;
}

export const defaultMetadataDetail: MetadataDetail = {
    name: {
        en: '',
    },
    desc: {
        en: '',
    },
    type: 'MiscNode',
    svgString: '',
    param: '',
    from: 'designer',
    id: -1,
};
