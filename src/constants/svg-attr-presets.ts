import type { AttrBinding } from './attr-binding';

export type AttrControlType =
    | 'text'
    | 'text-content'
    | 'textarea'
    | 'number'
    | 'color'
    | 'switch'
    | 'select'
    | 'points'
    | 'path'
    | 'style';
export type AttrGroup = 'position' | 'size' | 'shape' | 'fill' | 'stroke' | 'text' | 'transform' | 'effects' | 'more';

export type AttrVisualRole =
    | 'x'
    | 'y'
    | 'width'
    | 'height'
    | 'radius'
    | 'fill'
    | 'stroke'
    | 'text'
    | 'opacity'
    | 'transform';

export interface AttrControl {
    type: AttrControlType;
    min?: number;
    max?: number;
    step?: number;
    options?: Record<string, string>;
    placeholder?: string;
}

export interface AttrUiMeta {
    group: AttrGroup;
    title?: string;
    description?: string;
    effectHint?: string;
    unitHint?: string;
    examples?: string[];
    quickValues?: Array<string | number>;
    visualRole?: AttrVisualRole;
}

export interface SvgAttrPreset {
    recommendedAttrs: string[];
    hiddenAttrs?: string[];
    controls?: Record<string, AttrControl>;
    defaults?: Record<string, AttrBinding>;
    ui?: Record<string, Partial<AttrUiMeta>>;
}

const literal = (value: string | number | boolean | Record<string, unknown>): AttrBinding => ({
    kind: 'literal',
    value,
});

const number = (step = 1, min?: number, max?: number): AttrControl => ({ type: 'number', step, min, max });
const text: AttrControl = { type: 'text' };
const textContent: AttrControl = { type: 'text-content' };
const color: AttrControl = { type: 'color' };
const path: AttrControl = { type: 'path' };
const points: AttrControl = { type: 'points' };

