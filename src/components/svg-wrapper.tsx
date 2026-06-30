import React from 'react';
import useEvent from 'react-use-event-hook';
import { useRootDispatch, useRootSelector } from '../redux';
import {
    addSelected,
    backupParam,
    backupRedo,
    backupRemove,
    backupUndo,
    clearGlobalAlerts,
    clearSelected,
    removeSelected,
    setActive,
    setMode,
    setSelected,
    setSvgViewBoxMin,
    setSvgViewBoxZoom,
} from '../redux/runtime/runtime-slice';
import { addSvg, setParam, setSvgs } from '../redux/param/param-slice';
import { createLiteralAttrBinding, type AttrBinding } from '../constants/attr-binding';
import type { Components } from '../constants/components';
import { Id, SvgsElem } from '../constants/constants';
import { SvgsType } from '../constants/svgs';
import { getMousePosition, isMacClient, nanoid, pointerPosToSVGCoord, roundToNearestN } from '../util/helper';
import { useWindowSize } from '../util/hook';
import { CreateSvgs } from './svgs/createSvgs';
import svgs from './svgs/module/svgs';
import { updateTransformString } from '../util/parse';
import { countSvgNodes, MAX_EDITABLE_SVG_NODE_COUNT } from '../util/svg-node-count';
import { useSmoothPathEditor } from './smooth-path/use-smooth-path-editor';
import { SmoothPathOverlay } from './smooth-path/smooth-path-overlay';
import { compileAttrBindingToLegacyAttr, compileAttrRecord, legacyAttrToBinding } from '../util/attr-binding';
import { usePolygonEditor } from './polygon/use-polygon-editor';
import { PolygonOverlay } from './polygon/polygon-overlay';

type AttrPatch = {
    attrs: Record<string, string>;
    attrBindings: Record<string, AttrBinding>;
};

const numericLiteralValue = (value: unknown): number | undefined => {
    if (typeof value !== 'number' && typeof value !== 'string') return undefined;
    if (String(value).trim() === '') return undefined;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? undefined : numberValue;
};

const getMovableNumericAttrValue = (elem: SvgsElem, key: 'x' | 'y', components: Components[]): number | undefined => {
    const binding = elem.attrBindings?.[key];
    if (binding) return binding.kind === 'literal' ? numericLiteralValue(binding.value) : undefined;

    const attr = elem.attrs[key];
    if (attr === undefined) return 0;

    const legacyBinding = legacyAttrToBinding(attr, components);
    return legacyBinding.kind === 'literal' ? numericLiteralValue(legacyBinding.value) : undefined;
};

const getMovedNumericAttrPatch = (
    elem: SvgsElem,
    key: 'x' | 'y',
    delta: number,
    components: Components[]
): { attr: string; binding: AttrBinding } | undefined => {
    const currentValue = getMovableNumericAttrValue(elem, key, components);
    if (currentValue === undefined) return undefined;

    const binding = createLiteralAttrBinding(roundToNearestN(currentValue + delta, 1));
    return {
        attr: compileAttrBindingToLegacyAttr(binding, components),
        binding,
    };
};

const hasSvgAttr = (elem: SvgsElem, key: string): boolean =>
    elem.attrs[key] !== undefined || !!elem.attrBindings?.[key];

const getMovedPositionPatch = (
    elem: SvgsElem,
    dx: number,
    dy: number,
    components: Components[]
): AttrPatch | undefined => {
    const xPatch = getMovedNumericAttrPatch(elem, 'x', dx, components);
    const yPatch = getMovedNumericAttrPatch(elem, 'y', dy, components);
    if (!xPatch && !yPatch) return undefined;

    return {
        attrs: {
            ...(xPatch ? { x: xPatch.attr } : {}),
            ...(yPatch ? { y: yPatch.attr } : {}),
        },
        attrBindings: {
            ...(xPatch ? { x: xPatch.binding } : {}),
            ...(yPatch ? { y: yPatch.binding } : {}),
        },
    };
};

const getMovedTransformPatch = (
    elem: SvgsElem,
    dx: number,
    dy: number,
    components: Components[]
): AttrPatch | undefined => {
    const binding = elem.attrBindings?.transform;
    if (binding && binding.kind !== 'literal') return undefined;

    const currentAttr = binding ? compileAttrBindingToLegacyAttr(binding, components) : elem.attrs.transform;
    if (!currentAttr) return undefined;

    const nextAttr = updateTransformString(currentAttr, dx, dy);
    return {
        attrs: { transform: nextAttr },
        attrBindings: { transform: legacyAttrToBinding(nextAttr, components) },
    };
};

