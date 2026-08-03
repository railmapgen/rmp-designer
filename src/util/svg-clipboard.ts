import { Id, SvgsElem } from '../constants/constants';
import type { Components } from '../constants/components';
import type { AttrBinding } from '../constants/attr-binding';
import { createLiteralAttrBinding } from '../constants/attr-binding';
import { nanoid, roundToNearestN } from './helper';
import { compileAttrBindingToLegacyAttr, legacyAttrToBinding } from './attr-binding';

export const SVG_ELEMENT_CLIPBOARD_TYPE = 'rmp-designer/svg-element';
export const SVG_ELEMENTS_CLIPBOARD_TYPE = 'rmp-designer/svg-elements';
export const SVG_CLIPBOARD_VERSION = 1;

export interface SvgElementClipboardPayload {
    version: typeof SVG_CLIPBOARD_VERSION;
    type: typeof SVG_ELEMENTS_CLIPBOARD_TYPE;
    elements: SvgsElem[];
}

export interface SvgPastePosition {
    x: number;
    y: number;
}

const clonePlain = <T>(value: T): T => {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value)) as T;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
    isRecord(value) && Object.values(value).every(item => typeof item === 'string');

const isUnknownRecord = (value: unknown): value is Record<string, unknown> => isRecord(value);

const isSvgElem = (value: unknown): value is SvgsElem => {
    if (!isRecord(value)) return false;
    const children = value.children;
    const attrBindings = value.attrBindings;

    return (
        typeof value.id === 'string' &&
        value.id.startsWith('id_') &&
        typeof value.type === 'string' &&
        typeof value.label === 'string' &&
        isStringRecord(value.attrs) &&
        (attrBindings === undefined || isUnknownRecord(attrBindings)) &&
        (children === undefined || (Array.isArray(children) && children.every(isSvgElem)))
    );
};

export const findSvgElemById = (svgs: SvgsElem[], id: Id): SvgsElem | undefined => {
    for (const elem of svgs) {
        if (elem.id === id) return elem;
        const child = elem.children ? findSvgElemById(elem.children, id) : undefined;
        if (child) return child;
    }
    return undefined;
};

export const findSelectedSvgElems = (svgs: SvgsElem[], selectedIds: Set<Id>): SvgsElem[] => {
    const selectedElems: SvgsElem[] = [];

    const walk = (elems: SvgsElem[]) => {
        elems.forEach(elem => {
            if (selectedIds.has(elem.id)) {
                selectedElems.push(elem);
                return;
            }
            if (elem.children) walk(elem.children);
        });
    };

    walk(svgs);
    return selectedElems;
};

export const createSvgElementClipboardPayload = (elements: SvgsElem[]): SvgElementClipboardPayload => ({
    version: SVG_CLIPBOARD_VERSION,
    type: SVG_ELEMENTS_CLIPBOARD_TYPE,
    elements: clonePlain(elements),
});

export const createSvgElementClipboardText = (elements: SvgsElem[]): string =>
    JSON.stringify(createSvgElementClipboardPayload(elements));

export const parseSvgElementClipboardText = (text: string): SvgElementClipboardPayload | undefined => {
    try {
        const value = JSON.parse(text);
        if (!isRecord(value)) return undefined;
        if (value.version !== SVG_CLIPBOARD_VERSION) return undefined;

        if (value.type === SVG_ELEMENT_CLIPBOARD_TYPE) {
            const element = value.element;
            if (!isSvgElem(element)) return undefined;
            return {
                version: SVG_CLIPBOARD_VERSION,
                type: SVG_ELEMENTS_CLIPBOARD_TYPE,
                elements: [element],
            };
        }

        if (value.type !== SVG_ELEMENTS_CLIPBOARD_TYPE) return undefined;
        const elements = value.elements;
        if (!Array.isArray(elements) || !elements.every(isSvgElem)) return undefined;
        return {
            version: SVG_CLIPBOARD_VERSION,
            type: SVG_ELEMENTS_CLIPBOARD_TYPE,
            elements,
        };
    } catch {
        return undefined;
    }
};

const numericLiteralValue = (value: unknown): number | undefined => {
    if (typeof value !== 'number' && typeof value !== 'string') return undefined;
    if (String(value).trim() === '') return undefined;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? undefined : numberValue;
};

const getNumericPositionAttr = (elem: SvgsElem, key: 'x' | 'y', components: Components[]): number | undefined => {
    const binding = elem.attrBindings?.[key];
    if (binding) return binding.kind === 'literal' ? numericLiteralValue(binding.value) : undefined;

    const attr = elem.attrs[key];
    if (attr === undefined) return 0;

    const legacyBinding = legacyAttrToBinding(attr, components);
    return legacyBinding.kind === 'literal' ? numericLiteralValue(legacyBinding.value) : undefined;
};

const getElemPosition = (elem: SvgsElem, components: Components[]): SvgPastePosition | undefined => {
    const x = getNumericPositionAttr(elem, 'x', components);
    const y = getNumericPositionAttr(elem, 'y', components);
    return x === undefined || y === undefined ? undefined : { x, y };
};

const getPasteAnchor = (elements: SvgsElem[], components: Components[]): SvgPastePosition | undefined => {
    const positions = elements
        .map(elem => getElemPosition(elem, components))
        .filter((position): position is SvgPastePosition => !!position);

    if (positions.length === 0) return undefined;

    return {
        x: Math.min(...positions.map(position => position.x)),
        y: Math.min(...positions.map(position => position.y)),
    };
};

const getPositionPatch = (
    x: number,
    y: number,
    components: Components[]
): { attrs: Record<'x' | 'y', string>; attrBindings: Record<'x' | 'y', AttrBinding> } => {
    const xBinding = createLiteralAttrBinding(roundToNearestN(x, 1));
    const yBinding = createLiteralAttrBinding(roundToNearestN(y, 1));

    return {
        attrs: {
            x: compileAttrBindingToLegacyAttr(xBinding, components),
            y: compileAttrBindingToLegacyAttr(yBinding, components),
        },
        attrBindings: {
            x: xBinding,
            y: yBinding,
        },
    };
};

const applyPastePosition = (
    pasted: SvgsElem,
    original: SvgsElem,
    anchor: SvgPastePosition | undefined,
    position: SvgPastePosition | undefined,
    components: Components[]
): SvgsElem => {
    if (!anchor || !position) return pasted;

    const originalPosition = getElemPosition(original, components);
    if (!originalPosition) return pasted;

    const patch = getPositionPatch(
        position.x + originalPosition.x - anchor.x,
        position.y + originalPosition.y - anchor.y,
        components
    );

    return {
        ...pasted,
        attrs: { ...pasted.attrs, ...patch.attrs },
        attrBindings: { ...(pasted.attrBindings ?? {}), ...patch.attrBindings },
    };
};

export const createPastedSvgElem = (element: SvgsElem, createId: () => Id = () => `id_${nanoid(10)}`): SvgsElem => {
    const { children, ...rest } = element;
    return {
        ...clonePlain(rest),
        id: createId(),
        children: children?.map(child => createPastedSvgElem(child, createId)),
    };
};

export const createPastedSvgElems = (
    elements: SvgsElem[],
    components: Components[] = [],
    position?: SvgPastePosition
): SvgsElem[] => {
    const anchor = position ? getPasteAnchor(elements, components) : undefined;
    return elements.map(element =>
        applyPastePosition(createPastedSvgElem(element), element, anchor, position, components)
    );
};
