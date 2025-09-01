import { defaultIfAttributes, IfConfigAttributes } from './variable-functions/if';
import { defaultMaxAttributes, MaxConfigAttributes } from './variable-functions/max';
import { defaultMinAttributes, MinConfigAttributes } from './variable-functions/min';

export type VariableFunctionContentTypes = 'value' | 'function' | 'variable';

export enum VariableFunctionType {
    If = 'if',
    Max = 'max',
    Min = 'min',
}

export interface VariableFunctionContent {
    type: VariableFunctionContentTypes[] | 'option';
    label: string;
    options?: Record<string, string>;
}

export interface VariableFunctionConfigContent {
    type: string;
    name: string;
    contents: VariableFunctionContent[];
    excuate: (contents: string[]) => string;
}

export const VariableFunctionConfig = {
    [VariableFunctionType.If]: IfConfigAttributes,
    [VariableFunctionType.Max]: MaxConfigAttributes,
    [VariableFunctionType.Min]: MinConfigAttributes,
};

export interface VariableFunctionAttrContents {
    value: VariableFunction;
    type: VariableFunctionContentTypes | 'option';
}

export interface VariableFunctionAttributes {
    contents: VariableFunctionAttrContents[];
}

export const defaultVariableFunctionAttrs = {
    [VariableFunctionType.If]: defaultIfAttributes,
    [VariableFunctionType.Max]: defaultMaxAttributes,
    [VariableFunctionType.Min]: defaultMinAttributes,
};

export interface VariableFunction {
    type: VariableFunctionContentTypes | 'option';
    value?: string;
    variable?: string;
    function?: VariableFunctionType;
    option?: string;

    [VariableFunctionType.If]?: VariableFunctionAttributes;
    [VariableFunctionType.Max]?: VariableFunctionAttributes;
    [VariableFunctionType.Min]?: VariableFunctionAttributes;
}
