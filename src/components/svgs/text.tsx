import React from 'react';
import { Svgs } from '../../constants/svgs';

const defaultTextSvgAttrs: Record<string, string> = {
    _rmp_children_text: '"text"',
    opacity: '1',
    fill: '"black"',
    className: '"rmp-name__en"',
    textAnchor: '"middle"',
    fontSize: '12',
};

const textIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">
            T
        </text>
    </svg>
);

const textSvgs: Svgs = {
    icon: textIcon,
    defaultAttrs: defaultTextSvgAttrs,
    displayName: 'Text',
};

export default textSvgs;
