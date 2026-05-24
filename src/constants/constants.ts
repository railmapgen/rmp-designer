import { ColourHex, MonoColour } from '@railmapgen/rmg-palette-resources';
import { SAVE_VERSION } from '../util/save';
import { SvgsType } from './svgs';
import type { Components } from './components';
import type { AttrBinding } from './attr-binding';

export const RMT_SERVER = 'https://railmapgen.org/v1';

export type Id = `id_${string}`;

export interface SvgsElem {
    id: Id;
    type: string;
    label: string;
    attrs: Record<string, string>;
    attrBindings?: Record<string, AttrBinding>;
    children?: SvgsElem[];
}

export interface ParamTransform {
    translateX: number;
    translateY: number;
    scale: number;
    rotate: number;
}

export const defaultTransform: ParamTransform = {
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotate: 0,
};

export interface Param {
    id: string;
    label: string;
    transform: ParamTransform;
    version: number;
    type: 'MiscNode' | 'Station';
    svgs: SvgsElem[];
    components: Components[];
    /**
     * @deprecated Kept only so older saves can be migrated to color components.
     */
    color?: Components;
    core?: string;
}

export const defaultParam: Param = {
    id: 'new',
    label: 'New SVG',
    transform: defaultTransform,
    version: SAVE_VERSION,
    type: 'MiscNode',
    svgs: [],
    components: [],
};

export enum CityCode {
    Other = 'other',
    Beijing = 'beijing',
    Berlin = 'berlin',
    Chongqing = 'chongqing',
    Chengdu = 'chengdu',
    Foshan = 'foshan',
    Guangzhou = 'guangzhou',
    Hongkong = 'hongkong',
    Kunming = 'kunming',
    London = 'london',
    Osaka = 'osaka',
    Qingdao = 'qingdao',
    Shanghai = 'shanghai',
    Shenzhen = 'shenzhen',
    Singapore = 'singapore',
    Suzhou = 'suzhou',
    Taipei = 'taipei',
    Tokyo = 'tokyo',
    Wuhan = 'wuhan',
    Changsha = 'changsha',
    Hangzhou = 'hangzhou',
}

export type Theme = [CityCode, string, ColourHex, MonoColour];

export const defaultColorTheme: Theme = [CityCode.Other, 'other', '#c23a30', MonoColour.white];

const normalizeMonoColour = (value: unknown): MonoColour | undefined => {
    if (value === MonoColour.black || value === 'black') return MonoColour.black;
    if (value === MonoColour.white || value === 'white') return MonoColour.white;
    return undefined;
};

export const isTheme = (value: unknown): value is Theme =>
    Array.isArray(value) &&
    value.length >= 4 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'string' &&
    typeof value[2] === 'string' &&
    value[2].startsWith('#') &&
    normalizeMonoColour(value[3]) !== undefined;

export const normalizeTheme = (value: unknown, fallback: Theme = defaultColorTheme): Theme => {
    if (!Array.isArray(value) || value.length < 4) return fallback;
    const monoColour = normalizeMonoColour(value[3]);
    if (
        typeof value[0] !== 'string' ||
        typeof value[1] !== 'string' ||
        typeof value[2] !== 'string' ||
        !value[2].startsWith('#') ||
        !monoColour
    ) {
        return fallback;
    }
    return [value[0] as CityCode, value[1], value[2] as ColourHex, monoColour];
};

export type RuntimeMode = 'free' | `svgs-${SvgsType}`;

export type RuntimeActive = 'background' | Id | undefined;

export type CanvasColor = 'white' | 'dark' | 'auto';

export enum Events {
    APP_LOAD = 'APP_LOAD',
}

export interface Login {
    name: string;
    email: string;
    token: string;
    refreshToken: string;
}
