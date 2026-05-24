import {
    compileAttrBindingToLegacyAttr,
    evaluateAttrBinding,
    evaluateSvgAttrs,
    legacyAttrToBinding,
} from './attr-binding';
import { Components } from '../constants/components';

const components: Components[] = [
    {
        id: 'component_width',
        label: 'widthValue',
        name: 'Width',
        type: 'number',
        defaultValue: 10,
        value: 12,
    },
    {
        id: 'component_label',
        label: 'stationLabel',
        name: 'Station label',
        type: 'text',
        defaultValue: 'Alpha',
    },
    {
        id: 'color',
        label: 'color',
        type: 'color',
        defaultValue: ['beijing', 'bj1', '#c23a30', 'white'] as any,
    },
];

describe('attr binding evaluator', () => {
    it('evaluates literal, variable, formula, condition and legacy bindings', () => {
        expect(evaluateAttrBinding({ kind: 'literal', value: 'fixed' }, { components }).value).toEqual('fixed');
        expect(
            evaluateAttrBinding({ kind: 'variable', componentId: 'component_width' }, { components }).value
        ).toEqual(12);
        expect(evaluateAttrBinding({ kind: 'variable', componentId: 'color', path: 'hex' }, { components }).value).toEqual(
            '#c23a30'
        );
        expect(evaluateAttrBinding({ kind: 'formula', expression: 'widthValue + 8' }, { components }).value).toEqual(20);
        expect(evaluateAttrBinding({ kind: 'formula', expression: '3 + {Width}' }, { components }).value).toEqual(15);
        expect(evaluateAttrBinding({ kind: 'formula', expression: 'Line{Station label}' }, { components }).value).toEqual(
            'LineAlpha'
        );
        expect(evaluateAttrBinding({ kind: 'formula', expression: 'Math.min({Width}, 8)' }, { components }).value).toEqual(
            8
        );
        expect(
            evaluateAttrBinding(
                {
                    kind: 'conditional',
                    if: {
                        left: { source: 'variable', componentId: 'component_width' },
                        operator: 'gt',
                        right: { source: 'literal', value: 10 },
                    },
                    then: { kind: 'literal', value: 'large' },
                    else: { kind: 'literal', value: 'small' },
                },
                { components }
            ).value
        ).toEqual('large');
        expect(evaluateAttrBinding({ kind: 'legacy', expression: 'widthValue + 1' }, { components }).value).toEqual(13);
    });

    it('returns errors for missing variables', () => {
        expect(evaluateAttrBinding({ kind: 'variable', componentId: 'missing' }, { components }).error).toContain(
            'Unknown variable'
        );
    });
});

describe('attr binding compiler', () => {
    it('compiles bindings to current RMP-compatible attr strings', () => {
        expect(compileAttrBindingToLegacyAttr({ kind: 'literal', value: 20 }, components)).toEqual('1"20"');
        expect(compileAttrBindingToLegacyAttr({ kind: 'variable', componentId: 'component_width' }, components)).toEqual(
            '2widthValue'
        );
        expect(compileAttrBindingToLegacyAttr({ kind: 'variable', componentId: 'color', path: 'hex' }, components)).toEqual(
            '2color[2]'
        );
        expect(compileAttrBindingToLegacyAttr({ kind: 'formula', expression: 'widthValue + 2' }, components)).toEqual(
            '3widthValue + 2'
        );
        expect(compileAttrBindingToLegacyAttr({ kind: 'formula', expression: '3 + {Width}' }, components)).toEqual(
            '33 + widthValue'
        );
        expect(compileAttrBindingToLegacyAttr({ kind: 'formula', expression: 'Line{Station label}' }, components)).toEqual(
            '3"Line" + String(stationLabel == null ? "" : stationLabel)'
        );
        expect(
            compileAttrBindingToLegacyAttr({ kind: 'formula', expression: 'Math.min({Width}, 8)' }, components)
        ).toEqual('3Math.min(widthValue, 8)');
        expect(
            compileAttrBindingToLegacyAttr(
                {
                    kind: 'conditional',
                    if: {
                        left: { source: 'variable', componentId: 'component_width' },
                        operator: 'gte',
                        right: { source: 'literal', value: 12 },
                    },
                    then: { kind: 'literal', value: '#000000' },
                    else: { kind: 'literal', value: '#ffffff' },
                },
                components
            )
        ).toEqual('3((Number(widthValue) >= Number("12")) ? "#000000" : "#ffffff")');
    });

    it('converts legacy attrs into structured bindings', () => {
        expect(legacyAttrToBinding('1"hello"', components)).toEqual({ kind: 'literal', value: 'hello' });
        expect(legacyAttrToBinding('2widthValue', components)).toEqual({
            kind: 'variable',
            componentId: 'component_width',
        });
        expect(legacyAttrToBinding('2color[3]', components)).toEqual({
            kind: 'variable',
            componentId: 'color',
            path: 'text',
        });
        expect(legacyAttrToBinding('3widthValue + 1', components)).toEqual({
            kind: 'legacy',
            expression: 'widthValue + 1',
        });
    });

    it('prefers attrBindings over legacy attrs when evaluating SVG attrs', () => {
        const result = evaluateSvgAttrs(
            { width: '1"1"', fill: '1"#ffffff"' },
            { width: { kind: 'formula', expression: 'widthValue * 2' } },
            components
        );
        expect(result.error).toBeUndefined();
        expect(result.attrs).toEqual({ width: 24, fill: '#ffffff' });
    });
});
