import React from 'react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { AttrsProps, SvgsElem } from '../../constants/constants';
import { Svgs, SvgsComponentProps } from '../../constants/svgs';
import { calcFuncInBatch } from '../../util/parse';

export const Rect = (props: SvgsComponentProps<RectSvgAttrs>) => {
    const { id, x, y, attrs, handlePointerDown, handlePointerMove, handlePointerUp, variable } = props;
    const {
        width = defaultRectSvgAttrs.width,
        height = defaultRectSvgAttrs.height,
        rx = defaultRectSvgAttrs.rx,
        ry = defaultRectSvgAttrs.ry,
        opacity = defaultRectSvgAttrs.opacity,
        fill = defaultRectSvgAttrs.fill,
        stroke = defaultRectSvgAttrs.stroke,
    } = attrs ?? defaultRectSvgAttrs;

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
        [x, y],
        variable.map(s => s.id),
        variable.map(s => s.value),
        variable.map(s => s.type)
    );
    const [calWidth, calHeight, calRx, calRy, calOpacity, calFill, calStroke] = calcFuncInBatch(
        [width, height, rx, ry, opacity, fill, stroke],
        ['x', 'y', ...variable.map(s => s.id)],
        [calX, calY, ...variable.map(s => s.value)],
        ['number', 'number', ...variable.map(s => s.type)]
    );
    return (
        <rect
            id={id}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            x={calX}
            y={calY}
            width={calWidth}
            height={calHeight}
            rx={calRx}
            ry={calRy}
            fill={calFill}
            opacity={calOpacity}
            stroke={calStroke}
        />
    );
};

export interface RectSvgAttrs {
    width: string;
    height: string;
    rx: string;
    ry: string;
    opacity: string;
    fill: string;
    stroke: string;
}

const defaultRectSvgAttrs: RectSvgAttrs = {
    width: '10',
    height: '10',
    rx: '0',
    ry: '0',
    opacity: '1',
    fill: '"black"',
    stroke: '"none"',
};

const attrsComponent = (props: AttrsProps<RectSvgAttrs>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const rectSvgAttrsField: RmgFieldsField[] = [
        {
            type: 'input',
            label: 'width',
            value: attrs.width,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, width: value });
            },
        },
        {
            type: 'input',
            label: 'height',
            value: attrs.height,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, height: value });
            },
        },
        {
            type: 'input',
            label: 'rx',
            value: attrs.rx,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, rx: value });
            },
        },
        {
            type: 'input',
            label: 'ry',
            value: attrs.ry,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, ry: value });
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
            label: 'fill',
            value: attrs.fill.substring(1, attrs.fill.length - 1),
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, fill: `"${value}"` });
            },
        },
        {
            type: 'input',
            label: 'stroke',
            value: attrs.stroke.substring(1, attrs.stroke.length - 1),
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, stroke: `"${value}"` });
            },
        },
    ];
    return <RmgFields fields={rectSvgAttrsField} />;
};

const rectIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect fill="currentColor" x="7" y="7" width="10" height="10" />
    </svg>
);

const outputString = (props: SvgsElem<RectSvgAttrs>) => {
    const { isCore, x, y, attrs } = props;
    return `<rect ${isCore ? 'id={`${id}`}' : ''} x={${x}} y={${y}} width={${attrs.width}} height={${attrs.height}} rx={${attrs.rx}} ry={${attrs.ry}} opacity={${attrs.opacity}} fill={${attrs.fill}} stroke={${attrs.stroke}} />\n`;
};

const rectSvgs: Svgs<RectSvgAttrs> = {
    component: Rect,
    icon: rectIcon,
    attrsComponent,
    defaultAttrs: defaultRectSvgAttrs,
    displayName: 'Rectangle',
    output: outputString,
};

export default rectSvgs;
