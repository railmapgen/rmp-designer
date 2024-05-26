import React from 'react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { AttrsProps, SvgsElem } from '../../constants/constants';
import { Svgs, SvgsAttrsType, SvgsComponentProps } from '../../constants/svgs';
import { calcFuncInBatch } from '../../util/parse';

export const Text = (props: SvgsComponentProps<TextSvgAttrs>) => {
    const { id, x, y, attrs, handlePointerDown, handlePointerMove, handlePointerUp, variable } = props;
    const {
        children = defaultTextSvgAttrs.children,
        opacity = defaultTextSvgAttrs.opacity,
        fill = defaultTextSvgAttrs.fill,
        className = defaultTextSvgAttrs.className,
        textAnchor = defaultTextSvgAttrs.textAnchor,
        writingMode = defaultTextSvgAttrs.writingMode,
        fontSize = defaultTextSvgAttrs.fontSize,
        fontFamily = defaultTextSvgAttrs.fontFamily,
        fontWeight = defaultTextSvgAttrs.fontWeight,
        dominantBaseline = defaultTextSvgAttrs.dominantBaseline,
    } = attrs ?? defaultTextSvgAttrs;

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
    const [
        calChild,
        calOpacity,
        calFill,
        calClass,
        calTextAnc,
        calWrite,
        calFontSize,
        calFontFamily,
        calFontWeight,
        calDominantBaseLine,
    ] = calcFuncInBatch(
        id,
        [
            children,
            opacity,
            fill,
            className,
            textAnchor,
            writingMode,
            fontSize,
            fontFamily,
            fontWeight,
            dominantBaseline,
        ],
        ['x', 'y', ...variable.map(s => s.id)],
        [calX, calY, ...variable.map(s => s.value)],
        attrsType,
        ['number', 'number', ...variable.map(s => s.type)]
    );
    return (
        <text
            id={id}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ cursor: 'move' }}
            x={calX}
            y={calY}
            fill={calFill}
            opacity={calOpacity}
            className={calClass}
            textAnchor={calTextAnc}
            writingMode={calWrite}
            fontSize={calFontSize}
            fontFamily={calFontFamily}
            fontWeight={calFontWeight}
            dominantBaseline={calDominantBaseLine}
        >
            {calChild}
        </text>
    );
};

export interface TextSvgAttrs {
    children: string;
    opacity: string;
    fill: string;
    className: string;
    textAnchor: string;
    writingMode: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    dominantBaseline: string;
}

const attrsType: SvgsAttrsType[] = [
    'string',
    'number',
    'string',
    'string',
    'string',
    'string',
    'number',
    'string',
    'string',
    'string',
];

const defaultTextSvgAttrs: TextSvgAttrs = {
    children: '"text"',
    opacity: '1',
    fill: '"black"',
    className: '"rmp-name__en"',
    textAnchor: '"middle"',
    writingMode: '"none"',
    fontSize: '12',
    fontFamily: '"none"',
    fontWeight: '"none"',
    dominantBaseline: '"none"',
};

const inputFromSvg = (elem: SVGElement) => {
    console.log(elem);
    const attr: TextSvgAttrs = {
        children: `"${elem.textContent ?? 'text'}"`,
        opacity: elem.getAttribute('opacity') ?? '1',
        fill: `"${elem.getAttribute('fill') ?? 'black'}"`,
        className: `"${elem.getAttribute('className') ?? 'rmp-name__en'}"`,
        textAnchor: `"${elem.getAttribute('textAnchor') ?? 'middle'}"`,
        writingMode: `"${elem.getAttribute('writingMode') ?? 'none'}"`,
        fontSize: elem.getAttribute('fontSize') ?? '12',
        fontFamily: `"${elem.getAttribute('fontFamily') ?? 'none'}"`,
        fontWeight: `"${elem.getAttribute('fontWeight') ?? 'none'}"`,
        dominantBaseline: `"${elem.getAttribute('dominantBaseLine') ?? 'none'}"`,
    };
    return attr;
};

const attrsComponent = (props: AttrsProps<TextSvgAttrs>) => {
    const { id, attrs, handleAttrsUpdate } = props;
    const textSvgAttrsField: RmgFieldsField[] = [
        {
            type: 'input',
            label: 'text',
            value: attrs.children,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, children: value });
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
            label: 'class name',
            value: attrs.className,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, className: `${value}` });
            },
        },
        {
            type: 'input',
            label: 'stroke width',
            value: attrs.textAnchor,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, textAnchor: value });
            },
        },
        {
            type: 'input',
            label: 'writing mode',
            value: attrs.writingMode,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, writingMode: value });
            },
        },
        {
            type: 'input',
            label: 'font size',
            value: attrs.fontSize,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, fontSize: value });
            },
        },
        {
            type: 'input',
            label: 'font family',
            value: attrs.fontFamily,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, fontFamily: value });
            },
        },
        {
            type: 'input',
            label: 'font weight',
            value: attrs.fontWeight,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, fontWeight: value });
            },
        },
        {
            type: 'input',
            label: 'dominant base line',
            value: attrs.dominantBaseline,
            onChange: value => {
                handleAttrsUpdate(id, { ...attrs, dominantBaseline: value });
            },
        },
    ];
    return <RmgFields fields={textSvgAttrsField} minW="100px" />;
};

const textIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">
            T
        </text>
    </svg>
);

const outputString = (props: SvgsElem<TextSvgAttrs>) => {
    const { x, y, attrs } = props;
    return '';
};

const textSvgs: Svgs<TextSvgAttrs> = {
    component: Text,
    icon: textIcon,
    attrsComponent,
    defaultAttrs: defaultTextSvgAttrs,
    displayName: 'Text',
    output: outputString,
    inputFromSvg,
};

export default textSvgs;
