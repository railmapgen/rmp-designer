import { getAttrUiMeta, getGroupedAttrKeys } from './svg-attr-metadata';

describe('svg attr metadata', () => {
    it('returns visual metadata for known attrs', () => {
        const meta = getAttrUiMeta('rect', 'stroke-width');

        expect(meta.title).toBe('边框粗细');
        expect(meta.group).toBe('stroke');
        expect(meta.description).toContain('外框线条');
        expect(meta.quickValues).toEqual([0, 1, 2, 4]);
    });

    it('falls back unknown attrs into the more group', () => {
        const meta = getAttrUiMeta('rect', 'data-custom');

        expect(meta.title).toBe('数据 custom');
        expect(meta.group).toBe('more');
        expect(meta.description).toContain('SVG 的扩展属性');
    });

    it('groups uploaded unknown attrs under more without dropping them', () => {
        const attrs = {
            x: '1"1"',
            y: '1"2"',
            width: '1"10"',
            height: '1"5"',
            'data-custom': '1"keep"',
        };
        const grouped = getGroupedAttrKeys('rect', attrs, undefined);

        expect(attrs['data-custom']).toBe('1"keep"');
        expect(grouped.position).toEqual(expect.arrayContaining(['x', 'y']));
        expect(grouped.size).toEqual(expect.arrayContaining(['width', 'height']));
        expect(grouped.more).toContain('data-custom');
    });
});
