import { ComponentsType } from './components';
import { VariableFunction } from './variable-function';

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
    defaultAttrs: Record<string, VariableFunction>;
    displayName: string;
}
