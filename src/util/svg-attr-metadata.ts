import cssProperties from 'mdn-data/css/properties.json';
import { find, svg } from 'property-information';
import { svgElementAttributes } from 'svg-element-attributes';
import {
    ATTR_GROUP_ORDER,
    AttrControl,
    AttrGroup,
    AttrUiMeta,
    DEFAULT_ATTR_CONTROL,
    GLOBAL_ATTR_PRESET,
    SVG_ATTR_PRESETS,
    SvgAttrPreset,
} from '../constants/svg-attr-presets';
import { AttrBinding } from '../constants/attr-binding';

export interface SvgAttrMetadata {
    allAttrs: string[];
    recommendedAttrs: string[];
    advancedAttrs: string[];
    hiddenAttrs: string[];
}

export type GroupedAttrKeys = Record<AttrGroup, string[]>;

const attrLabels: Record<string, string> = {
    x: 'X position',
    y: 'Y position',
    x1: 'Start X',
    y1: 'Start Y',
    x2: 'End X',
    y2: 'End Y',
    cx: 'Center X',
    cy: 'Center Y',
    dx: 'Horizontal offset',
    dy: 'Vertical offset',
    r: 'Radius',
    rx: 'Horizontal corner radius',
    ry: 'Vertical corner radius',
    width: 'Width',
    height: 'Height',
    fill: 'Fill color',
    stroke: 'Stroke color',
    'stroke-width': 'Stroke width',
    'stroke-dasharray': 'Dash pattern',
    'stroke-linecap': 'Line cap',
    'stroke-linejoin': 'Line join',
    opacity: 'Opacity',
    transform: 'Move / rotate / scale',
    d: 'Path',
    points: 'Point list',
    _rmp_children_text: 'Text content',
    'font-size': 'Font size',
    'font-family': 'Font family',
    'font-weight': 'Font weight',
    'letter-spacing': 'Letter spacing',
    'text-anchor': 'Horizontal alignment',
    'dominant-baseline': 'Vertical alignment',
    className: 'Text style',
    viewBox: 'View box',
    color: 'Color',
    style: 'Style sheet',
    filter: 'Filter',
    mask: 'Mask',
    'clip-path': 'Clip path',
};

