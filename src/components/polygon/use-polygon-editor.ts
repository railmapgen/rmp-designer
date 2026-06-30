import React from 'react';
import useEvent from 'react-use-event-hook';
import { useRootDispatch } from '../../redux';
import { setSvgs } from '../../redux/param/param-slice';
import { backupParam, setActive } from '../../redux/runtime/runtime-slice';
import type { Components } from '../../constants/components';
import type { Id, Param, RuntimeMode } from '../../constants/constants';
import { pointerPosToSVGCoord } from '../../util/helper';
import type { Point as PolygonPointInput } from '../../util/polygon-points';
import { PolygonDrag, PolygonEditorController, PolygonHandleSelection } from './polygon-editor-controller';

export interface PolygonOverlayHandlers {
    onOverlayPointerMove: (event: React.PointerEvent<SVGElement>) => void;
    onOverlayPointerUp: (event: React.PointerEvent<SVGElement>) => void;
    onPolygonPointerDown: (event: React.PointerEvent<SVGElement>) => void;
    onPolygonDoubleClick: (event: React.MouseEvent<SVGElement>) => void;
    onPointPointerDown: (pointId: string, event: React.PointerEvent<SVGElement>) => void;
    onPointContextMenu: (pointId: string, event: React.MouseEvent<SVGElement>) => void;
}

interface UsePolygonEditorOptions {
    param: Param;
    components: Components[];
    selected: Set<Id>;
    mode: RuntimeMode;
    svgViewBoxZoom: number;
    svgViewBoxMin: { x: number; y: number };
}

export const usePolygonEditor = (options: UsePolygonEditorOptions) => {
    const { param, components, selected, mode, svgViewBoxZoom, svgViewBoxMin } = options;
    const dispatch = useRootDispatch();
    const [polygonDrag, setPolygonDrag] = React.useState<PolygonDrag>();
    const [polygonHandleSelection, setPolygonHandleSelection] = React.useState<PolygonHandleSelection>();

    const controller = React.useMemo(
        () =>
            new PolygonEditorController({
                param,
                components,
                selected,
                svgViewBoxZoom,
            }),
        [components, param, selected, svgViewBoxZoom]
    );

    const selectedPolygon = React.useMemo(
        () => (mode === 'free' ? controller.getSelectedPolygon() : undefined),
        [controller, mode]
    );
    const handleSize = React.useMemo(() => controller.getHandleSize(), [controller]);

    React.useEffect(() => {
        if (polygonHandleSelection && !selected.has(polygonHandleSelection.elemId)) {
            setPolygonHandleSelection(undefined);
        }
    }, [polygonHandleSelection, selected]);

    const getSvgPointerPosition = useEvent((event: React.MouseEvent<SVGElement | SVGSVGElement>) => {
        const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as SVGSVGElement);
        const bbox = svg.getBoundingClientRect();
        return pointerPosToSVGCoord(event.clientX - bbox.left, event.clientY - bbox.top, svgViewBoxZoom, svgViewBoxMin);
    });

    const getPolygonLocalPointerPosition = useEvent(
        (event: React.MouseEvent<SVGElement | SVGSVGElement>, origin: PolygonPointInput) => {
            const point = getSvgPointerPosition(event);
            return { x: point.x - origin.x, y: point.y - origin.y };
        }
    );

    const applySvgs = useEvent((nextSvgs: ReturnType<PolygonEditorController['updatePoints']>) => {
        if (nextSvgs) dispatch(setSvgs(nextSvgs));
    });

    const handlePointPointerDown = useEvent((pointId: string, event: React.PointerEvent<SVGElement>) => {
        if (!selectedPolygon || event.button !== 0) {
            event.stopPropagation();
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch(backupParam(param));
        dispatch(setActive(selectedPolygon.elem.id));
        setPolygonHandleSelection({ elemId: selectedPolygon.elem.id, pointId });
        setPolygonDrag({ elemId: selectedPolygon.elem.id, pointId });
    });

    const handlePointContextMenu = useEvent((pointId: string, event: React.MouseEvent<SVGElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (!selectedPolygon) return;

        const nextSvgs = controller.removePoint(selectedPolygon.elem.id, pointId);
        if (nextSvgs) {
            dispatch(backupParam(param));
            dispatch(setSvgs(nextSvgs));
        }
        setPolygonHandleSelection(undefined);
        setPolygonDrag(undefined);
        dispatch(setActive(undefined));
    });

    const handleOverlayPointerMove = useEvent((event: React.PointerEvent<SVGElement>) => {
        if (!polygonDrag) return;
        const editable = controller.getPolygonEditableById(polygonDrag.elemId);
        if (!editable) return;

        event.stopPropagation();
        const localPoint = getPolygonLocalPointerPosition(event, editable.origin);
        applySvgs(controller.movePoint(polygonDrag.elemId, polygonDrag.pointId, localPoint));
    });

    const handleOverlayPointerUp = useEvent((event: React.PointerEvent<SVGElement>) => {
        if (!polygonDrag) return;
        event.stopPropagation();
        setPolygonDrag(undefined);
        dispatch(setActive(undefined));
    });

    const handlePolygonDoubleClick = useEvent((event: React.MouseEvent<SVGElement>) => {
        if (!selectedPolygon) return;

        event.stopPropagation();
        event.preventDefault();
        const localPoint = getPolygonLocalPointerPosition(event, selectedPolygon.origin);
        const result = controller.insertPoint(selectedPolygon.elem.id, localPoint);
        if (!result) return;

        dispatch(backupParam(param));
        dispatch(setSvgs(result.svgs));
        setPolygonHandleSelection({ elemId: selectedPolygon.elem.id, pointId: result.pointId });
        setPolygonDrag(undefined);
        dispatch(setActive(undefined));
    });

    const handleKeyDelete = useEvent((): boolean => {
        if (!polygonHandleSelection) return false;
        const editable = controller.getPolygonEditableById(polygonHandleSelection.elemId);
        if (!editable) return false;

        const nextSvgs = controller.removePoint(polygonHandleSelection.elemId, polygonHandleSelection.pointId);
        if (nextSvgs) {
            dispatch(backupParam(param));
            dispatch(setSvgs(nextSvgs));
        }
        setPolygonHandleSelection(undefined);
        return true;
    });

    return {
        selectedPolygon,
        handleSize,
        handleSelection: polygonHandleSelection,
        handleKeyDelete,
        overlayHandlers: {
            onOverlayPointerMove: handleOverlayPointerMove,
            onOverlayPointerUp: handleOverlayPointerUp,
            onPolygonPointerDown: event => event.stopPropagation(),
            onPolygonDoubleClick: handlePolygonDoubleClick,
            onPointPointerDown: handlePointPointerDown,
            onPointContextMenu: handlePointContextMenu,
        } satisfies PolygonOverlayHandlers,
    };
};
