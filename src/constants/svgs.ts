import { ComponentsType } from './components';
import type { AttrBinding } from './attr-binding';

export enum SvgsType {
    Rect = 'rect',
    Circle = 'circle',
    Polygon = 'polygon',
    Path = 'path',
    Text = 'text',
    G = 'g',
    Any = 'any',
}

export interface Variable {
    id: string;
    value: string;
    type: ComponentsType;
}

export interface Svgs {
    icon: JSX.Element;
    defaultAttrBindings: Record<string, AttrBinding>;
    displayName: string;
}
