import React from 'react';
import useEvent from 'react-use-event-hook';
import { useRootDispatch } from '../../redux';
import { addSvg, setSvgs } from '../../redux/param/param-slice';
import { backupParam, setActive, setMode, setSelected } from '../../redux/runtime/runtime-slice';
import type { Id, Param, RuntimeActive, RuntimeMode } from '../../constants/constants';
import type { Components } from '../../constants/components';
import { nanoid, pointerPosToSVGCoord } from '../../util/helper';
import type { SmoothPathModel, Point as SmoothPathPointInput } from '../../util/smooth-path';
import { SmoothPathDrag, SmoothPathEditorController, SmoothPathHandleSelection } from './smooth-path-editor-controller';

export interface SmoothPathOverlayHandlers {
    onOverlayPointerMove: (event: React.PointerEvent<SVGElement>) => void;
    onOverlayPointerUp: (event: React.PointerEvent<SVGElement>) => void;
    onPathPointerDown: (event: React.PointerEvent<SVGElement>) => void;
    onPathDoubleClick: (event: React.MouseEvent<SVGElement>) => void;
    onPointPointerDown: (pointId: string, event: React.PointerEvent<SVGElement>) => void;
    onPointContextMenu: (pointId: string, event: React.MouseEvent<SVGElement>) => void;
    onPointDoubleClick: (pointId: string, event: React.MouseEvent<SVGElement>) => void;
    onWidthPositionPointerDown: (stopId: string, event: React.PointerEvent<SVGElement>) => void;
    onWidthSizePointerDown: (stopId: string, event: React.PointerEvent<SVGElement>) => void;
    onWidthContextMenu: (stopId: string, event: React.MouseEvent<SVGElement>) => void;
}

interface UseSmoothPathEditorOptions {
    param: Param;
    components: Components[];
    selected: Set<Id>;
    mode: RuntimeMode;
    active: RuntimeActive;
    svgViewBoxZoom: number;
    svgViewBoxMin: { x: number; y: number };
}

