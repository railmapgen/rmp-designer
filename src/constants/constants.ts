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

export interface Param {
    id: string;
    version: number;
    type: 'MiscNode' | 'Station';
    svgs: SvgsElem[];
    components: Components[];
    color?: Components;
    core?: string;
}

export const defaultParam: Param = {
    id: 'new',
    version: 1,
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
