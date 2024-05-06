import { AttrsProps, Components, ComponentsType, SvgsElem } from './constants';
import { RectSvgAttrs } from '../components/svgs/rect';

export enum SvgsType {
    Rect = 'rect',
}

// export interface SvgsAttrs {
//     [SvgsType.Rect]?: RectSvgAttrs;
// }

export type SvgsAttrs = RectSvgAttrs;

export interface Variable {
    id: string;
    value: string;
    type: ComponentsType;
}

export interface SvgsComponentProps<T> {
    id: string;
    isCore: boolean;
    x: string;
    y: string;
    attrs: T;
    handlePointerDown: (id: string, e: React.PointerEvent<SVGElement>) => void;
    handlePointerMove: (id: string, e: React.PointerEvent<SVGElement>) => void;
    handlePointerUp: (id: string, e: React.PointerEvent<SVGElement>) => void;
    variable: Variable[];
}

export interface Svgs<T> {
    component: React.FC<SvgsComponentProps<T>>;
    icon: JSX.Element;
    defaultAttrs: T;
    attrsComponent: React.FC<AttrsProps<T>>;
    displayName: string;
    output: (props: SvgsElem<T>) => string;
}