export const useSmoothPathEditor = (options: UseSmoothPathEditorOptions) => {
    const { param, components, selected, mode, active, svgViewBoxZoom, svgViewBoxMin } = options;
    const dispatch = useRootDispatch();
    const [drawingPoints, setDrawingPoints] = React.useState<SmoothPathPointInput[]>([]);
    const [smoothPathDrag, setSmoothPathDrag] = React.useState<SmoothPathDrag>();
    const [smoothPathHandleSelection, setSmoothPathHandleSelection] = React.useState<SmoothPathHandleSelection>();

    const controller = React.useMemo(
        () =>
            new SmoothPathEditorController({
                param,
                components,
                selected,
                svgViewBoxZoom,
                svgViewBoxMin,
            }),
        [components, param, selected, svgViewBoxMin, svgViewBoxZoom]
    );

    const selectedSmoothPath = React.useMemo(() => controller.getSelectedSmoothPath(), [controller]);
    const drawingPreviewPath = React.useMemo(
        () => controller.getDrawingPreviewPath(drawingPoints),
        [controller, drawingPoints]
    );
    const handleSize = React.useMemo(() => controller.getHandleSize(), [controller]);

    React.useEffect(() => {
        if (smoothPathHandleSelection && !selected.has(smoothPathHandleSelection.elemId)) {
            setSmoothPathHandleSelection(undefined);
        }
    }, [selected, smoothPathHandleSelection]);

    const getSvgPointerPosition = useEvent((event: React.MouseEvent<SVGElement | SVGSVGElement>) => {
        const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as SVGSVGElement);
        const bbox = svg.getBoundingClientRect();
        return pointerPosToSVGCoord(event.clientX - bbox.left, event.clientY - bbox.top, svgViewBoxZoom, svgViewBoxMin);
    });

    const getSmoothLocalPointerPosition = useEvent(
        (event: React.MouseEvent<SVGElement | SVGSVGElement>, origin: SmoothPathPointInput) => {
            const point = getSvgPointerPosition(event);
            return { x: point.x - origin.x, y: point.y - origin.y };
        }
    );

    const applySvgs = useEvent((nextSvgs: ReturnType<SmoothPathEditorController['updateModel']>) => {
        if (nextSvgs) dispatch(setSvgs(nextSvgs));
    });

    const applyModel = useEvent((elemId: Id, updater: (model: SmoothPathModel) => SmoothPathModel) => {
        applySvgs(controller.updateModel(elemId, updater));
    });

    const handleBackgroundDown = useEvent((event: React.PointerEvent<SVGSVGElement>): boolean => {
        if (mode !== 'draw-smooth-path') return false;

        event.preventDefault();
        const point = getSvgPointerPosition(event);
        setDrawingPoints([point]);
        dispatch(setActive('background'));
        event.currentTarget.setPointerCapture(event.pointerId);
        return true;
    });

    const handleBackgroundMove = useEvent((event: React.PointerEvent<SVGSVGElement>): boolean => {
        if (mode !== 'draw-smooth-path' || active !== 'background' || drawingPoints.length === 0) return false;

        const point = getSvgPointerPosition(event);
        setDrawingPoints(points => {
            const previous = points[points.length - 1];
            if (!previous || Math.hypot(previous.x - point.x, previous.y - point.y) >= 1) {
                return [...points, point];
            }
            return points;
        });
        return true;
    });

    const handleBackgroundUp = useEvent((event: React.PointerEvent<SVGSVGElement>): boolean => {
        if (mode !== 'draw-smooth-path' || active !== 'background') return false;

        const point = getSvgPointerPosition(event);
        const svgElem = controller.createSmoothPathSvgElem([...drawingPoints, point], () => nanoid(10));
        setDrawingPoints([]);
        dispatch(setActive(undefined));
        event.currentTarget.releasePointerCapture(event.pointerId);

        if (svgElem) {
            dispatch(backupParam(param));
            dispatch(addSvg(svgElem));
            dispatch(setSelected(new Set<Id>([svgElem.id])));
            dispatch(setMode('free'));
        }
        return true;
    });

    const handlePointPointerDown = useEvent((pointId: string, event: React.PointerEvent<SVGElement>) => {
        if (!selectedSmoothPath || event.button !== 0) {
            event.stopPropagation();
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch(backupParam(param));
        dispatch(setActive(selectedSmoothPath.elem.id));
        setSmoothPathHandleSelection({ elemId: selectedSmoothPath.elem.id, kind: 'point', id: pointId });
        setSmoothPathDrag({ elemId: selectedSmoothPath.elem.id, kind: 'point', id: pointId });
    });

    const handleWidthPositionPointerDown = useEvent((stopId: string, event: React.PointerEvent<SVGElement>) => {
        if (!selectedSmoothPath || event.button !== 0) {
            event.stopPropagation();
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch(backupParam(param));
        dispatch(setActive(selectedSmoothPath.elem.id));
        setSmoothPathHandleSelection({ elemId: selectedSmoothPath.elem.id, kind: 'width', id: stopId });
        setSmoothPathDrag({ elemId: selectedSmoothPath.elem.id, kind: 'width-position', id: stopId });
    });

    const handleWidthSizePointerDown = useEvent((stopId: string, event: React.PointerEvent<SVGElement>) => {
        if (!selectedSmoothPath || event.button !== 0) {
            event.stopPropagation();
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch(backupParam(param));
        dispatch(setActive(selectedSmoothPath.elem.id));
        setSmoothPathHandleSelection({ elemId: selectedSmoothPath.elem.id, kind: 'width', id: stopId });
        setSmoothPathDrag({ elemId: selectedSmoothPath.elem.id, kind: 'width-size', id: stopId });
    });

    const handlePointContextMenu = useEvent((pointId: string, event: React.MouseEvent<SVGElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (!selectedSmoothPath) return;

        const nextSvgs = controller.removeControlPoint(selectedSmoothPath.elem.id, pointId);
        if (nextSvgs) {
            dispatch(backupParam(param));
            dispatch(setSvgs(nextSvgs));
        }
        setSmoothPathHandleSelection(undefined);
        setSmoothPathDrag(undefined);
        dispatch(setActive(undefined));
    });

    const handlePointDoubleClick = useEvent((pointId: string, event: React.MouseEvent<SVGElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (!selectedSmoothPath) return;

        const result = controller.addWidthStopAtPoint(selectedSmoothPath.elem.id, pointId, () => nanoid(10));
        if (!result) return;

        dispatch(backupParam(param));
        dispatch(setSvgs(result.svgs));
        setSmoothPathHandleSelection({ elemId: selectedSmoothPath.elem.id, kind: 'width', id: result.id });
        setSmoothPathDrag(undefined);
        dispatch(setActive(undefined));
    });

    const handleWidthContextMenu = useEvent((stopId: string, event: React.MouseEvent<SVGElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (!selectedSmoothPath) return;

        const nextSvgs = controller.removeWidthStop(selectedSmoothPath.elem.id, stopId);
        if (nextSvgs) {
            dispatch(backupParam(param));
            dispatch(setSvgs(nextSvgs));
        }
        setSmoothPathHandleSelection(undefined);
        setSmoothPathDrag(undefined);
        dispatch(setActive(undefined));
    });

    const handleOverlayPointerMove = useEvent((event: React.PointerEvent<SVGElement>) => {
        if (!smoothPathDrag) return;
        const editable = controller.getSmoothPathEditableById(smoothPathDrag.elemId);
        if (!editable) return;

        event.stopPropagation();
        const localPoint = getSmoothLocalPointerPosition(event, editable.origin);
        if (smoothPathDrag.kind === 'point') {
            applySvgs(controller.moveControlPoint(smoothPathDrag.elemId, smoothPathDrag.id, localPoint));
        } else if (smoothPathDrag.kind === 'width-position') {
            applySvgs(controller.moveWidthStop(smoothPathDrag.elemId, smoothPathDrag.id, localPoint));
        } else {
            applySvgs(controller.resizeWidthStop(smoothPathDrag.elemId, smoothPathDrag.id, localPoint));
        }
    });

    const handleOverlayPointerUp = useEvent((event: React.PointerEvent<SVGElement>) => {
        if (!smoothPathDrag) return;
        event.stopPropagation();
        setSmoothPathDrag(undefined);
        dispatch(setActive(undefined));
    });

    const handlePathDoubleClick = useEvent((event: React.MouseEvent<SVGElement>) => {
        if (!selectedSmoothPath) return;

        event.stopPropagation();
        event.preventDefault();
        const newPointId = nanoid(10);
        const localPoint = getSmoothLocalPointerPosition(event, selectedSmoothPath.origin);
        dispatch(backupParam(param));
        applySvgs(controller.insertControlPoint(selectedSmoothPath.elem.id, localPoint, () => newPointId));
        setSmoothPathHandleSelection({ elemId: selectedSmoothPath.elem.id, kind: 'point', id: newPointId });
    });

    const handleKeyDelete = useEvent((): boolean => {
        if (!smoothPathHandleSelection) return false;
        const editable = controller.getSmoothPathEditableById(smoothPathHandleSelection.elemId);
        if (!editable) return false;

        const nextSvgs =
            smoothPathHandleSelection.kind === 'point'
                ? controller.removeControlPoint(smoothPathHandleSelection.elemId, smoothPathHandleSelection.id)
                : controller.removeWidthStop(smoothPathHandleSelection.elemId, smoothPathHandleSelection.id);
        if (nextSvgs) {
            dispatch(backupParam(param));
            dispatch(setSvgs(nextSvgs));
        }
        setSmoothPathHandleSelection(undefined);
        return true;
    });

    return {
        drawingPreviewPath,
        selectedSmoothPath,
        handleSize,
        handleSelection: smoothPathHandleSelection,
        handleBackgroundDown,
        handleBackgroundMove,
        handleBackgroundUp,
        handleKeyDelete,
        overlayHandlers: {
            onOverlayPointerMove: handleOverlayPointerMove,
            onOverlayPointerUp: handleOverlayPointerUp,
            onPathPointerDown: event => event.stopPropagation(),
            onPathDoubleClick: handlePathDoubleClick,
            onPointPointerDown: handlePointPointerDown,
            onPointContextMenu: handlePointContextMenu,
            onPointDoubleClick: handlePointDoubleClick,
            onWidthPositionPointerDown: handleWidthPositionPointerDown,
            onWidthSizePointerDown: handleWidthSizePointerDown,
            onWidthContextMenu: handleWidthContextMenu,
        } satisfies SmoothPathOverlayHandlers,
    };
};
