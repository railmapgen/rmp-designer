import React from 'react';
import { Svgs } from '../../constants/svgs';

const defaultPathSvgAttrs: Record<string, string> = {
    d: '"M10 10"',
};

const pathIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect fill="currentColor" x="7" y="7" width="10" height="10" />
    </svg>
);

const pathSvgs: Svgs = {
    icon: pathIcon,
    defaultAttrs: defaultPathSvgAttrs,
    displayName: 'Path',
};

export default pathSvgs;
