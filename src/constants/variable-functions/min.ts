import { VariableFunctionAttributes, VariableFunctionConfigContent } from '../variable-function';

export const MinConfigAttributes: VariableFunctionConfigContent = {
    type: 'min',
    contents: [
        {
            type: ['variable', 'function', 'value'],
        },
        {
            type: ['variable', 'function', 'value'],
        },
    ],
    excuate: contents => {
        return Math.min(parseFloat(contents[0]), parseFloat(contents[1])).toString();
    },
};

export const defaultMinAttributes: VariableFunctionAttributes = {
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