const applyAttrPatch = (elem: SvgsElem, patch: AttrPatch | undefined): SvgsElem =>
    patch
        ? {
              ...elem,
              attrs: { ...elem.attrs, ...patch.attrs },
              attrBindings: { ...(elem.attrBindings ?? {}), ...patch.attrBindings },
          }
        : elem;

export default function SvgWrapper(props: { height?: number }) {
    const { height } = props;
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { canvasColor } = useRootSelector(store => store.app);
    const { selected, mode, active, svgViewBoxMin, svgViewBoxZoom, history, undo_history } = useRootSelector(
        state => state.runtime
    );
    const size = useWindowSize();
    const svgWidth = (size.width ?? 720) - 40;
    const svgHeight = height ?? (((size.height ?? 720) - 40) * 3) / 5;
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [svgViewBoxMinTmp, setSvgViewBoxMinTmp] = React.useState({ x: 0, y: 0 }); // temp copy of svgViewBoxMin
    const components = React.useMemo(() => param.components, [param.components]);
    const svgNodeCount = React.useMemo(() => countSvgNodes(param.svgs), [param.svgs]);
    const svgTreeEditable = svgNodeCount <= MAX_EDITABLE_SVG_NODE_COUNT;
    const rootPrefixes = React.useMemo(() => new Map(param.svgs.map(s => [s.id, [s.id] as Id[]])), [param.svgs]);
    const canvasBackground =
        canvasColor === 'dark' ? 'var(--chakra-colors-gray-800)' : canvasColor === 'white' ? 'white' : '';
    const smoothPathEditor = useSmoothPathEditor({
        param,
        components,
        selected,
        mode,
        active,
        svgViewBoxZoom,
        svgViewBoxMin,
    });
    const polygonEditor = usePolygonEditor({
        param,
        components,
        selected,
        mode,
        svgViewBoxZoom,
        svgViewBoxMin,
    });

    const handleBackgroundDown = useEvent((e: React.PointerEvent<SVGSVGElement>) => {
        if (!svgTreeEditable && (mode.startsWith('svgs-') || mode === 'draw-smooth-path')) {
            dispatch(setMode('free'));
            return;
        }

        if (smoothPathEditor.handleBackgroundDown(e)) return;

        const { x, y } = getMousePosition(e);
        if (mode.startsWith('svgs-')) {
            dispatch(setMode('free'));
            const rand = nanoid(10);
            const id: Id = `id_${rand}`;
            const { x: svgX, y: svgY } = pointerPosToSVGCoord(x, y, svgViewBoxZoom, svgViewBoxMin);
            const type = mode.slice(5) as SvgsType;
            const attrBindings: Record<string, AttrBinding> = {
                ...structuredClone(svgs[type].defaultAttrBindings),
                x: createLiteralAttrBinding(roundToNearestN(svgX, 1)),
                y: createLiteralAttrBinding(roundToNearestN(svgY, 1)),
            };

            const svgElem: SvgsElem = {
                id,
                type,
                label: nanoid(5),
                attrs: compileAttrRecord({}, attrBindings, components),
                attrBindings,
            };
            dispatch(backupParam(param));
            dispatch(addSvg(svgElem));
        } else if (mode === 'free') {
            // set initial position of the pointer, this is used in handleBackgroundMove
            setOffset({ x, y });
            setSvgViewBoxMinTmp(svgViewBoxMin);
            if (!e.shiftKey) {
                // when user holding the shift key and mis-click the background
                // preserve the current selection
                dispatch(setActive('background'));
                dispatch(clearSelected());
            }
        }
    });
    const handleBackgroundMove = useEvent((e: React.PointerEvent<SVGSVGElement>) => {
        if (smoothPathEditor.handleBackgroundMove(e)) return;

        const { x, y } = getMousePosition(e);
        if (active === 'background') {
            dispatch(
                setSvgViewBoxMin({
                    x: svgViewBoxMinTmp.x + ((offset.x - x) * svgViewBoxZoom) / 100,
                    y: svgViewBoxMinTmp.y + ((offset.y - y) * svgViewBoxZoom) / 100,
                })
            );
        }
    });
    const handleBackgroundUp = useEvent((e: React.PointerEvent<SVGSVGElement>) => {
        if (smoothPathEditor.handleBackgroundUp(e)) return;

        if (active === 'background' && !e.shiftKey) {
            dispatch(setActive(undefined)); // svg mouse event only
        }
    });
    const handlePointerDown = useEvent((node: Id, path: Id[], e: React.PointerEvent<SVGElement>) => {
        e.stopPropagation();

        const el = e.currentTarget;
        const { x, y } = getMousePosition(e);
        el.setPointerCapture(e.pointerId);

        setOffset({ x, y });

        dispatch(backupParam(param));
        dispatch(setActive(node));

        if (!e.shiftKey) {
            // no shift key -> non multiple selection case
            if (path.filter(s => selected.has(s)).length === 0) {
                // set the current as the only one no matter what the previous selected were
                dispatch(setSelected(new Set<Id>([node])));
            } else {
                // no-op as users may drag the previously selected node(s) for the current selected
            }
        } else {
            // shift key pressed -> multiple selection case
            if (selected.has(node)) {
                // remove current if it is already in the multiple selection
                dispatch(removeSelected(node));
            } else {
                // add current in the multiple selection
                dispatch(addSelected(node));
            }
        }
    });
    const handlePointerMove = useEvent((node: Id, path: Id[], e: React.PointerEvent<SVGElement>) => {
        const { x, y } = getMousePosition(e);
        e.stopPropagation();

        const dfsMoveNodes = (svgs: SvgsElem[]): SvgsElem[] => {
            if (svgs.length === 0) {
                return [];
            }
            return svgs.map(s => {
                if (selected.has(s.id)) {
                    const dx = ((x - offset.x) * svgViewBoxZoom) / 100;
                    const dy = ((y - offset.y) * svgViewBoxZoom) / 100;
                    const hasPositionAttr = hasSvgAttr(s, 'x') || hasSvgAttr(s, 'y');
                    const hasTransformAttr = hasSvgAttr(s, 'transform');
                    if (hasPositionAttr || (!hasPositionAttr && !hasTransformAttr)) {
                        return applyAttrPatch(s, getMovedPositionPatch(s, dx, dy, components));
                    } else if (hasTransformAttr) {
                        return applyAttrPatch(s, getMovedTransformPatch(s, dx, dy, components));
                    } else {
                        return s;
                    }
                } else {
                    if (s.children && s.children.length > 0) {
                        const ch = dfsMoveNodes(s.children);
                        return { ...s, children: ch.length !== 0 ? ch : undefined };
                    } else {
                        return s;
                    }
                }
            });
        };

        if (mode === 'free' && active === node) {
            dispatch(setSvgs(dfsMoveNodes(param.svgs)));
        }
    });
    const handlePointerUp = useEvent((node: Id, path: Id[], e: React.PointerEvent<SVGElement>) => {
        // if (mode === 'free') {
        // if (active) {
        // the node is pointed down before
        // check the offset and if it's not 0, it must be a click not move
        // const { x, y } = getMousePosition(e);
        // if (offset.x - x === 0 && offset.y - y === 0) {
        // no-op for click as the node is already added in pointer down
        // } else {
        // its a moving node operation
        // }
        // } else {
        // no-op for a new node is just placed, already added to selected in pointer down
        // }
        // }
        dispatch(setActive(undefined));
    });

    const handleBackgroundWheel = useEvent((e: React.WheelEvent<SVGSVGElement>) => {
        e.stopPropagation();
        let newSvgViewBoxZoom = svgViewBoxZoom;
        if (e.deltaY > 0 && svgViewBoxZoom + 10 < 400) newSvgViewBoxZoom = svgViewBoxZoom + 10;
        else if (e.deltaY < 0 && svgViewBoxZoom - 10 > 0) newSvgViewBoxZoom = svgViewBoxZoom - 10;
        dispatch(setSvgViewBoxZoom(newSvgViewBoxZoom));

        // the position the pointer points will still be in the same place after zooming
        const { x, y } = getMousePosition(e);
        const bbox = e.currentTarget.getBoundingClientRect();
        // calculate the proportion of the pointer in the canvas
        const [x_factor, y_factor] = [x / bbox.width, y / bbox.height];
        // the final svgViewBoxMin will be the position the pointer points minus
        // the left/top part of the new canvas (new width/height times the proportion)
        dispatch(
            setSvgViewBoxMin({
                x: svgViewBoxMin.x + (x * svgViewBoxZoom) / 100 - ((svgWidth * newSvgViewBoxZoom) / 100) * x_factor,
                y: svgViewBoxMin.y + (y * svgViewBoxZoom) / 100 - ((svgHeight * newSvgViewBoxZoom) / 100) * y_factor,
            })
        );
    });

    const handleKeyDown = useEvent(async (e: React.KeyboardEvent<SVGSVGElement>) => {
        // tabIndex need to be on the element to make onKeyDown worked
        // https://www.delftstack.com/howto/react/onkeydown-react/
        if (isMacClient ? e.key === 'Backspace' : e.key === 'Delete') {
            if (smoothPathEditor.handleKeyDelete()) {
                e.preventDefault();
                return;
            }
            if (polygonEditor.handleKeyDelete()) {
                e.preventDefault();
                return;
            }
            // remove all the selected nodes and edges
            if (selected.size > 0) {
                const dfsRemove = (data: SvgsElem[]): SvgsElem[] => {
                    const p = data.filter(s => !selected.has(s.id));
                    return p.map(s => {
                        const children = s.children ? dfsRemove(s.children) : undefined;
                        return { ...s, children: children ? (children.length === 0 ? [] : children) : undefined };
                    });
                };
                dispatch(backupParam(param));
                dispatch(setSvgs(dfsRemove(param.svgs)));
                dispatch(clearGlobalAlerts());
                dispatch(clearSelected());
            }
        } else if (e.key.startsWith('Arrow')) {
            const d = 100;
            const x_factor = e.key.endsWith('Left') ? -1 : e.key.endsWith('Right') ? 1 : 0;
            const y_factor = e.key.endsWith('Up') ? -1 : e.key.endsWith('Down') ? 1 : 0;
            dispatch(setSvgViewBoxMin(pointerPosToSVGCoord(d * x_factor, d * y_factor, svgViewBoxZoom, svgViewBoxMin)));
        } else if (e.key === 'z' && (isMacClient ? e.metaKey && !e.shiftKey : e.ctrlKey)) {
            if (isMacClient) e.preventDefault(); // Cmd Z will step backward in safari and chrome
            if (history.length > 0) {
                dispatch(backupUndo(param));
                dispatch(setParam(history[history.length - 1]));
                dispatch(backupRemove());
            }
        } else if (e.key === 's') {
            // dispatch(setMode('select'));
        } else if (
            (isMacClient && e.key === 'z' && e.metaKey && e.shiftKey) ||
            (!isMacClient && e.key === 'y' && e.ctrlKey)
        ) {
            if (undo_history.length > 0) {
                dispatch(backupParam(param));
                dispatch(setParam(undo_history[undo_history.length - 1]));
                dispatch(backupRedo());
            }
        }
    });

    return (
        <svg
            id="rmp-style-gen-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width={svgWidth}
            height={svgHeight}
            viewBox={`${svgViewBoxMin.x} ${svgViewBoxMin.y} ${(svgWidth * svgViewBoxZoom) / 100} ${
                (svgHeight * svgViewBoxZoom) / 100
            }`}
            colorInterpolationFilters="sRGB"
            style={{
                position: 'absolute',
                left: 40,
                userSelect: 'none',
                touchAction: 'none',
                backgroundColor: canvasBackground,
            }}
            onPointerDown={handleBackgroundDown}
            onPointerMove={handleBackgroundMove}
            onPointerUp={handleBackgroundUp}
            onWheel={handleBackgroundWheel}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <rect id="canvas-x" x={-200000} y={-1} width={400000} height={2} fill="black" />
            <rect id="canvas-y" x={-1} y={-200000} width={2} height={400000} fill="black" />
            {smoothPathEditor.drawingPreviewPath && (
                <path
                    d={smoothPathEditor.drawingPreviewPath}
                    fill="#D6ABC1"
                    opacity={0.45}
                    stroke="none"
                    pointerEvents="none"
                />
            )}
            {param.svgs.map(s => {
                return (
                    <CreateSvgs
                        key={s.id}
                        svgsElem={s}
                        components={components}
                        prefix={rootPrefixes.get(s.id) ?? [s.id]}
                        isEditable={svgTreeEditable}
                        handlePointerDown={handlePointerDown}
                        handlePointerMove={handlePointerMove}
                        handlePointerUp={handlePointerUp}
                    />
                );
            })}
            {svgTreeEditable && (
                <>
                    <SmoothPathOverlay
                        selectedSmoothPath={smoothPathEditor.selectedSmoothPath}
                        handleSize={smoothPathEditor.handleSize}
                        handleSelection={smoothPathEditor.handleSelection}
                        handlers={smoothPathEditor.overlayHandlers}
                    />
                    <PolygonOverlay
                        selectedPolygon={polygonEditor.selectedPolygon}
                        handleSize={polygonEditor.handleSize}
                        handleSelection={polygonEditor.handleSelection}
                        handlers={polygonEditor.overlayHandlers}
                    />
                </>
            )}
        </svg>
    );
}