const fallbackAttrLabel = (attr: string): string =>
    attr
        .replace(/^aria-/, 'ARIA ')
        .replace(/^data-/, 'Data ')
        .split(/[-_:]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

export const getSvgAttrLabel = (type: string, attr: string): string => getAttrUiMeta(type, attr).title;

const hiddenByPrefix = (attr: string) => attr.toLowerCase().startsWith('on');

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const getPreset = (type: string): SvgAttrPreset => SVG_ATTR_PRESETS[type] ?? { recommendedAttrs: [] };

export const getSvgAttrMetadata = (type: string, existingAttrs: string[] = []): SvgAttrMetadata => {
    const preset = getPreset(type);
    const hiddenAttrs = unique([...(GLOBAL_ATTR_PRESET.hiddenAttrs ?? []), ...(preset.hiddenAttrs ?? [])]);
    const hidden = new Set(hiddenAttrs.map(attr => attr.toLowerCase()));
    const allowed = unique([
        ...(svgElementAttributes['*'] ?? []),
        ...(svgElementAttributes[type] ?? []),
        ...(preset.recommendedAttrs ?? []),
        ...existingAttrs,
    ]).filter(attr => !hidden.has(attr.toLowerCase()) && !hiddenByPrefix(attr));
    const recommendedAttrs = unique([...(preset.recommendedAttrs ?? []), ...existingAttrs]).filter(attr =>
        allowed.includes(attr)
    );
    const recommended = new Set(recommendedAttrs);
    const advancedAttrs = allowed.filter(attr => !recommended.has(attr)).sort((a, b) => a.localeCompare(b));

    return { allAttrs: allowed.sort((a, b) => a.localeCompare(b)), recommendedAttrs, advancedAttrs, hiddenAttrs };
};

const cssPropertyMap = cssProperties as unknown as Record<string, { syntax?: string; initial?: string | string[] }>;
const colorAttrs = new Set(['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color']);
const numberAttrs = new Set([
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'dx',
    'dy',
    'width',
    'height',
    'opacity',
    'stroke-width',
    'font-size',
]);

export const getAttrControl = (type: string, attr: string): AttrControl => {
    const preset = getPreset(type);
    const presetControl = preset.controls?.[attr] ?? GLOBAL_ATTR_PRESET.controls?.[attr];
    if (presetControl) return presetControl;
    if (attr === 'd') return { type: 'path' };
    if (attr === 'points') return { type: 'points' };
    if (attr === 'style') return { type: 'style' };
    if (attr === '_rmp_children_text') return { type: 'text-content' };
    if (colorAttrs.has(attr)) return { type: 'color' };
    if (numberAttrs.has(attr)) return { type: 'number', step: attr === 'opacity' ? 0.05 : 1 };

    const info = find(svg, attr);
    if (info.boolean || info.booleanish) return { type: 'switch' };
    if (info.number) return { type: 'number', step: 1 };
    const cssInfo = cssPropertyMap[attr];
    if (cssInfo?.syntax?.includes('<color>')) return { type: 'color' };
    if (cssInfo?.syntax?.includes('<number>') || cssInfo?.syntax?.includes('<length>')) return { type: 'number', step: 1 };

    return DEFAULT_ATTR_CONTROL;
};

const fallbackDescription = (type: string, attr: string): string => {
    const control = getAttrControl(type, attr);
    if (control.type === 'number') return 'Enter a number, or use a parameter or formula.';
    if (control.type === 'color') return 'Enter a color, or bind a color parameter.';
    if (control.type === 'select') return 'Choose a common option, or use a parameter.';
    if (control.type === 'path') return 'Controls the SVG path outline, usually imported from SVG.';
    if (control.type === 'points') return 'Controls polyline or polygon points, usually imported from SVG.';
    if (control.type === 'style') return 'Keeps style content imported from SVG.';
    return 'An extended SVG attribute, usually imported from SVG or added manually.';
};

const mergeUiMeta = (type: string, attr: string): Partial<AttrUiMeta> => {
    const preset = getPreset(type);
    return {
        ...(GLOBAL_ATTR_PRESET.ui?.[attr] ?? {}),
        ...(preset.ui?.[attr] ?? {}),
    };
};

export const getAttrUiMeta = (type: string, attr: string): AttrUiMeta => {
    const meta = mergeUiMeta(type, attr);
    return {
        group: meta.group ?? 'more',
        title: meta.title ?? attrLabels[attr] ?? fallbackAttrLabel(attr),
        description: meta.description ?? fallbackDescription(type, attr),
        effectHint: meta.effectHint,
        unitHint: meta.unitHint,
        examples: meta.examples,
        quickValues: meta.quickValues,
        visualRole: meta.visualRole,
    };
};

export const getGroupedAttrKeys = (
    type: string,
    attrs: Record<string, string>,
    attrBindings: Record<string, AttrBinding> | undefined
): GroupedAttrKeys => {
    const metadata = getSvgAttrMetadata(type, [...Object.keys(attrs), ...Object.keys(attrBindings ?? {})]);
    const keys = Array.from(new Set([...metadata.recommendedAttrs, ...Object.keys(attrs), ...Object.keys(attrBindings ?? {})]));
    const grouped = ATTR_GROUP_ORDER.reduce((acc, group) => ({ ...acc, [group]: [] }), {} as GroupedAttrKeys);

    keys.forEach(key => {
        const group = getAttrUiMeta(type, key).group;
        grouped[group].push(key);
    });

    return grouped;
};

export const getDefaultAttrBinding = (type: string, attr: string): AttrBinding => {
    const preset = getPreset(type);
    const presetDefault = preset.defaults?.[attr] ?? GLOBAL_ATTR_PRESET.defaults?.[attr];
    if (presetDefault) return presetDefault;
    const control = getAttrControl(type, attr);
    if (control.type === 'number') return { kind: 'literal', value: control.min ?? 0 };
    if (control.type === 'switch') return { kind: 'literal', value: false };
    if (control.type === 'color') return { kind: 'literal', value: '#000000' };
    if (control.type === 'style') return { kind: 'literal', value: {} };
    return { kind: 'literal', value: '' };
};
