import React from 'react';
import { createLiteralAttrBinding } from '../../../constants/attr-binding';
import type { Svgs } from '../../../constants/svgs';

const defaultTextSvgAttrBindings = {
    _rmp_children_text: createLiteralAttrBinding('text'),
    opacity: createLiteralAttrBinding(1),
    fill: createLiteralAttrBinding('black'),
    className: createLiteralAttrBinding('rmp-name__en'),
    'text-anchor': createLiteralAttrBinding('middle'),
    'font-size': createLiteralAttrBinding(12),
} satisfies Svgs['defaultAttrBindings'];

const textIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">
            T
        </text>
    </svg>
);

const textSvgs: Svgs = {
    icon: textIcon,
    defaultAttrBindings: defaultTextSvgAttrBindings,
    displayName: 'Text',
};

export default textSvgs;
