import type { SvgsElem } from '../constants/constants';

export const MAX_EDITABLE_SVG_NODE_COUNT = 500;

export const countSvgNodes = (svgs: SvgsElem[]): number =>
    svgs.reduce((count, elem) => count + 1 + countSvgNodes(elem.children ?? []), 0);

export const isSvgTreeEditable = (svgs: SvgsElem[]): boolean => countSvgNodes(svgs) <= MAX_EDITABLE_SVG_NODE_COUNT;
