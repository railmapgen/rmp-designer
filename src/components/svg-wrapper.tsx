import React from "react";
import useEvent from 'react-use-event-hook';
import { useRootDispatch, useRootSelector } from '../redux';
import { SvgsAttrs, SvgsType } from "../constants/svgs";
import svgs from "./svgs/svgs";
import { getComponentValue } from "../util/parse";
import { Id, SvgsElem } from '../constants/constants';
import { getMousePosition, nanoid, roundToNearestN } from '../util/helper';
import {
    addSelected,
    removeSelected,
    setActive,
    setMode,
    setRefresh,
    setSelected,
} from '../redux/runtime/runtime-slice';
import { addSvg, setSvgValue } from '../redux/param/param-slice';

export default function SvgWrapper() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const {
        selected,
        refresh,
        mode,
        active,
    } = useRootSelector(state => state.runtime);
    const svgWidth = 500;
    const svgHeight = 500;
    const canvasScale = 1;
    const color = param.color ? param.color.value ?? param.color.defaultValue : ['', '', '#000000', '#FFF'];
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });

    const handleBackgroundDown = useEvent((e: React.PointerEvent<SVGSVGElement>) => {
        const { x, y } = getMousePosition(e);
        if (mode.startsWith('svgs-')) {
            dispatch(setMode('free'));
            const rand = nanoid(10);
            const id: Id = `id_${rand}`;
            const type = mode.slice(5) as SvgsType;
            const attr = structuredClone(svgs[type].defaultAttrs);

            const svgElem: SvgsElem<SvgsAttrs[keyof SvgsAttrs]> = {
                id,
                type,
                isCore: false,
                x: String(x - svgWidth / 2),
                y: String(y - svgHeight / 2),
                attrs: attr,
            };

            // const { x: svgX, y: svgY } = pointerPosToSVGCoord(x, y, svgViewBoxZoom, svgViewBoxMin);
            dispatch(addSvg(svgElem));
        }
    });
    const handlePointerDown = useEvent((node: Id, e: React.PointerEvent<SVGElement>) => {
        e.stopPropagation();

        const el = e.currentTarget;
        const { x, y } = getMousePosition(e);
        el.setPointerCapture(e.pointerId);

        setOffset({ x, y });

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

        if (mode === 'free' && active === node) {
            selected.forEach(s => {
                param.svgs.forEach((svg, index) => {
                    if (svg.id === s) {
                        const newX = !Number.isNaN(Number(svg.x)) ? String(roundToNearestN(Number(svg.x) - offset.x + x, 1)) : svg.x;
                        const newY = !Number.isNaN(Number(svg.y)) ? String(roundToNearestN(Number(svg.y) - offset.y + y, 1)) : svg.y;
                        dispatch(setSvgValue({ index, value: { ...svg, x: newX, y: newY } }));
                    }
                })
            });
            // dispatch(setRefresh());
            // console.log('move ', graph.current.getNodeAttributes(node));
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
        // console.log('up ', graph.current.getNodeAttributes(node));
    });

    return (
        <svg
            id="rmp-style-gen-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            height={svgHeight * canvasScale}
            viewBox={`${-svgWidth / 2} ${-svgHeight / 2} ${svgWidth} ${svgHeight}`}
            colorInterpolationFilters="sRGB"
            style={{
                ['--rmg-svg-width' as any]: svgWidth + 'px',
                ['--rmg-svg-height' as any]: svgHeight + 'px',
                ['--rmg-theme-colour' as any]: color[2],
                ['--rmg-theme-fg' as any]: color[3],
            }}
            onPointerDown={handleBackgroundDown}
        >
            <rect
                id="canvas-bg"
                x={-svgWidth / 2}
                y={-svgHeight / 2}
                fill="white"
                style={{ height: 'var(--rmg-svg-height)', width: 'var(--rmg-svg-width)' }}
            />
            <rect id="canvas-x" x={-svgWidth / 2} y={-1} width={svgWidth} height={2} fill="black" />
            <rect id="canvas-y" x={-1} y={-svgHeight / 2} width={2} height={svgWidth} fill="black" />
            {param.svgs.map(s => {
                const { id, type, isCore, x, y, attrs } = s;
                const F = svgs[type].component;
                return (
                    <F
                        id={id}
                        key={id}
                        isCore={isCore}
                        attrs={attrs!}
                        x={x}
                        y={y}
                        handlePointerDown={handlePointerDown}
                        handlePointerMove={handlePointerMove}
                        handlePointerUp={handlePointerUp}
                        variable={getComponentValue(param.components)}
                    />
                );
            })}
            <rect
                id="canvas-border"
                fill="none"
                strokeWidth={3}
                stroke="none"
                style={{ height: 'var(--rmg-svg-height)', width: 'var(--rmg-svg-width)' }}
            />
        </svg>
    );
}