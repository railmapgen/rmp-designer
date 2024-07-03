import React from 'react';
import { Svgs } from '../../../constants/svgs';

const defaultAnySvgAttrs: Record<string, string> = {};

const anyIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">
            {'<>'}
        </text>
    </svg>
);

const anySvgs: Svgs = {
    icon: anyIcon,
    defaultAttrs: defaultAnySvgAttrs,
    displayName: 'Any',
};

export default anySvgs;
