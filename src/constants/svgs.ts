import { AttrsProps, Id, SvgsElem } from './constants';
import { ComponentsType } from './components';
import { RectSvgAttrs } from '../components/svgs/rect';
import { PathSvgAttrs } from '../components/svgs/path';
import { CircleSvgAttrs } from '../components/svgs/circle';

export enum SvgsType {
    Rect = 'rect',
    Path = 'path',
    Circle = 'circle',
}

export interface SvgsAttrs {
    [SvgsType.Rect]: RectSvgAttrs;
    [SvgsType.Path]: PathSvgAttrs;
    [SvgsType.Circle]: CircleSvgAttrs;
}

// export type SvgsAttrs = RectSvgAttrs;

export type SvgsAttrsType = 'string' | 'number' | 'boolean';

export interface Variable {
    id: string;
    value: string;
    type: ComponentsType;
}

export interface SvgsComponentProps<T> {
    id: Id;
    isCore: boolean;
    x: string;
    y: string;
    attrs: T;
    handlePointerDown: (id: Id, e: React.PointerEvent<SVGElement>) => void;
    handlePointerMove: (id: Id, e: React.PointerEvent<SVGElement>) => void;
    handlePointerUp: (id: Id, e: React.PointerEvent<SVGElement>) => void;
    variable: Variable[];
}

export interface Svgs<T> {
    component: React.FC<SvgsComponentProps<T>>;
    icon: JSX.Element;
    defaultAttrs: T;
    attrsComponent: React.FC<AttrsProps<T>>;
    displayName: string;
    output: (props: SvgsElem<T>) => string;
    inputFromSvg: (props: SVGElement) => T;
}
