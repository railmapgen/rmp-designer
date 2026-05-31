import type { Components } from '../../constants/components';
import type { Id, Param, SvgsElem } from '../../constants/constants';
import { evaluateSvgAttrs } from '../../util/attr-binding';
import {
    addWidthStop,
    applySmoothPathModelToSvgElem,
    createSmoothPathModel,
    generateSmoothPathD,
    getNearestCenterlineT,
    getSmoothPathAttrPatch,
    getWidthStopGeometry,
    insertControlPointAtNearestSegment,
    moveControlPoint,
    moveWidthStop,
    parseSmoothPathModel,
    Point as SmoothPathPointInput,
    removeControlPoint,
    removeWidthStop,
    resizeWidthStop,
    SMOOTH_PATH_DATA_ATTR,
    SmoothPathModel,
} from '../../util/smooth-path';

export type SmoothPathHandleSelection =
    | { elemId: Id; kind: 'point'; id: string }
    | { elemId: Id; kind: 'width'; id: string }
    | undefined;

export type SmoothPathDrag =
    | { elemId: Id; kind: 'point'; id: string }
    | { elemId: Id; kind: 'width-position'; id: string }
    | { elemId: Id; kind: 'width-size'; id: string }
    | undefined;

export interface SmoothPathEditable {
    elem: SvgsElem;
    model: SmoothPathModel;
    origin: SmoothPathPointInput;
}

export interface SmoothPathHandleSize {
    hitStrokeWidth: number;
    guideStrokeWidth: number;
    strokeWidth: number;
    pointRadius: number;
    selectedPointRadius: number;
    widthStopRadius: number;
    selectedWidthStopRadius: number;
    dashArray: string;
}

interface SmoothPathEditorContext {
    param: Param;
    components: Components[];
    selected: Set<Id>;
    svgViewBoxZoom: number;
    svgViewBoxMin: { x: number; y: number };
}

const legacyLiteral = (value: string | number) => `1${JSON.stringify(String(value))}`;

const roundToNearestN = (value: number, n: number) => Math.round(value / n) * n;

export class SmoothPathEditorController {
    private readonly param: Param;
    private readonly components: Components[];
    private readonly selected: Set<Id>;
    private readonly svgViewBoxZoom: number;

    constructor(context: SmoothPathEditorContext) {
        this.param = context.param;
        this.components = context.components;
        this.selected = context.selected;
        this.svgViewBoxZoom = context.svgViewBoxZoom;
    }

    findSvgElemById(id: Id): SvgsElem | undefined {
        return this.findSvgElemInTree(this.param.svgs, id);
    }

    getSmoothPathEditable(elem: SvgsElem): SmoothPathEditable | undefined {
        if (elem.type !== 'path') return undefined;
        const evaluated = evaluateSvgAttrs(elem.attrs, elem.attrBindings, this.components);
        if (evaluated.error) return undefined;
        const model = parseSmoothPathModel(evaluated.attrs[SMOOTH_PATH_DATA_ATTR]);
        if (!model) return undefined;

        return {
            elem,
            model,
            origin: {
                x: Number(evaluated.attrs.x ?? 0) || 0,
                y: Number(evaluated.attrs.y ?? 0) || 0,
            },
        };
    }

    getSmoothPathEditableById(id: Id): SmoothPathEditable | undefined {
        const elem = this.findSvgElemById(id);
        return elem ? this.getSmoothPathEditable(elem) : undefined;
    }

    getSelectedSmoothPath(): SmoothPathEditable | undefined {
        if (this.selected.size !== 1) return undefined;
        return this.getSmoothPathEditableById(Array.from(this.selected)[0]);
    }

    getHandleSize(): SmoothPathHandleSize {
        const screenToSvgScale = this.svgViewBoxZoom / 100;
        return {
            hitStrokeWidth: 16 * screenToSvgScale,
            guideStrokeWidth: 1.5 * screenToSvgScale,
            strokeWidth: 2 * screenToSvgScale,
            pointRadius: 4.5 * screenToSvgScale,
            selectedPointRadius: 6 * screenToSvgScale,
            widthStopRadius: 4 * screenToSvgScale,
            selectedWidthStopRadius: 5.5 * screenToSvgScale,
            dashArray: `${4 * screenToSvgScale} ${3 * screenToSvgScale}`,
        };
    }

    getDrawingPreviewPath(points: SmoothPathPointInput[]): string {
        if (points.length < 2) return '';
        let id = 0;
        const result = createSmoothPathModel(points, () => `preview_${id++}`, {
            origin: { x: 0, y: 0 },
            minPointDistance: 1,
            simplifyTolerance: 0.5,
        });
        return result ? generateSmoothPathD(result.model) : '';
    }

