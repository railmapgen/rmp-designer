import React from 'react';
import { Svgs } from '../../../constants/svgs';

const defaultRectSvgAttrs: Record<string, string> = {
    width: '1"10"',
    height: '1"10"',
    rx: '1"0"',
    ry: '1"0"',
    opacity: '1"1"',
    fill: '1"black"',
};

const rectIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect fill="none" stroke="currentColor" strokeWidth="1.3" x="6" y="7.5" width="12" height="10" rx="2" />
    </svg>
);

const rectSvgs: Svgs = {
    icon: rectIcon,
    defaultAttrs: defaultRectSvgAttrs,
    displayName: 'Rectangle',
};

export default rectSvgs;
