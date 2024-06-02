import { ComponentsType } from './components';

export enum SvgsType {
    Rect = 'rect',
    Circle = 'circle',
    Path = 'path',
    Text = 'text',
}

export interface Variable {
    id: string;
    value: string;
    type: ComponentsType;
}

export interface Svgs {
    icon: JSX.Element;
    defaultAttrs: Record<string, string>;
    displayName: string;
}
