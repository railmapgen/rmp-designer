import { SvgsType } from '../../../constants/svgs';
import { compileAttrRecord } from '../../../util/attr-binding';
import svgs from './svgs';

describe('svg module defaults', () => {
    it('uses structured default attr bindings', () => {
        expect('defaultAttrs' in svgs[SvgsType.Rect]).toBe(false);
        expect(svgs[SvgsType.Rect].defaultAttrBindings.width).toEqual({ kind: 'literal', value: 20 });
        expect(svgs[SvgsType.Circle].defaultAttrBindings.r).toEqual({ kind: 'literal', value: 5 });
    });

    it('compiles structured defaults to current legacy attrs for runtime compatibility', () => {
        const pathAttrs = compileAttrRecord({}, svgs[SvgsType.Path].defaultAttrBindings, []);
        const textAttrs = compileAttrRecord({}, svgs[SvgsType.Text].defaultAttrBindings, []);

        expect(pathAttrs.d).toEqual('1"M 0 5 L 20 5"');
        expect(pathAttrs['stroke-width']).toEqual('1"5"');
        expect(pathAttrs.strokeWidth).toBeUndefined();
        expect(textAttrs['font-size']).toEqual('1"12"');
        expect(textAttrs['text-anchor']).toEqual('1"middle"');
    });
});
