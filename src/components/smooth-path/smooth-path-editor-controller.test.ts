import { defaultParam, SvgsElem } from '../../constants/constants';
import { SMOOTH_PATH_DATA_ATTR } from '../../util/smooth-path';
import { SmoothPathEditorController } from './smooth-path-editor-controller';

const createIdFactory = () => {
    let index = 0;
    return () => `test${index++}`;
};

const createController = (svgs: SvgsElem[] = []) =>
    new SmoothPathEditorController({
        param: { ...defaultParam, svgs },
        components: [],
        selected: new Set(),
        svgViewBoxZoom: 100,
        svgViewBoxMin: { x: 0, y: 0 },
    });

describe('SmoothPathEditorController', () => {
    it('creates a smooth path SVG element with visual attrs and editor metadata', () => {
        const elem = createController().createSmoothPathSvgElem(
            [
                { x: 0, y: 0 },
                { x: 40, y: 20 },
                { x: 80, y: 0 },
            ],
            createIdFactory()
        );

        expect(elem).toBeDefined();
        expect(elem?.type).toBe('path');
        expect(elem?.attrs.d).toBeTruthy();
        expect(elem?.attrs.fill).toBe('1"#D6ABC1"');
        expect(elem?.attrs.stroke).toBe('1"none"');
        expect(elem?.attrs[SMOOTH_PATH_DATA_ATTR]).toBeTruthy();
        expect(elem?.attrBindings?.d).toMatchObject({ kind: 'literal' });
        expect(elem?.attrBindings?.[SMOOTH_PATH_DATA_ATTR]).toMatchObject({ kind: 'literal' });
    });

    it('updates both legacy attrs and attr bindings when a model changes', () => {
        const elem = createController().createSmoothPathSvgElem(
            [
                { x: 0, y: 0 },
                { x: 40, y: 20 },
                { x: 80, y: 0 },
            ],
            createIdFactory()
        )!;
        const controller = createController([elem]);
        const editable = controller.getSmoothPathEditableById(elem.id)!;
        const nextSvgs = controller.moveControlPoint(elem.id, editable.model.points[1].id, { x: 40, y: 50 });
        const next = nextSvgs?.[0];

        expect(next?.attrs.d).not.toEqual(elem.attrs.d);
        expect(next?.attrBindings?.d).not.toEqual(elem.attrBindings?.d);
        expect(next?.attrs[SMOOTH_PATH_DATA_ATTR]).not.toEqual(elem.attrs[SMOOTH_PATH_DATA_ATTR]);
        expect(next?.attrBindings?.[SMOOTH_PATH_DATA_ATTR]).not.toEqual(elem.attrBindings?.[SMOOTH_PATH_DATA_ATTR]);
    });

    it('preserves minimum point and width-stop counts', () => {
        const elem = createController().createSmoothPathSvgElem(
            [
                { x: 0, y: 0 },
                { x: 20, y: 0 },
            ],
            createIdFactory()
        )!;
        const twoPointController = createController([elem]);
        const editable = twoPointController.getSmoothPathEditableById(elem.id)!;

        expect(twoPointController.removeControlPoint(elem.id, editable.model.points[0].id)).toBeUndefined();

        const oneStopSvgs = twoPointController.updateModel(elem.id, model => ({
            ...model,
            widthStops: [model.widthStops[0]],
        }))!;
        const oneStopController = createController(oneStopSvgs);
        const oneStopEditable = oneStopController.getSmoothPathEditableById(elem.id)!;

        expect(oneStopController.removeWidthStop(elem.id, oneStopEditable.model.widthStops[0].id)).toBeUndefined();
    });
});
