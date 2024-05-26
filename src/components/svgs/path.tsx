import React from 'react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { AttrsProps, SvgsElem } from '../../constants/constants';
import { Svgs, SvgsAttrsType, SvgsComponentProps } from '../../constants/svgs';
import { calcFuncInBatch } from '../../util/parse';
import { RectSvgAttrs } from './rect';

export const Path = (props: SvgsComponentProps<PathSvgAttrs>) => {
    const { id, x, y, attrs, handlePointerDown, handlePointerMove, handlePointerUp, variable } = props;
    const {
        d = defaultPathSvgAttrs.d,
        opacity = defaultPathSvgAttrs.opacity,
        fill = defaultPathSvgAttrs.fill,
        stroke = defaultPathSvgAttrs.stroke,
        strokeWidth = defaultPathSvgAttrs.strokeWidth,
        strokeLinecap = defaultPathSvgAttrs.strokeLinecap,
        strokeLinejoin = defaultPathSvgAttrs.strokeLinejoin,
    } = attrs ?? defaultPathSvgAttrs;

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerDown(id, e),
        [id, handlePointerDown]
    );
    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerMove(id, e),
        [id, handlePointerMove]
    );
    const onPointerUp = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerUp(id, e),
        [id, handlePointerUp]
    );

    const [calX, calY] = calcFuncInBatch(
        id,
        [x, y],
        variable.map(s => s.id),
        variable.map(s => s.value),
        ['number', 'number'],
        variable.map(s => s.type)
    );
    const [calD, calFill, calOpacity, calStroke, calStrokeWidth, calStrokeLinecap, calStrokeLinejoin] = calcFuncInBatch(
        id,
        [d, fill, opacity, stroke, strokeWidth, strokeLinecap, strokeLinejoin],
        ['x', 'y', ...variable.map(s => s.id)],
        [calX, calY, ...variable.map(s => s.value)],
        attrsType,
        ['number', 'number', ...variable.map(s => s.type)]
    );
    return (
        <g transform={`translate(${calX}, ${calY})`}>
            <path
                id={id}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ cursor: 'move' }}
                d={calD}
                fill={calFill}
                opacity={calOpacity}
                stroke={calStroke}
                strokeWidth={calStrokeWidth}
                strokeLinecap={calStrokeLinecap}
                strokeLinejoin={calStrokeLinejoin}
            />
        </g>
    );
};

export interface PathSvgAttrs {
    d: string;
    fill: string;
    opacity: string;
    stroke: string;
    strokeWidth: string;
    strokeLinecap: string;
    strokeLinejoin: string;
}

const attrsType: SvgsAttrsType[] = ['string', 'string', 'number', 'string', 'number', 'string', 'string'];

const defaultPathSvgAttrs: PathSvgAttrs = {
    d: '"M10 10"',
    fill: '"black"',
    opacity: '1',
    stroke: '"none"',
    strokeWidth: '0',
    strokeLinecap: '"none"',
    strokeLinejoin: '"none"',
};

const inputFromSvg = (elem: SVGElement) => {
    const attr: PathSvgAttrs = {
        d: `"${elem.getAttribute('d') ?? ''}"`,
        opacity: elem.getAttribute('opacity') ?? '1',
        fill: `"${elem.getAttribute('fill') ?? 'black'}"`,
        stroke: `"${elem.getAttribute('stroke') ?? 'none'}"`,
        strokeWidth: elem.getAttribute('strokeWidth') ?? '0',
        strokeLinecap: `"${elem.getAttribute('strokeLinecap') ?? 'none'}"`,
        strokeLinejoin: `"${elem.getAttribute('strokeLinejoin') ?? 'none'}"`,
    };
    return attr;
};

const attrsComponent = (props: AttrsProps<PathSvgAttrs>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const rectSvgAttrsField: RmgFieldsField[] = [
        {
            type: 'input',
            label: 'd',
            value: attrs.d,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, d: value });
            },
        },
        {
            type: 'input',
            label: 'fill',
            value: attrs.fill,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, fill: `${value}` });
            },
        },
        {
            type: 'input',
            label: 'opacity',
            value: attrs.opacity,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, opacity: value });
            },
        },
        {
            type: 'input',
            label: 'stroke',
            value: attrs.stroke,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, stroke: `${value}` });
            },
        },
        {
            type: 'input',
            label: 'stroke width',
            value: attrs.strokeWidth,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, strokeWidth: value });
            },
        },
    ];
    return <RmgFields fields={rectSvgAttrsField} />;
};

const pathIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect fill="currentColor" x="7" y="7" width="10" height="10" />
    </svg>
);

const outputString = (props: SvgsElem<PathSvgAttrs>) => {
    const { x, y, attrs } = props;
    return `<g transform={\`translate(\${${x}}, \${${y}})\`}><path id={\`\${id}\`}' d={${attrs.d}} opacity={${attrs.opacity}} fill={${attrs.fill}} stroke={${attrs.stroke}} strokeWidth={${attrs.strokeWidth}} strokeLinecap={${attrs.strokeLinecap}} strokeLinejoin={${attrs.strokeLinejoin}} /></g>\n`;
};

const pathSvgs: Svgs<PathSvgAttrs> = {
    component: Path,
    icon: pathIcon,
    attrsComponent,
    defaultAttrs: defaultPathSvgAttrs,
    displayName: 'Path',
    output: outputString,
    inputFromSvg,
};

export default pathSvgs;
