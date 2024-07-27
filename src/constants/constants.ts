import { ColourHex, MonoColour } from '@railmapgen/rmg-palette-resources';
import { SvgsType } from './svgs';
import { Components } from './components';

export type Id = `id_${string}`;

export interface SvgsElem {
    id: Id;
    type: string;
    label: string;
    attrs: Record<string, string>;
    children?: SvgsElem[];
}

export interface ParamTransform {
    translateX: number;
    translateY: number;
    scale: number;
    rotate: number;
}

export interface Param {
    id: string;
    label: string;
    transform: ParamTransform;
    version: number;
    type: 'MiscNode' | 'Station';
    svgs: SvgsElem[];
    components: Components[];
    color?: Components;
    core?: string;
}

export const defaultParam: Param = {
    id: 'new',
    label: 'New',
    transform: {
        translateX: 0,
        translateY: 0,
        scale: 1,
        rotate: 0,
    },
    version: 2,
    type: 'MiscNode',
    svgs: [],
    components: [],
};

export type Theme = [string, string, ColourHex, MonoColour];

export type RuntimeMode = 'free' | `svgs-${SvgsType}`;

export type RuntimeActive = 'background' | Id | undefined;

export type CanvasColor = 'white' | 'dark' | 'auto';

export enum Events {
    APP_LOAD = 'APP_LOAD',
}
