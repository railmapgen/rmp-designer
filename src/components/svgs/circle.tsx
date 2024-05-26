import React from 'react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { AttrsProps, SvgsElem } from '../../constants/constants';
import { Svgs, SvgsAttrsType, SvgsComponentProps } from '../../constants/svgs';
import { calcFuncInBatch } from '../../util/parse';

export const Circle = (props: SvgsComponentProps<CircleSvgAttrs>) => {
    const { id, x, y, attrs, handlePointerDown, handlePointerMove, handlePointerUp, variable } = props;
    const {
        r = defaultCircleSvgAttrs.r,
        opacity = defaultCircleSvgAttrs.opacity,
        fill = defaultCircleSvgAttrs.fill,
        stroke = defaultCircleSvgAttrs.stroke,
        strokeWidth = defaultCircleSvgAttrs.strokeWidth,
    } = attrs ?? defaultCircleSvgAttrs;

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
    const [calR, calOpacity, calFill, calStroke, calStrokeWidth] = calcFuncInBatch(
        id,
        [r, opacity, fill, stroke, strokeWidth],
        ['x', 'y', ...variable.map(s => s.id)],
        [calX, calY, ...variable.map(s => s.value)],
        attrsType,
        ['number', 'number', ...variable.map(s => s.type)]
    );
    return (
        <circle
            id={id}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ cursor: 'move' }}
            cx={calX}
            cy={calY}
            r={calR}
            fill={calFill}
            opacity={calOpacity}
            stroke={calStroke}
            strokeWidth={calStrokeWidth}
        />
    );
};

export interface CircleSvgAttrs {
    r: string;
    opacity: string;
    fill: string;
    stroke: string;
    strokeWidth: string;
}

const attrsType: SvgsAttrsType[] = ['number', 'number', 'string', 'string', 'number'];

const defaultCircleSvgAttrs: CircleSvgAttrs = {
    r: '5',
    opacity: '1',
    fill: '"black"',
    stroke: '"none"',
    strokeWidth: '0',
};

const inputFromSvg = (elem: SVGElement) => {
    const attr: CircleSvgAttrs = {
        r: elem.getAttribute('r') ?? '0',
        opacity: elem.getAttribute('opacity') ?? '1',
        fill: `"${elem.getAttribute('fill') ?? 'black'}"`,
        stroke: `"${elem.getAttribute('stroke') ?? 'none'}"`,
        strokeWidth: elem.getAttribute('strokeWidth') ?? '0',
    };
    return attr;
};

const attrsComponent = (props: AttrsProps<CircleSvgAttrs>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const rectSvgAttrsField: RmgFieldsField[] = [
        {
            type: 'input',
            label: 'width',
            value: attrs.r,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, r: value });
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
            value: attrs.fill,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, fill: `${value}` });
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
    return <RmgFields fields={rectSvgAttrsField} minW="100px" />;
};

const circleIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <circle fill="currentColor" cx="12" cy="12" r="5" />
    </svg>
);

const outputString = (props: SvgsElem<CircleSvgAttrs>) => {
    const { x, y, attrs } = props;
    return `<circle id={\`\${id}\`} cx={${x}} cy={${y}} r={${attrs.r}} opacity={${attrs.opacity}} fill={${attrs.fill}} stroke={${attrs.stroke}} strokeWidth={${attrs.strokeWidth}} />\n`;
};

const circleSvgs: Svgs<CircleSvgAttrs> = {
    component: Circle,
    icon: circleIcon,
    attrsComponent,
    defaultAttrs: defaultCircleSvgAttrs,
    displayName: 'Circle',
    output: outputString,
    inputFromSvg,
};

export default circleSvgs;
