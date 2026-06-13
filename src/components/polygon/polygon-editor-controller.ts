import { createLiteralAttrBinding } from '../../constants/attr-binding';
import type { Components } from '../../constants/components';
import type { Id, Param, SvgsElem } from '../../constants/constants';
import { compileAttrBindingToLegacyAttr, evaluateSvgAttrs } from '../../util/attr-binding';
import {
    insertPolygonPointAtNearestSegment,
    movePolygonPoint,
    parsePolygonPoints,
    Point as PolygonPointInput,
    PolygonPoint,
    removePolygonPoint,
    serializePolygonPoints,
} from '../../util/polygon-points';

export type PolygonHandleSelection = { elemId: Id; pointId: string } | undefined;

export type PolygonDrag = { elemId: Id; pointId: string } | undefined;

export interface PolygonEditable {
    elem: SvgsElem;
    points: PolygonPoint[];
    origin: PolygonPointInput;
}

export interface PolygonHandleSize {
    hitStrokeWidth: number;
    guideStrokeWidth: number;
    strokeWidth: number;
    pointRadius: number;
    selectedPointRadius: number;
    dashArray: string;
}

interface PolygonEditorContext {
    param: Param;
    components: Components[];
    selected: Set<Id>;
    svgViewBoxZoom: number;
}

export class PolygonEditorController {
    private readonly param: Param;
    private readonly components: Components[];
    private readonly selected: Set<Id>;
    private readonly svgViewBoxZoom: number;

    constructor(context: PolygonEditorContext) {
        this.param = context.param;
        this.components = context.components;
        this.selected = context.selected;
        this.svgViewBoxZoom = context.svgViewBoxZoom;
    }

    findSvgElemById(id: Id): SvgsElem | undefined {
        return this.findSvgElemInTree(this.param.svgs, id);
    }

    getPolygonEditable(elem: SvgsElem): PolygonEditable | undefined {
        if (elem.type !== 'polygon') return undefined;
        const evaluated = evaluateSvgAttrs(elem.attrs, elem.attrBindings, this.components);
        if (evaluated.error) return undefined;
        const points = parsePolygonPoints(evaluated.attrs.points);
        if (!points) return undefined;

        return {
            elem,
            points,
            origin: {
                x: Number(evaluated.attrs.x ?? 0) || 0,
                y: Number(evaluated.attrs.y ?? 0) || 0,
            },
        };
    }

    getPolygonEditableById(id: Id): PolygonEditable | undefined {
        const elem = this.findSvgElemById(id);
        return elem ? this.getPolygonEditable(elem) : undefined;
    }

    getSelectedPolygon(): PolygonEditable | undefined {
        if (this.selected.size !== 1) return undefined;
        return this.getPolygonEditableById(Array.from(this.selected)[0]);
    }

    getHandleSize(): PolygonHandleSize {
        const screenToSvgScale = this.svgViewBoxZoom / 100;
        return {
            hitStrokeWidth: 16 * screenToSvgScale,
            guideStrokeWidth: 1.5 * screenToSvgScale,
            strokeWidth: 2 * screenToSvgScale,
            pointRadius: 4.5 * screenToSvgScale,
            selectedPointRadius: 6 * screenToSvgScale,
            dashArray: `${4 * screenToSvgScale} ${3 * screenToSvgScale}`,
        };
    }

    updatePoints(elemId: Id, updater: (points: PolygonPoint[]) => PolygonPoint[]): SvgsElem[] | undefined {
        const editable = this.getPolygonEditableById(elemId);
        if (!editable) return undefined;

        const nextPoints = updater(editable.points);
        if (nextPoints.length < 3) return undefined;
        const binding = createLiteralAttrBinding(serializePolygonPoints(nextPoints));
        const attr = compileAttrBindingToLegacyAttr(binding, this.components);

        return this.updateSvgElemById(elemId, elem => ({
            ...elem,
            attrs: { ...elem.attrs, points: attr },
            attrBindings: { ...(elem.attrBindings ?? {}), points: binding },
        }));
    }

    movePoint(elemId: Id, pointId: string, point: PolygonPointInput): SvgsElem[] | undefined {
        return this.updatePoints(elemId, points => movePolygonPoint(points, pointId, point));
    }

    removePoint(elemId: Id, pointId: string): SvgsElem[] | undefined {
        const editable = this.getPolygonEditableById(elemId);
        if (!editable || editable.points.length <= 3) return undefined;
        return this.updatePoints(elemId, points => removePolygonPoint(points, pointId));
    }

    insertPoint(elemId: Id, point: PolygonPointInput): { svgs: SvgsElem[]; pointId: string } | undefined {
        let nextPointId = '';
        const svgs = this.updatePoints(elemId, points => {
            const result = insertPolygonPointAtNearestSegment(points, point);
            nextPointId = result.id;
            return result.points;
        });

        return svgs ? { svgs, pointId: nextPointId } : undefined;
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