    createSmoothPathSvgElem(points: SmoothPathPointInput[], createId: () => string): SvgsElem | undefined {
        const result = createSmoothPathModel(points, createId);
        if (!result) return undefined;

        const id: Id = `id_${createId()}`;
        const originX = roundToNearestN(result.origin.x, 1);
        const originY = roundToNearestN(result.origin.y, 1);
        const patch = getSmoothPathAttrPatch(result.model);

        return {
            id,
            type: 'path',
            label: createId(),
            attrs: {
                x: legacyLiteral(originX),
                y: legacyLiteral(originY),
                fill: legacyLiteral('#D6ABC1'),
                stroke: legacyLiteral('none'),
                ...patch.attrs,
            },
            attrBindings: {
                x: { kind: 'literal', value: originX },
                y: { kind: 'literal', value: originY },
                fill: { kind: 'literal', value: '#D6ABC1' },
                stroke: { kind: 'literal', value: 'none' },
                ...patch.attrBindings,
            },
        };
    }

    updateModel(elemId: Id, updater: (model: SmoothPathModel) => SmoothPathModel): SvgsElem[] | undefined {
        const editable = this.getSmoothPathEditableById(elemId);
        if (!editable) return undefined;

        return this.updateSvgElemById(elemId, elem => applySmoothPathModelToSvgElem(elem, updater(editable.model)));
    }

    moveControlPoint(elemId: Id, pointId: string, point: SmoothPathPointInput): SvgsElem[] | undefined {
        return this.updateModel(elemId, model => moveControlPoint(model, pointId, point));
    }

    removeControlPoint(elemId: Id, pointId: string): SvgsElem[] | undefined {
        const editable = this.getSmoothPathEditableById(elemId);
        if (!editable || editable.model.points.length <= 2) return undefined;
        return this.updateModel(elemId, model => removeControlPoint(model, pointId));
    }

    insertControlPoint(elemId: Id, point: SmoothPathPointInput, createId: () => string): SvgsElem[] | undefined {
        return this.updateModel(elemId, model => insertControlPointAtNearestSegment(model, point, createId));
    }

    addWidthStopAtPoint(
        elemId: Id,
        pointId: string,
        createId: () => string
    ): { svgs: SvgsElem[]; id: string } | undefined {
        const editable = this.getSmoothPathEditableById(elemId);
        const point = editable?.model.points.find(item => item.id === pointId);
        if (!editable || !point) return undefined;

        const id = createId();
        const svgs = this.updateModel(elemId, model =>
            addWidthStop(model, () => id, getNearestCenterlineT(model, point))
        );
        return svgs ? { svgs, id } : undefined;
    }

    moveWidthStop(elemId: Id, stopId: string, point: SmoothPathPointInput): SvgsElem[] | undefined {
        return this.updateModel(elemId, model => moveWidthStop(model, stopId, getNearestCenterlineT(model, point)));
    }

    resizeWidthStop(elemId: Id, stopId: string, point: SmoothPathPointInput): SvgsElem[] | undefined {
        const editable = this.getSmoothPathEditableById(elemId);
        const geometry = editable ? getWidthStopGeometry(editable.model, stopId) : undefined;
        if (!geometry) return undefined;

        return this.updateModel(elemId, model =>
            resizeWidthStop(model, stopId, Math.hypot(point.x - geometry.center.x, point.y - geometry.center.y) * 2)
        );
    }

    removeWidthStop(elemId: Id, stopId: string): SvgsElem[] | undefined {
        const editable = this.getSmoothPathEditableById(elemId);
        if (!editable || editable.model.widthStops.length <= 1) return undefined;
        return this.updateModel(elemId, model => removeWidthStop(model, stopId));
    }

    private findSvgElemInTree(svgs: SvgsElem[], id: Id): SvgsElem | undefined {
        for (const elem of svgs) {
            if (elem.id === id) return elem;
            const child = elem.children ? this.findSvgElemInTree(elem.children, id) : undefined;
            if (child) return child;
        }
        return undefined;
    }

    private updateSvgElemById(id: Id, updater: (elem: SvgsElem) => SvgsElem): SvgsElem[] {
        const updateTree = (svgs: SvgsElem[]): SvgsElem[] =>
            svgs.map(elem => {
                if (elem.id === id) return updater(elem);
                return elem.children ? { ...elem, children: updateTree(elem.children) } : elem;
            });

        return updateTree(this.param.svgs);
    }
}
