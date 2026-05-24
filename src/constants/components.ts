import { MonoColour } from '@railmapgen/rmg-palette-resources';
import { Theme } from './constants';

export type ComponentsType = 'text' | 'textarea' | 'number' | 'switch' | 'color';

export const ComponentsTypeOptions = {
    text: 'text',
    textarea: 'textarea',
    number: 'number',
    switch: 'switch',
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

export const colorComponents: Components = {
    id: 'color',
    label: 'color',
    type: 'color',
    defaultValue: ['beijing', 'bj1', '#c23a30', MonoColour.white] as Theme,
};