const paintAttrs = [
    'fill',
    'stroke',
    'stroke-width',
    'stroke-dasharray',
    'stroke-linecap',
    'stroke-linejoin',
    'opacity',
];
const typographyAttrs = ['font-size', 'className', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline'];
const transformAttrs = ['transform', 'clip-path', 'mask', 'filter'];

export const ATTR_GROUP_ORDER: AttrGroup[] = [
    'position',
    'size',
    'shape',
    'fill',
    'stroke',
    'text',
    'transform',
    'effects',
    'more',
];

export const ATTR_GROUP_LABELS: Record<AttrGroup, string> = {
    position: 'Position',
    size: 'Size',
    shape: 'Shape',
    fill: 'Fill',
    stroke: 'Stroke',
    text: 'Text',
    transform: 'Transform',
    effects: 'Effects',
    more: 'More SVG attributes',
};

const ui = (
    group: AttrGroup,
    extra: Omit<Partial<AttrUiMeta>, 'group' | 'title' | 'description' | 'effectHint'> = {}
): AttrUiMeta => ({
    group,
    ...extra,
});

const commonUi: Record<string, AttrUiMeta> = {
    x: ui('position', {
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'x',
    }),
    y: ui('position', {
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'y',
    }),
    x1: ui('position', {
        quickValues: [-40, 0, 20, 40],
        visualRole: 'x',
    }),
    y1: ui('position', {
        quickValues: [-40, 0, 20, 40],
        visualRole: 'y',
    }),
    x2: ui('position', {
        quickValues: [-40, 0, 20, 40],
        visualRole: 'x',
    }),
    y2: ui('position', {
        quickValues: [-40, 0, 20, 40],
        visualRole: 'y',
    }),
    cx: ui('position', {
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'x',
    }),
    cy: ui('position', {
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'y',
    }),
    dx: ui('position', {
        quickValues: [-10, -5, 0, 5, 10],
        visualRole: 'x',
    }),
    dy: ui('position', {
        quickValues: [-10, -5, 0, 5, 10],
        visualRole: 'y',
    }),
    width: ui('size', {
        quickValues: [8, 16, 24, 40, 80],
        visualRole: 'width',
    }),
    height: ui('size', {
        quickValues: [8, 10, 16, 24, 40],
        visualRole: 'height',
    }),
    r: ui('size', {
        quickValues: [4, 6, 8, 10, 12],
        visualRole: 'radius',
    }),
    rx: ui('shape', {
        quickValues: [0, 2, 4, 8, 12],
        visualRole: 'radius',
    }),
    ry: ui('shape', {
        quickValues: [0, 2, 4, 8, 12],
        visualRole: 'radius',
    }),
    d: ui('shape', {
        examples: ['M 0 0 L 20 0 L 20 10 Z'],
    }),
    points: ui('shape', {
        examples: ['0,0 20,0 10,15'],
    }),
    fill: ui('fill', {
        quickValues: ['#D6ABC1', '#000000', '#FFFFFF', 'none'],
        visualRole: 'fill',
    }),
    color: ui('fill', {
        quickValues: ['#000000', '#FFFFFF', '#C23A30'],
        visualRole: 'fill',
    }),
    stroke: ui('stroke', {
        quickValues: ['none', '#000000', '#FFFFFF', '#C23A30'],
        visualRole: 'stroke',
    }),
    'stroke-width': ui('stroke', {
        quickValues: [0, 1, 2, 4],
        visualRole: 'stroke',
    }),
    'stroke-dasharray': ui('stroke', {
        quickValues: ['', '4 2', '8 4'],
        examples: ['4 2'],
        visualRole: 'stroke',
    }),
    'stroke-linecap': ui('stroke', {
        quickValues: ['butt', 'round', 'square'],
        visualRole: 'stroke',
    }),
    'stroke-linejoin': ui('stroke', {
        quickValues: ['miter', 'round', 'bevel'],
        visualRole: 'stroke',
    }),
    _rmp_children_text: ui('text', {
        examples: ['Station name', '{Station name}'],
        visualRole: 'text',
    }),
    'font-size': ui('text', {
        quickValues: [6, 8, 10, 12, 16],
        visualRole: 'text',
    }),
    'font-family': ui('text', {
        visualRole: 'text',
    }),
    'font-weight': ui('text', {
        quickValues: ['normal', 'bold', 400, 700],
        visualRole: 'text',
    }),
    'letter-spacing': ui('text', {
        quickValues: [-2, -1, 0, 1, 2],
        visualRole: 'text',
    }),
    'text-anchor': ui('text', {
        quickValues: ['start', 'middle', 'end'],
        visualRole: 'text',
    }),
    'dominant-baseline': ui('text', {
        quickValues: ['auto', 'middle', 'central'],
        visualRole: 'text',
    }),
    className: ui('text', {
        visualRole: 'text',
    }),
    transform: ui('transform', {
        examples: ['translate(10, 0)', 'rotate(45)', 'scale(1.2)'],
        visualRole: 'transform',
    }),
    viewBox: ui('transform', {
        examples: ['0 0 100 100'],
        visualRole: 'transform',
    }),
    opacity: ui('effects', {
        quickValues: [0, 0.25, 0.5, 0.75, 1],
        visualRole: 'opacity',
    }),
    'clip-path': ui('more'),
    mask: ui('more'),
    filter: ui('more'),
    style: ui('more'),
};

const commonControls: Record<string, AttrControl> = {
    x: number(),
    y: number(),
    x1: number(),
    y1: number(),
    x2: number(),
    y2: number(),
    cx: number(),
    cy: number(),
    r: number(1, 0),
    rx: number(1, 0),
    ry: number(1, 0),
    width: number(1, 0),
    height: number(1, 0),
    opacity: number(0.05, 0, 1),
    'stroke-width': number(0.5, 0),
    fill: color,
    stroke: color,
    color,
    'font-size': number(1, 0),
    'font-weight': text,
    'stroke-dasharray': text,
    transform: text,
    className: {
        type: 'select',
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
    'text-anchor': {
        type: 'select',
        options: {
            start: 'Start',
            middle: 'Middle',
            end: 'End',
        },
    },
    'dominant-baseline': {
        type: 'select',
        options: {
            auto: 'Auto',
            middle: 'Middle',
            central: 'Central',
            hanging: 'Hanging',
            baseline: 'Baseline',
        },
    },
    'stroke-linecap': {
        type: 'select',
        options: {
            butt: 'Butt',
            round: 'Round',
            square: 'Square',
        },
    },
    'stroke-linejoin': {
        type: 'select',
        options: {
            miter: 'Miter',
            round: 'Round',
            bevel: 'Bevel',
        },
    },
    points,
    d: path,
    _rmp_children_text: textContent,
    style: { type: 'style' },
};

const commonDefaults: Record<string, AttrBinding> = {
    x: literal(0),
    y: literal(0),
    cx: literal(0),
    cy: literal(0),
    r: literal(10),
    rx: literal(0),
    ry: literal(0),
    width: literal(20),
    height: literal(10),
    opacity: literal(1),
    fill: literal('#D6ABC1'),
    stroke: literal('none'),
    'stroke-width': literal(1),
    'stroke-linecap': literal('round'),
    'stroke-linejoin': literal('round'),
    'font-size': literal(10),
    'text-anchor': literal('start'),
    'dominant-baseline': literal('auto'),
    _rmp_children_text: literal('text'),
    points: literal('0,0 20,0 10,15'),
    d: literal('M 0 0 L 20 0 L 20 10 L 0 10 Z'),
    transform: literal(''),
};

const hiddenAttrs = [
    'href',
    'xlink:href',
    'download',
    'target',
    'onclick',
    'onload',
    'onerror',
    'onmouseover',
    'onmouseout',
    'onpointerdown',
    'onpointermove',
    'onpointerup',
];

export const DEFAULT_ATTR_CONTROL: AttrControl = { type: 'text' };

export const GLOBAL_ATTR_PRESET: SvgAttrPreset = {
    recommendedAttrs: ['x', 'y', ...paintAttrs, ...transformAttrs],
    hiddenAttrs,
    controls: commonControls,
    defaults: commonDefaults,
    ui: commonUi,
};

export const SVG_ATTR_PRESETS: Record<string, SvgAttrPreset> = {
    rect: {
        recommendedAttrs: ['x', 'y', 'width', 'height', 'rx', 'ry', ...paintAttrs, ...transformAttrs],
    },
    circle: {
        recommendedAttrs: ['cx', 'cy', 'r', ...paintAttrs, ...transformAttrs],
    },
    ellipse: {
        recommendedAttrs: ['cx', 'cy', 'rx', 'ry', ...paintAttrs, ...transformAttrs],
    },
    line: {
        recommendedAttrs: [
            'x1',
            'y1',
            'x2',
            'y2',
            'stroke',
            'stroke-width',
            'stroke-dasharray',
            'stroke-linecap',
            'opacity',
        ],
        defaults: {
            x1: literal(0),
            y1: literal(0),
            x2: literal(20),
            y2: literal(0),
            stroke: literal('#000000'),
            'stroke-width': literal(1),
        },
    },
    polyline: {
        recommendedAttrs: ['points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity'],
    },
    polygon: {
        recommendedAttrs: ['points', ...paintAttrs, ...transformAttrs],
    },
    path: {
        recommendedAttrs: ['d', ...paintAttrs, ...transformAttrs],
    },
    text: {
        recommendedAttrs: [
            'x',
            'y',
            '_rmp_children_text',
            ...typographyAttrs,
            'fill',
            'stroke',
            'stroke-width',
            'opacity',
            ...transformAttrs,
        ],
    },
    tspan: {
        recommendedAttrs: [
            'x',
            'y',
            'dx',
            'dy',
            '_rmp_children_text',
            ...typographyAttrs,
            'fill',
            'stroke',
            'stroke-width',
            'opacity',
        ],
        controls: {
            dx: number(),
            dy: number(),
        },
        defaults: {
            dx: literal(0),
            dy: literal(0),
        },
    },
    g: {
        recommendedAttrs: ['x', 'y', ...paintAttrs, ...transformAttrs],
    },
    svg: {
        recommendedAttrs: ['viewBox', 'width', 'height', ...paintAttrs, ...transformAttrs],
        controls: {
            viewBox: text,
        },
    },
    style: {
        recommendedAttrs: ['_rmp_children_text'],
        controls: {
            _rmp_children_text: { type: 'textarea' },
        },
        defaults: {
            _rmp_children_text: literal('.class-name { fill: #000000; }'),
        },
    },
};
