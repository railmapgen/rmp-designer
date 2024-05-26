import { ColourHex, MonoColour } from '@railmapgen/rmg-palette-resources';
import { SvgsAttrs, SvgsType } from './svgs';
import { Components } from './components';

export type Id = `id_${string}`;

export interface SvgsElem<T> {
    id: Id;
    type: SvgsType;
    x: string;
    y: string;
    attrs: T;
}

export interface Param {
    id: string;
    type: 'MiscNode' | 'Station';
    svgs: Array<SvgsElem<SvgsAttrs[keyof SvgsAttrs]>>;
    components: Components[];
    color?: Components;
    core?: string;
}

export interface AttrsProps<T> {
    id: string;
    attrs: T;
    handleAttrsUpdate: (id: string, attrs: T) => void;
}

export type Theme = [string, string, ColourHex, MonoColour];

export type RuntimeMode = 'free' | `svgs-${SvgsType}`;

export type RuntimeActive = 'background' | Id | undefined;

export enum Events {
    APP_LOAD = 'APP_LOAD',
}
