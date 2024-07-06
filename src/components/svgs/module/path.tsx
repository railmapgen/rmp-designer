import React from 'react';
import { Svgs } from '../../../constants/svgs';

const defaultPathSvgAttrs: Record<string, string> = {
    d: '1"M10 10"',
};

const pathIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect x="6" y="11" width="12" height="2" rx={1} fill="currentColor" />
    </svg>
);

const pathSvgs: Svgs = {
    icon: pathIcon,
    defaultAttrs: defaultPathSvgAttrs,
    displayName: 'Path',
};

export default pathSvgs;
