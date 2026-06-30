import { describe, expect, it } from 'vitest';
import type { SvgsElem } from '../constants/constants';
import { countSvgNodes, isSvgTreeEditable, MAX_EDITABLE_SVG_NODE_COUNT } from './svg-node-count';

const node = (id: string, children?: SvgsElem[]): SvgsElem => ({
    id: `id_${id}`,
    label: id,
    type: 'g',
    attrs: {},
    children,
});

describe('svg node count helpers', () => {
    it('counts nested svg nodes', () => {
        expect(countSvgNodes([node('a', [node('b'), node('c', [node('d')])])])).toBe(4);
    });

    it('marks SVG trees above the editable limit as non-editable', () => {
        const svgs = Array.from({ length: MAX_EDITABLE_SVG_NODE_COUNT + 1 }, (_value, index) => node(String(index)));

        expect(isSvgTreeEditable(svgs)).toBe(false);
    });
});
