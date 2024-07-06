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
import { Id, SvgsElem } from '../constants/constants';
import { SvgsType } from '../constants/svgs';
import { getMousePosition, isMacClient, nanoid, pointerPosToSVGCoord, roundToNearestN } from '../util/helper';
import { useWindowSize } from '../util/hook';
import { CreateSvgs } from './svgs/createSvgs';
import svgs from './svgs/module/svgs';
import { updateTransformString } from '../util/parse';

export default function SvgWrapper() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { canvasColor } = useRootSelector(store => store.app);
    const { selected, mode, active, svgViewBoxMin, svgViewBoxZoom, history, undo_history } = useRootSelector(
        state => state.runtime
    );
    const size = useWindowSize();
    const svgWidth = (size.width ?? 720) - 40;
    const svgHeight = (((size.height ?? 720) - 40) * 3) / 5;
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [svgViewBoxMinTmp, setSvgViewBoxMinTmp] = React.useState({ x: 0, y: 0 }); // temp copy of svgViewBoxMin
    const canvasBackground =
        canvasColor === 'dark' ? 'var(--chakra-colors-gray-800)' : canvasColor === 'white' ? 'white' : '';

    const handleBackgroundDown = useEvent((e: React.PointerEvent<SVGSVGElement>) => {
        const { x, y } = getMousePosition(e);
        if (mode.startsWith('svgs-')) {
            dispatch(setMode('free'));
            const rand = nanoid(10);
            const id: Id = `id_${rand}`;
            const { x: svgX, y: svgY } = pointerPosToSVGCoord(x, y, svgViewBoxZoom, svgViewBoxMin);
            const type = mode.slice(5) as SvgsType;
            const attr = structuredClone(svgs[type].defaultAttrs);

            const svgElem: SvgsElem = {
                id,
                type,
                label: nanoid(5),
                attrs: {
                    x: `1"${roundToNearestN(svgX, 1)}"`,
                    y: `1"${roundToNearestN(svgY, 1)}"`,
                    ...attr,
                },
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
                    if (s.attrs.x || s.attrs.y || (!s.attrs.x && !s.attrs.y && !s.attrs.transform)) {
                        const newX =
                            s.attrs.x === undefined || !Number.isNaN(Number(s.attrs.x.slice(2, -1)))
                                ? `1"${roundToNearestN(Number(s.attrs.x ? s.attrs.x.slice(2, -1) : 0) + dx, 1)}"`
                                : s.attrs.x;
                        const newY =
                            s.attrs.y === undefined || !Number.isNaN(Number(s.attrs.y.slice(2, -1)))
                                ? `1"${roundToNearestN(Number(s.attrs.y ? s.attrs.y.slice(2, -1) : 0) + dy, 1)}"`
                                : s.attrs.y;
                        return { ...s, attrs: { ...s.attrs, x: newX, y: newY } };
                    } else if (s.attrs.transform) {
                        const newTransform = updateTransformString(s.attrs.transform ?? '', dx, dy);
                        return { ...s, attrs: { ...s.attrs, transform: newTransform } };
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
            {param.svgs.map(s => {
                const components = param.color ? [...param.components, param.color] : param.components;
                return (
                    <CreateSvgs
                        key={s.id}
                        svgsElem={s}
                        components={components}
                        prefix={[s.id]}
                        handlePointerDown={handlePointerDown}
                        handlePointerMove={handlePointerMove}
                        handlePointerUp={handlePointerUp}
                    />
                );
            })}
        </svg>
    );
}
