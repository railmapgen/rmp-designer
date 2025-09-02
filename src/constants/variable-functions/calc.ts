import { VariableFunctionAttributes, VariableFunctionConfigContent } from '../variable-function';

export const CalcConfigAttributes: VariableFunctionConfigContent = {
    type: 'calc',
    contents: [
        {
            type: ['variable', 'function', 'value'],
        },
        {
            type: 'option',
            options: {
                '+': '+',
                '-': '-',
                '*': '*',
                '/': '/',
                '^': '^',
                '%': '%',
            },
        },
        {
            type: ['variable', 'function', 'value'],
        },
    ],
    excuate: contents => {
        if (contents[1] === '+') return (parseFloat(contents[0]) + parseFloat(contents[1])).toString();
        if (contents[1] === '-') return (parseFloat(contents[0]) - parseFloat(contents[1])).toString();
        if (contents[1] === '*') return (parseFloat(contents[0]) * parseFloat(contents[1])).toString();
        if (contents[1] === '/') return (parseFloat(contents[0]) / parseFloat(contents[1])).toString();
        if (contents[1] === '^') return Math.pow(parseFloat(contents[0]), parseFloat(contents[1])).toString();
        if (contents[1] === '%') return (parseFloat(contents[0]) % parseFloat(contents[1])).toString();
        return 'Operation not supported';
    },
};

export const defaultMinAttributes: VariableFunctionAttributes = {
    contents: [
        {
            value: {
                type: 'value',
                value: '5',
            },
            type: 'value',
        },
        {
            type: 'option',
            value: {
                type: 'option',
                option: '+',
            },
        },
        {
            value: {
                type: 'value',
                value: '1',
            },
            type: 'value',
        },
    ],
};
