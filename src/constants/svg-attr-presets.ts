import type { AttrBinding } from './attr-binding';

export type AttrControlType = 'text' | 'textarea' | 'number' | 'color' | 'switch' | 'select' | 'points' | 'path' | 'style';
export type AttrGroup =
    | 'position'
    | 'size'
    | 'shape'
    | 'fill'
    | 'stroke'
    | 'text'
    | 'transform'
    | 'effects'
    | 'more';

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
const color: AttrControl = { type: 'color' };
const path: AttrControl = { type: 'path' };
const points: AttrControl = { type: 'points' };

const paintAttrs = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity'];
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
    position: '位置',
    size: '大小',
    shape: '形状',
    fill: '填充',
    stroke: '边框',
    text: '文字',
    transform: '变换',
    effects: '效果',
    more: '更多 SVG 属性',
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
    x: ui('position', 'X 位置', '控制图形左上角或文字起点的水平位置。', {
        effectHint: '数字越大越靠右。',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'x',
    }),
    y: ui('position', 'Y 位置', '控制图形左上角或文字起点的垂直位置。', {
        effectHint: '数字越大越靠下。',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'y',
    }),
    x1: ui('position', '起点 X', '控制线条起点的水平位置。', {
        effectHint: '数字越大起点越靠右。',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'x',
    }),
    y1: ui('position', '起点 Y', '控制线条起点的垂直位置。', {
        effectHint: '数字越大起点越靠下。',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'y',
    }),
    x2: ui('position', '终点 X', '控制线条终点的水平位置。', {
        effectHint: '数字越大终点越靠右。',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'x',
    }),
    y2: ui('position', '终点 Y', '控制线条终点的垂直位置。', {
        effectHint: '数字越大终点越靠下。',
        quickValues: [-40, 0, 20, 40],
        visualRole: 'y',
    }),
    cx: ui('position', '中心 X', '控制圆形或椭圆中心点的水平位置。', {
        effectHint: '数字越大中心越靠右。',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'x',
    }),
    cy: ui('position', '中心 Y', '控制圆形或椭圆中心点的垂直位置。', {
        effectHint: '数字越大中心越靠下。',
        quickValues: [-40, -20, 0, 20, 40],
        visualRole: 'y',
    }),
    dx: ui('position', '水平偏移', '让文字或子元素在原位置基础上左右移动。', {
        effectHint: '正数向右，负数向左。',
        quickValues: [-10, -5, 0, 5, 10],
        visualRole: 'x',
    }),
    dy: ui('position', '垂直偏移', '让文字或子元素在原位置基础上上下移动。', {
        effectHint: '正数向下，负数向上。',
        quickValues: [-10, -5, 0, 5, 10],
        visualRole: 'y',
    }),
    width: ui('size', '宽度', '控制图形横向占用的大小。', {
        effectHint: '数字越大越宽。',
        quickValues: [8, 16, 24, 40, 80],
        visualRole: 'width',
    }),
    height: ui('size', '高度', '控制图形纵向占用的大小。', {
        effectHint: '数字越大越高。',
        quickValues: [8, 10, 16, 24, 40],
        visualRole: 'height',
    }),
    r: ui('size', '半径', '控制圆形从中心到边缘的距离。', {
        effectHint: '数字越大圆越大。',
        quickValues: [4, 6, 8, 10, 12],
        visualRole: 'radius',
    }),
    rx: ui('shape', '水平圆角/半径', '控制矩形横向圆角，或椭圆横向半径。', {
        effectHint: '矩形里数字越大，左右圆角越明显。',
        quickValues: [0, 2, 4, 8, 12],
        visualRole: 'radius',
    }),
    ry: ui('shape', '垂直圆角/半径', '控制矩形纵向圆角，或椭圆纵向半径。', {
        effectHint: '矩形里数字越大，上下圆角越明显。',
        quickValues: [0, 2, 4, 8, 12],
        visualRole: 'radius',
    }),
    d: ui('shape', '路径', '控制 path 图形的轮廓。', {
        effectHint: '通常从 SVG 软件导入后保留，不建议手写。',
        examples: ['M 0 0 L 20 0 L 20 10 Z'],
    }),
    points: ui('shape', '点列表', '控制折线或多边形经过的点。', {
        effectHint: '每组数字表示一个点，例如 0,0 20,0。',
        examples: ['0,0 20,0 10,15'],
    }),
    fill: ui('fill', '填充颜色', '控制图形内部填充的颜色。', {
        effectHint: '设置为 none 可以变成透明填充。',
        quickValues: ['#D6ABC1', '#000000', '#FFFFFF', 'none'],
        visualRole: 'fill',
    }),
    color: ui('fill', '颜色', '给子元素或文字继承使用的基础颜色。', {
        quickValues: ['#000000', '#FFFFFF', '#C23A30'],
        visualRole: 'fill',
    }),
    stroke: ui('stroke', '边框颜色', '控制外框或线条的颜色。', {
        effectHint: '设置为 none 可以隐藏边框。',
        quickValues: ['none', '#000000', '#FFFFFF', '#C23A30'],
        visualRole: 'stroke',
    }),
    'stroke-width': ui('stroke', '边框粗细', '控制外框线条有多粗。', {
        effectHint: '数字越大边框越粗，0 表示没有边框。',
        quickValues: [0, 1, 2, 4],
        visualRole: 'stroke',
    }),
    'stroke-dasharray': ui('stroke', '虚线样式', '控制边框或线条是否显示为虚线。', {
        effectHint: '例如 4 2 表示一段实线后留一段空白。',
        quickValues: ['', '4 2', '8 4'],
        examples: ['4 2'],
        visualRole: 'stroke',
    }),
    'stroke-linecap': ui('stroke', '线端样式', '控制线条两端是平直、圆头还是方头。', {
        effectHint: 'round 通常更适合线路图。',
        quickValues: ['butt', 'round', 'square'],
        visualRole: 'stroke',
    }),
    'stroke-linejoin': ui('stroke', '转角样式', '控制线条转弯处的连接形状。', {
        effectHint: 'round 会让转角更圆滑。',
        quickValues: ['miter', 'round', 'bevel'],
        visualRole: 'stroke',
    }),
    _rmp_children_text: ui('text', '文本内容', '控制这个文字元素显示的内容。', {
        examples: ['站名', '{Station name}'],
        visualRole: 'text',
    }),
    'font-size': ui('text', '字号', '控制文字大小。', {
        effectHint: '数字越大文字越大。',
        quickValues: [6, 8, 10, 12, 16],
        visualRole: 'text',
    }),
    'font-family': ui('text', '字体', '控制文字使用的字体族。', {
        effectHint: '通常建议使用文字样式 class，而不是直接写字体名。',
        visualRole: 'text',
    }),
    'font-weight': ui('text', '字重', '控制文字粗细。', {
        quickValues: ['normal', 'bold', 400, 700],
        visualRole: 'text',
    }),
    'letter-spacing': ui('text', '字间距', '控制文字之间的距离。', {
        effectHint: '负数会让字更紧，正数会让字更松。',
        quickValues: [-2, -1, 0, 1, 2],
        visualRole: 'text',
    }),
    'text-anchor': ui('text', '水平对齐', '控制文字相对 X 位置的左右对齐方式。', {
        effectHint: 'middle 表示文字以 X 位置为中心。',
        quickValues: ['start', 'middle', 'end'],
        visualRole: 'text',
    }),
    'dominant-baseline': ui('text', '垂直对齐', '控制文字相对 Y 位置的上下对齐方式。', {
        effectHint: 'middle/central 常用于把文字放在图形中间。',
        quickValues: ['auto', 'middle', 'central'],
        visualRole: 'text',
    }),
    className: ui('text', '文字样式', '选择 RMP 内置的文字样式。', {
        effectHint: '用于匹配不同城市或语言的字体风格。',
        visualRole: 'text',
    }),
    transform: ui('transform', '移动/旋转/缩放', '对整个图形做整体变换。', {
        effectHint: '例如 translate(10, 0) 表示整体向右移动。',
        examples: ['translate(10, 0)', 'rotate(45)', 'scale(1.2)'],
        visualRole: 'transform',
    }),
    viewBox: ui('transform', '视图范围', '控制 SVG 内部坐标系的可见范围。', {
        effectHint: '通常用于完整 SVG 容器，不建议随意修改。',
        examples: ['0 0 100 100'],
        visualRole: 'transform',
    }),
    opacity: ui('effects', '透明度', '控制整个图形是否透明。', {
        effectHint: '0 完全透明，1 完全不透明。',
        quickValues: [0, 0.25, 0.5, 0.75, 1],
        visualRole: 'opacity',
    }),
    'clip-path': ui('more', '裁剪区域', '用另一个形状裁掉当前图形的一部分。', {
        effectHint: '通常来自导入 SVG，普通编辑可以保持不变。',
    }),
    mask: ui('more', '遮罩', '用遮罩控制图形哪些部分可见。', {
        effectHint: '通常来自导入 SVG，普通编辑可以保持不变。',
    }),
    filter: ui('more', '滤镜', '给图形添加阴影、模糊等 SVG 效果。', {
        effectHint: 'RMP 兼容性取决于具体滤镜内容。',
    }),
    style: ui('more', '样式表', '保留导入 SVG 中的内联样式。', {
        effectHint: '通常来自上传 SVG，只有需要细调时才修改。',
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
    _rmp_children_text: { type: 'textarea' },
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
        recommendedAttrs: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'opacity'],
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
        recommendedAttrs: ['x', 'y', '_rmp_children_text', ...typographyAttrs, 'fill', 'stroke', 'opacity', ...transformAttrs],
    },
    tspan: {
        recommendedAttrs: ['x', 'y', 'dx', 'dy', '_rmp_children_text', ...typographyAttrs, 'fill', 'opacity'],
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
