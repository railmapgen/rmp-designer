import { getAttrControl, getAttrUiMeta, getGroupedAttrKeys } from './svg-attr-metadata';

describe('svg attr metadata', () => {
    it('returns visual metadata for known attrs', () => {
        const meta = getAttrUiMeta('rect', 'stroke-width');

        expect(meta.title).toBe('Stroke Width');
        expect(meta.group).toBe('stroke');
        expect(meta.description).toContain('number');
        expect(meta.effectHint).toBeUndefined();
        expect(meta.quickValues).toEqual([0, 1, 2, 4]);
        expect(meta.visualRole).toBe('stroke');
    });

    it('falls back unknown attrs into the more group', () => {
        const meta = getAttrUiMeta('rect', 'data-custom');

        expect(meta.title).toBe('Data custom');
        expect(meta.group).toBe('more');
        expect(meta.description).toContain('extended SVG attribute');
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

    it('hides smooth path editor metadata from the visual attr list', () => {
        const grouped = getGroupedAttrKeys(
            'path',
            {
                d: '1"M 0 0 L 10 0"',
                'data-rmp-smooth-path': '1"{}"',
            },
            undefined
        );

        expect(Object.values(grouped).flat()).not.toContain('data-rmp-smooth-path');
    });

    it('uses the block editor control for visible text content', () => {
        expect(getAttrControl('text', '_rmp_children_text').type).toBe('text-content');
        expect(getAttrControl('tspan', '_rmp_children_text').type).toBe('text-content');
        expect(getAttrControl('style', '_rmp_children_text').type).toBe('textarea');
    });
});
