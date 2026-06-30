import { createLiteralAttrBinding } from '../../constants/attr-binding';
import { defaultParam, SvgsElem } from '../../constants/constants';
import { compileAttrRecord } from '../../util/attr-binding';
import { PolygonEditorController } from './polygon-editor-controller';

const createPolygon = (): SvgsElem => {
    const attrBindings = {
        x: createLiteralAttrBinding(10),
        y: createLiteralAttrBinding(20),
        points: createLiteralAttrBinding('0,0 20,0 20,10 0,10'),
        fill: createLiteralAttrBinding('#D6ABC1'),
    };

    return {
        id: 'id_polygon',
        type: 'polygon',
        label: 'polygon',
        attrs: compileAttrRecord({}, attrBindings, []),
        attrBindings,
    };
};

const createController = (svgs: SvgsElem[] = []) =>
    new PolygonEditorController({
        param: { ...defaultParam, svgs },
        components: [],
        selected: new Set(),
        svgViewBoxZoom: 100,
    });

describe('PolygonEditorController', () => {
    it('extracts editable polygon points with the element origin', () => {
        const elem = createPolygon();
        const editable = createController([elem]).getPolygonEditableById(elem.id);

        expect(editable?.origin).toEqual({ x: 10, y: 20 });
        expect(editable?.points).toHaveLength(4);
        expect(editable?.points[1]).toEqual({ id: '1', x: 20, y: 0 });
    });

    it('updates both legacy attrs and attr bindings when a point moves', () => {
        const elem = createPolygon();
        const nextSvgs = createController([elem]).movePoint(elem.id, '1', { x: 30, y: 5 });
        const next = nextSvgs?.[0];

        expect(next?.attrs.points).toEqual('1"0,0 30,5 20,10 0,10"');
        expect(next?.attrBindings?.points).toEqual({ kind: 'literal', value: '0,0 30,5 20,10 0,10' });
    });

    it('preserves the minimum polygon point count', () => {
        const elem = createPolygon();
        const firstRemoval = createController([elem]).removePoint(elem.id, '1')!;
        const secondRemoval = createController(firstRemoval).removePoint(elem.id, '1');

        expect(firstRemoval[0].attrBindings?.points).toEqual({ kind: 'literal', value: '0,0 20,10 0,10' });
        expect(secondRemoval).toBeUndefined();
    });
});
