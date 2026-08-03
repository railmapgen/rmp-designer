import type { Components } from '../../../constants/components';
import { evaluateAttrBinding } from '../../../util/attr-binding';
import { editorTextToBinding } from './expression-value-control';

const firstPoints = '-3,8 3,0 3,0 3,8 0,-1';
const secondPoints = '-3,8 3,0 3,0 3,8 -1,0';
const components: Components[] = [
    {
        id: 'component_points',
        label: 'polygonPoints',
        name: 'PolygonPoints',
        type: 'textarea',
        defaultValue: firstPoints,
        value: secondPoints,
    },
    {
        id: 'component_width',
        label: 'widthValue',
        name: 'Width',
        type: 'number',
        defaultValue: 10,
    },
    {
        id: 'component_stroke_width',
        label: 'strokeWidthValue',
        name: 'Stroke Width',
        type: 'number',
        defaultValue: 4,
    },
];

describe('SVG attribute editor text classification', () => {
    it.each([firstPoints, secondPoints, '-3.5,+8 3e1,-2E-1\n0,0', '{Width}-3,0 5,5 6,6'])(
        'keeps non-template points text as a literal: %s',
        value => {
            expect(editorTextToBinding('polygon', 'points', value, components)).toEqual({
                kind: 'literal',
                value,
            });
        }
    );

    it('keeps whole-value variable bindings for points', () => {
        const binding = editorTextToBinding('polygon', 'points', '{PolygonPoints}', components);

        expect(binding).toEqual({ kind: 'variable', componentId: 'component_points', path: undefined });
        expect(evaluateAttrBinding(binding, { components })).toEqual({ value: secondPoints });
    });

    it.each([
        ['{Stroke Width} ,2  5, 5 6,6', '{strokeWidthValue} ,2  5, 5 6,6', '4 ,2  5, 5 6,6'],
        ['-3,8 3,0 {Stroke Width},0 3,8 -1,0', '-3,8 3,0 {strokeWidthValue},0 3,8 -1,0', '-3,8 3,0 4,0 3,8 -1,0'],
    ])('supports direct variable substitution inside points: %s', (value, expression, evaluated) => {
        const binding = editorTextToBinding('polygon', 'points', value, components);

        expect(binding).toEqual({ kind: 'formula', expression });
        expect(evaluateAttrBinding(binding, { components })).toEqual({ value: evaluated });
    });

    it('continues to classify formulas for non-points attributes', () => {
        expect(editorTextToBinding('rect', 'width', '{Width} - 1', components)).toEqual({
            kind: 'formula',
            expression: '{widthValue} - 1',
        });
        expect(editorTextToBinding('rect', 'width', 'Math.round({Width}/2)', components)).toEqual({
            kind: 'formula',
            expression: 'Math.round({widthValue}/2)',
        });
    });
});
