interface DetailsSvgsValue {
    type: string;
    key: string;
    defaultValue: string;
    options: Record<string | number, string>;
}

const detailsSvgsValue: DetailsSvgsValue[] = [
    {
        type: 'text',
        key: 'className',
        defaultValue: 'rmp-name__en',
        options: {
            'rmp-name__en': 'English',
            'rmp-name__zh': 'Chinese',
            'rmp-name__mtr__en': 'MTR English',
            'rmp-name__mtr__zh': 'MTR Chinese',
            'rmp-name__berlin': 'Berlin S/U Bahn',
            'rmp-name__mrt': 'Singapore MRT',
            'rmp-name__jreast_ja': 'JR East Japanese',
            'rmp-name__jreast_en': 'JR East English',
            'rmp-name__tokyo_en': 'Tokyo English',
            'rmp-name__tube': 'London Tube',
        },
    },
    {
        type: 'text',
        key: 'textAnchor',
        defaultValue: 'start',
        options: {
            start: 'start',
            middle: 'middle',
            end: 'end',
        },
    },
];

export const getValueSelect = (type: string, key: string): DetailsSvgsValue | undefined =>
    detailsSvgsValue.find(s => s.type === type && s.key === key);

export const getValueSelectValue = (elem: DetailsSvgsValue, value?: string): string => {
    const e = Object.entries(elem.options).find(([key]) => key === value);
    return e === undefined ? elem.defaultValue : e[0];
};
