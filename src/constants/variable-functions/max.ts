import { VariableFunctionAttributes, VariableFunctionConfigContent } from '../variable-function';

export const MaxConfigAttributes: VariableFunctionConfigContent = {
    type: 'max',
    name: 'Maximum value',
    contents: [
        {
            label: 'Value 1',
            type: ['variable', 'function', 'value'],
        },
        {
            label: 'Value 2',
            type: ['variable', 'function', 'value'],
        },
    ],
    excuate: contents => {
        return Math.max(parseFloat(contents[0]), parseFloat(contents[1])).toString();
    },
};

export const defaultMaxAttributes: VariableFunctionAttributes = {
    contents: [
        {
            value: {
                type: 'value',
                value: '2',
            },
            type: 'value',
        },
        {
            value: {
                type: 'value',
                value: '5',
            },
            type: 'value',
        },
    ],
};
