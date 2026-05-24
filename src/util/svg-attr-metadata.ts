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
    x: 'X 位置',
    y: 'Y 位置',
    x1: '起点 X',
    y1: '起点 Y',
    x2: '终点 X',
    y2: '终点 Y',
    cx: '中心 X',
    cy: '中心 Y',
    dx: '水平偏移',
    dy: '垂直偏移',
    r: '半径',
    rx: '水平圆角/半径',
    ry: '垂直圆角/半径',
    width: '宽度',
    height: '高度',
    fill: '填充颜色',
    stroke: '边框颜色',
    'stroke-width': '边框粗细',
    'stroke-dasharray': '虚线样式',
    'stroke-linecap': '线端样式',
    'stroke-linejoin': '转角样式',
    opacity: '透明度',
    transform: '移动/旋转/缩放',
    d: '路径',
    points: '点列表',
    _rmp_children_text: '文本内容',
    'font-size': '字号',
    'font-family': '字体',
    'font-weight': '字重',
    'letter-spacing': '字间距',
    'text-anchor': '水平对齐',
    'dominant-baseline': '垂直对齐',
    className: '文字样式',
    viewBox: '视图范围',
    color: '颜色',
    style: '样式表',
    filter: '滤镜',
    mask: '遮罩',
    'clip-path': '裁剪区域',
};

const fallbackAttrLabel = (attr: string): string =>
    attr
        .replace(/^aria-/, '辅助信息 ')
        .replace(/^data-/, '数据 ')
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
    if (attr === '_rmp_children_text') return { type: 'textarea' };
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
    if (control.type === 'number') return '输入数字，也可以用参数或计算公式控制这个值。';
    if (control.type === 'color') return '输入颜色，也可以绑定颜色参数。';
    if (control.type === 'select') return '从常用选项中选择，或输入参数控制。';
    if (control.type === 'path') return '控制 SVG 路径轮廓，通常来自上传 SVG。';
    if (control.type === 'points') return '控制折线或多边形的点位，通常来自上传 SVG。';
    if (control.type === 'style') return '保留上传 SVG 的样式内容。';
    return '这是 SVG 的扩展属性，通常来自上传 SVG 或手动添加。';
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
