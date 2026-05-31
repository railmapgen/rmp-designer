import React from 'react';
import type { Svgs } from '../../../constants/svgs';

const defaultGSvgAttrBindings = {} satisfies Svgs['defaultAttrBindings'];

const gIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <g fill="currentColor">
            <circle cx="8" cy="12" r="3" />
            <rect x="12" y="9" width="6" height="6" />
        </g>
    </svg>
);

const gSvgs: Svgs = {
    icon: gIcon,
    defaultAttrBindings: defaultGSvgAttrBindings,
    displayName: 'Group',
};

export default gSvgs;
