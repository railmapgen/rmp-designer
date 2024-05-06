import React from "react";
import { useRootSelector } from "../redux";
import { SvgsAttrs, SvgsType } from "../constants/svgs";
import svgs from "./svgs/svgs";
import { getComponentValue } from "../util/parse";

export default function SvgWrapper() {
    const param = useRootSelector(store => store.param);
    const svgWidth = 500;
    const svgHeight = 500;
    const canvasScale = 1;
    const theme = ['', '', '#56dfed', '#000000'];

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
                ['--rmg-theme-colour' as any]: theme[2],
                ['--rmg-theme-fg' as any]: theme[3],
            }}
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
                        attrs={attrs}
                        x={x}
                        y={y}
                        handlePointerDown={() => {
                        }}
                        handlePointerMove={() => {
                        }}
                        handlePointerUp={() => {
                        }}
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