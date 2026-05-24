import { MonoColour } from '@railmapgen/rmg-palette-resources';
import type { Theme } from './constants';

export type ComponentsType = 'text' | 'textarea' | 'number' | 'switch' | 'color';

export const ComponentsTypeOptions = {
    text: 'text',
    textarea: 'textarea',
    number: 'number',
    switch: 'switch',
    color: 'color',
};

export interface Components {
    id: string;
    label: string;
    name?: string;
    group?: string;
    type: ComponentsType;
    defaultValue: any;
    value?: any;
    constraints?: {
        min?: number;
        max?: number;
        step?: number;
        options?: string[];
    };
}

const defaultColorComponentTheme: Theme = ['other' as Theme[0], 'other', '#c23a30', MonoColour.white];

export const colorComponents: Components = {
    id: 'color',
    label: 'color',
    name: 'Color',
    type: 'color',
    defaultValue: defaultColorComponentTheme,
};
