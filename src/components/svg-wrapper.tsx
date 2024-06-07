import React from 'react';
import useEvent from 'react-use-event-hook';
import { useRootDispatch, useRootSelector } from '../redux';
import {
    addSelected,
    backupParam,
    clearSelected,
    removeSelected,
    setActive,
    setMode,
    setSelected,
    setSvgViewBoxMin,
} from '../redux/runtime/runtime-slice';
import { addSvg, setSvgValue } from '../redux/param/param-slice';
import { Id, SvgsElem } from '../constants/constants';
import { SvgsType } from '../constants/svgs';
import { getMousePosition, nanoid, pointerPosToSVGCoord, roundToNearestN } from '../util/helper';
import { useWindowSize } from '../util/hook';
import { CreateSvgs } from './svgs/createSvgs';
import svgs from './svgs/svgs';

export default function SvgWrapper() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { selected, mode, active, svgViewBoxMin, svgViewBoxZoom } = useRootSelector(state => state.runtime);
    const size = useWindowSize();
    const svgWidth = 500; // size.width ?? 720 - 40;
    const svgHeight = 500; // ((size.height ?? 720) * 3) / 5;
    const canvasScale = 1;
    const color = param.color ? param.color.value ?? param.color.defaultValue : ['', '', '#000000', '#FFF'];
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [svgViewBoxMinTmp, setSvgViewBoxMinTmp] = React.useState({ x: 0, y: 0 }); // temp copy of svgViewBoxMin

    const handleBackgroundDown = useEvent((e: React.PointerEvent<SVGSVGElement>) => {
        const { x, y } = getMousePosition(e);
        if (mode.startsWith('svgs-')) {
            dispatch(setMode('free'));
            const rand = nanoid(10);
            const id: Id = `id_${rand}`;
            const { x: svgX, y: svgY } = pointerPosToSVGCoord(x, y, svgViewBoxZoom, svgViewBoxMin);
            const type = mode.slice(5) as SvgsType;
            const attr = structuredClone(svgs[type].defaultAttrs);
            const [keyX, keyY] = type === SvgsType.Circle ? ['cx', 'cy'] : ['x', 'y'];

            const svgElem: SvgsElem = {
                id,
                type,
                attrs: {
                    [keyX]: String(roundToNearestN(svgX, 1)),
                    [keyY]: String(roundToNearestN(svgY, 1)),
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
    const handlePointerDown = useEvent((node: Id, e: React.PointerEvent<SVGElement>) => {
        e.stopPropagation();

        const el = e.currentTarget;
        const { x, y } = getMousePosition(e);
        el.setPointerCapture(e.pointerId);

        setOffset({ x, y });

        dispatch(backupParam(param));
        dispatch(setActive(node));

        if (!e.shiftKey) {
            // no shift key -> non multiple selection case
            if (!selected.has(node)) {
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
        // console.log('down ', graph.current.getNodeAttributes(node));
    });
    const handlePointerMove = useEvent((node: Id, e: React.PointerEvent<SVGElement>) => {
        const { x, y } = getMousePosition(e);
        e.stopPropagation();

        if (mode === 'free' && active === node) {
            selected.forEach(s => {
                param.svgs.forEach((svg, index) => {
                    const [keyX, keyY] = svg.type === SvgsType.Circle ? ['cx', 'cy'] : ['x', 'y'];
                    if (svg.id === s) {
                        const newX = !Number.isNaN(Number(svg.attrs[keyX]))
                            ? String(
                                  roundToNearestN(Number(svg.attrs[keyX]) - ((offset.x - x) * svgViewBoxZoom) / 100, 1)
                              )
                            : svg.attrs[keyX];
                        const newY = !Number.isNaN(Number(svg.attrs[keyY]))
                            ? String(
                                  roundToNearestN(Number(svg.attrs[keyY]) - ((offset.y - y) * svgViewBoxZoom) / 100, 1)
                              )
                            : svg.attrs[keyY];
                        dispatch(
                            setSvgValue({
                                index,
                                value: {
                                    ...svg,
                                    attrs: {
                                        ...svg.attrs,
                                        [keyX]: newX,
                                        [keyY]: newY,
                                    },
                                },
                            })
                        );
                    }
                });
            });
        }
    });
    const handlePointerUp = useEvent((node: Id, e: React.PointerEvent<SVGElement>) => {
        if (mode === 'free') {
            if (active) {
                // the node is pointed down before
                // check the offset and if it's not 0, it must be a click not move
                const { x, y } = getMousePosition(e);
                if (offset.x - x === 0 && offset.y - y === 0) {
                    // no-op for click as the node is already added in pointer down
                } else {
                    // its a moving node operation, save the final coordinate
                    // dispatch(saveGraph(graph.current.export()));
                }
            } else {
                // no-op for a new node is just placed, already added to selected in pointer down
            }
        }
        dispatch(setActive(undefined));
    });

    return (
        <svg
            id="rmp-style-gen-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            height={svgHeight * canvasScale}
            viewBox={`${svgViewBoxMin.x} ${svgViewBoxMin.y} ${(svgWidth * svgViewBoxZoom) / 100} ${
                (svgHeight * svgViewBoxZoom) / 100
            }`}
            colorInterpolationFilters="sRGB"
            style={{
                ['--rmg-svg-width' as any]: svgWidth + 'px',
                ['--rmg-svg-height' as any]: svgHeight + 'px',
                ['--rmg-theme-colour' as any]: color[2],
                ['--rmg-theme-fg' as any]: color[3],
                userSelect: 'none',
                touchAction: 'none',
            }}
            onPointerDown={handleBackgroundDown}
            onPointerMove={handleBackgroundMove}
            onPointerUp={handleBackgroundUp}
        >
            <rect
                id="canvas-bg"
                x={-svgWidth / 2}
                y={-svgHeight / 2}
                fill="white"
                style={{ height: 'var(--rmg-svg-height)', width: 'var(--rmg-svg-width)' }}
            />
            <rect id="canvas-x" x={-svgWidth / 2} y={-1} width={svgWidth} height={2} fill="black" />
            <rect id="canvas-y" x={-1} y={-svgHeight / 2} width={2} height={svgHeight} fill="black" />
            {param.svgs.map(s => {
                const components = param.color ? [...param.components, param.color] : param.components;
                return (
                    <CreateSvgs
                        key={s.id}
                        svgsElem={s}
                        components={components}
                        handlePointerDown={handlePointerDown}
                        handlePointerMove={handlePointerMove}
                        handlePointerUp={handlePointerUp}
                    />
                );
            })}
            <rect
                id="canvas-border"
                x={-svgWidth / 2 + 2.5}
                y={-svgHeight / 2 + 2.5}
                width={svgWidth - 5}
                height={svgHeight - 5}
                fill="none"
                strokeWidth={5}
                stroke="black"
            />
        </svg>
    );
}
