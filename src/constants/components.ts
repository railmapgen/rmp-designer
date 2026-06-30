import { MonoColour } from '@railmapgen/rmg-palette-resources';
import type { Theme } from './constants';

export type ComponentsType = 'text' | 'textarea' | 'number' | 'switch' | 'color' | 'option';

export const ComponentsTypeOptions = {
    text: 'text',
    textarea: 'textarea',
    number: 'number',
    switch: 'switch',
    color: 'color',
    option: 'option',
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

export const DEFAULT_OPTION_VALUE = 'option';

export const normalizeComponentOptions = (
    options: unknown,
    fallbackValue: unknown = DEFAULT_OPTION_VALUE
): string[] => {
    const values = Array.isArray(options) ? options : [];
    const normalized = Array.from(
        new Set(values.map(option => String(option).trim()).filter(option => option.length > 0))
    );
    if (normalized.length > 0) return normalized;

    const fallback = String(fallbackValue ?? '').trim();
    return [fallback || DEFAULT_OPTION_VALUE];
};

export const getComponentOptionValues = (component: Pick<Components, 'constraints' | 'defaultValue'>): string[] =>
    normalizeComponentOptions(component.constraints?.options, component.defaultValue);

export const normalizeComponentOptionValue = (value: unknown, options: string[]): string => {
    const stringValue = String(value ?? '').trim();
    if (options.includes(stringValue)) return stringValue;
    return options[0] ?? DEFAULT_OPTION_VALUE;
};

const defaultColorComponentTheme: Theme = ['other' as Theme[0], 'other', '#c23a30', MonoColour.white];

export const colorComponents: Components = {
    id: 'color',
    label: 'color',
    name: 'Color',
    type: 'color',
    defaultValue: defaultColorComponentTheme,
};
