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
    title: string;
    description: string;
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
const typographyAttrs = ['font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'className'];
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
    title: string,
    description: string,
    extra: Omit<Partial<AttrUiMeta>, 'group' | 'title' | 'description'> = {}
): AttrUiMeta => ({
    group,
    title,
    description,
    ...extra,
});

const commonUi: Record<string, AttrUiMeta> = {
    x: ui('position', 'X position', 'Controls the horizontal position of a shape or text start point.', {
        effectHint: 'Larger numbers move it to the right.',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'x',
    }),
    y: ui('position', 'Y position', 'Controls the vertical position of a shape or text start point.', {
        effectHint: 'Larger numbers move it down.',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'y',
    }),
    x1: ui('position', 'Start X', 'Controls the horizontal position of the line start.', {
        effectHint: 'Larger numbers move the start point to the right.',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'x',
    }),
    y1: ui('position', 'Start Y', 'Controls the vertical position of the line start.', {
        effectHint: 'Larger numbers move the start point down.',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'y',
    }),
    x2: ui('position', 'End X', 'Controls the horizontal position of the line end.', {
        effectHint: 'Larger numbers move the end point to the right.',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'x',
    }),
    y2: ui('position', 'End Y', 'Controls the vertical position of the line end.', {
        effectHint: 'Larger numbers move the end point down.',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'y',
    }),
    cx: ui('position', 'Center X', 'Controls the horizontal position of a circle or ellipse center.', {
        effectHint: 'Larger numbers move the center to the right.',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'x',
    }),
    cy: ui('position', 'Center Y', 'Controls the vertical position of a circle or ellipse center.', {
        effectHint: 'Larger numbers move the center down.',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'y',
    }),
    dx: ui('position', 'Horizontal offset', 'Moves text or child elements horizontally from their original position.', {
        effectHint: 'Positive values move right; negative values move left.',
        quickValues: [-10, -5, 0, 5, 10],
        visualRole: 'x',
    }),
    dy: ui('position', 'Vertical offset', 'Moves text or child elements vertically from their original position.', {
        effectHint: 'Positive values move down; negative values move up.',
        quickValues: [-10, -5, 0, 5, 10],
        visualRole: 'y',
    }),
    width: ui('size', 'Width', 'Controls the horizontal size of the shape.', {
        effectHint: 'Larger numbers make it wider.',
        quickValues: [8, 16, 24, 40, 80],
        visualRole: 'width',
    }),
    height: ui('size', 'Height', 'Controls the vertical size of the shape.', {
        effectHint: 'Larger numbers make it taller.',
        quickValues: [8, 10, 16, 24, 40],
        visualRole: 'height',
    }),
    r: ui('size', 'Radius', 'Controls the distance from the circle center to its edge.', {
        effectHint: 'Larger numbers make the circle bigger.',
        quickValues: [4, 6, 8, 10, 12],
        visualRole: 'radius',
    }),
    rx: ui(
        'shape',
        'Horizontal corner radius',
        'Controls a rectangle horizontal corner radius, or an ellipse horizontal radius.',
        {
            effectHint: 'For rectangles, larger numbers make side corners rounder.',
            quickValues: [0, 2, 4, 8, 12],
            visualRole: 'radius',
        }
    ),
    ry: ui(
        'shape',
        'Vertical corner radius',
        'Controls a rectangle vertical corner radius, or an ellipse vertical radius.',
        {
            effectHint: 'For rectangles, larger numbers make top and bottom corners rounder.',
            quickValues: [0, 2, 4, 8, 12],
            visualRole: 'radius',
        }
    ),
    d: ui('shape', 'Path', 'Controls the outline of a path shape.', {
        effectHint: 'Usually imported from SVG software and not edited by hand.',
        examples: ['M 0 0 L 20 0 L 20 10 Z'],
    }),
    points: ui('shape', 'Point list', 'Controls the points used by a polyline or polygon.', {
        effectHint: 'Each number pair is a point, for example 0,0 20,0.',
        examples: ['0,0 20,0 10,15'],
    }),
    fill: ui('fill', 'Fill color', 'Controls the color inside the shape.', {
        effectHint: 'Set to none for transparent fill.',
        quickValues: ['#D6ABC1', '#000000', '#FFFFFF', 'none'],
        visualRole: 'fill',
    }),
    color: ui('fill', 'Color', 'Base color inherited by child elements or text.', {
        quickValues: ['#000000', '#FFFFFF', '#C23A30'],
        visualRole: 'fill',
    }),
    stroke: ui('stroke', 'Stroke color', 'Controls the outline or line color.', {
        effectHint: 'Set to none to hide the stroke.',
        quickValues: ['none', '#000000', '#FFFFFF', '#C23A30'],
        visualRole: 'stroke',
    }),
    'stroke-width': ui('stroke', 'Stroke width', 'Controls how thick the outline is.', {
        effectHint: 'Larger numbers make the stroke thicker; 0 means no stroke.',
        quickValues: [0, 1, 2, 4],
        visualRole: 'stroke',
    }),
    'stroke-dasharray': ui('stroke', 'Dash pattern', 'Controls whether the outline or line is dashed.', {
        effectHint: 'For example, 4 2 means a dash followed by a gap.',
        quickValues: ['', '4 2', '8 4'],
        examples: ['4 2'],
        visualRole: 'stroke',
    }),
    'stroke-linecap': ui('stroke', 'Line cap', 'Controls whether line ends are flat, round, or square.', {
        effectHint: 'round often works well for transit maps.',
        quickValues: ['butt', 'round', 'square'],
        visualRole: 'stroke',
    }),
    'stroke-linejoin': ui('stroke', 'Line join', 'Controls the shape where line segments meet.', {
        effectHint: 'round makes corners smoother.',
        quickValues: ['miter', 'round', 'bevel'],
        visualRole: 'stroke',
    }),
    _rmp_children_text: ui('text', 'Text content', 'Controls the content shown by this text element.', {
        examples: ['Station name', '{Station name}'],
        visualRole: 'text',
    }),
    'font-size': ui('text', 'Font size', 'Controls text size.', {
        effectHint: 'Larger numbers make text larger.',
        quickValues: [6, 8, 10, 12, 16],
        visualRole: 'text',
    }),
    'font-family': ui('text', 'Font family', 'Controls the font family used by text.', {
        effectHint: 'Usually prefer a text style class instead of a direct font name.',
        visualRole: 'text',
    }),
    'font-weight': ui('text', 'Font weight', 'Controls text weight.', {
        quickValues: ['normal', 'bold', 400, 700],
        visualRole: 'text',
    }),
    'letter-spacing': ui('text', 'Letter spacing', 'Controls spacing between letters.', {
        effectHint: 'Negative values tighten text; positive values loosen text.',
        quickValues: [-2, -1, 0, 1, 2],
        visualRole: 'text',
    }),
    'text-anchor': ui('text', 'Horizontal alignment', 'Controls how text aligns relative to its X position.', {
        effectHint: 'middle centers text on the X position.',
        quickValues: ['start', 'middle', 'end'],
        visualRole: 'text',
    }),
    'dominant-baseline': ui('text', 'Vertical alignment', 'Controls how text aligns relative to its Y position.', {
        effectHint: 'middle or central is often used to center text inside a shape.',
        quickValues: ['auto', 'middle', 'central'],
        visualRole: 'text',
    }),
    className: ui('text', 'Text style', 'Chooses a built-in RMP text style.', {
        effectHint: 'Used to match font styles for different cities or languages.',
        visualRole: 'text',
    }),
    transform: ui('transform', 'Move / rotate / scale', 'Applies a transform to the whole shape.', {
        effectHint: 'For example, translate(10, 0) moves the shape to the right.',
        examples: ['translate(10, 0)', 'rotate(45)', 'scale(1.2)'],
        visualRole: 'transform',
    }),
    viewBox: ui('transform', 'View box', 'Controls the visible range of the SVG coordinate system.', {
        effectHint: 'Usually used on a full SVG container and not edited casually.',
        examples: ['0 0 100 100'],
        visualRole: 'transform',
    }),
    opacity: ui('effects', 'Opacity', 'Controls how transparent the whole shape is.', {
        effectHint: '0 is fully transparent; 1 is fully opaque.',
        quickValues: [0, 0.25, 0.5, 0.75, 1],
        visualRole: 'opacity',
    }),
    'clip-path': ui('more', 'Clip path', 'Uses another shape to clip part of the current shape.', {
        effectHint: 'Usually imported from SVG and can be left unchanged.',
    }),
    mask: ui('more', 'Mask', 'Uses a mask to control which parts of the shape are visible.', {
        effectHint: 'Usually imported from SVG and can be left unchanged.',
    }),
    filter: ui('more', 'Filter', 'Adds SVG effects such as shadows or blur.', {
        effectHint: 'RMP compatibility depends on the filter content.',
    }),
    style: ui('more', 'Style sheet', 'Keeps inline style content imported from SVG.', {
        effectHint: 'Usually imported from SVG and edited only for fine tuning.',
    }),
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
