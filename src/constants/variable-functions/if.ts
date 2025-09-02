import { VariableFunctionAttributes, VariableFunctionConfigContent } from '../variable-function';

export const IfConfigAttributes: VariableFunctionConfigContent = {
    type: 'if',
    contents: [
        {
            type: ['variable', 'function', 'value'],
        },
        {
            type: 'option',
            options: {
                '=': '=',
                '!=': '!=',
                '<': '<',
                '<=': '<=',
                '>': '>',
                '>=': '>=',
            },
        },
        {
            type: ['variable', 'function', 'value'],
        },
        {
            type: ['variable', 'function', 'value'],
        },
        {
            type: ['variable', 'function', 'value'],
        },
    ],
    excuate: contents => {
        if (contents[1] === '=') {
            return contents[0] === contents[2] ? contents[3] : contents[4];
        } else if (contents[1] === '!=') {
            return contents[0] !== contents[2] ? contents[3] : contents[4];
        } else if (contents[1] === '<') {
            return parseFloat(contents[0]) < parseFloat(contents[2]) ? contents[3] : contents[4];
        } else if (contents[1] === '<=') {
            return parseFloat(contents[0]) <= parseFloat(contents[2]) ? contents[3] : contents[4];
        } else if (contents[1] === '>') {
            return parseFloat(contents[0]) > parseFloat(contents[2]) ? contents[3] : contents[4];
        } else if (contents[1] === '>=') {
            return parseFloat(contents[0]) >= parseFloat(contents[2]) ? contents[3] : contents[4];
        }
        return 'Operation not supported';
    },
};

export const defaultIfAttributes: VariableFunctionAttributes = {
    contents: [
        {
            value: {
                type: 'value',
                value: '111',
            },
            type: 'value',
        },
        {
            value: {
                type: 'option',
                option: '=',
            },
            type: 'option',
        },
        {
            value: {
                type: 'value',
                value: '0',
            },
            type: 'value',
        },
        {
            value: {
                type: 'value',
                value: '0',
            },
            type: 'value',
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
