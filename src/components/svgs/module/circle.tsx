import React from 'react';
import { Svgs } from '../../../constants/svgs';

const defaultCircleSvgAttrs: Record<string, string> = {
    r: '1"5"',
    opacity: '1"1"',
    fill: '1"#D6ABC1"',
    stroke: '1"none"',
    strokeWidth: '1"0"',
};

const circleIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <circle fill="none" stroke="currentColor" strokeWidth="1.3" cx="12" cy="12" r="6.5" />
    </svg>
);

const circleSvgs: Svgs = {
    icon: circleIcon,
    defaultAttrs: defaultCircleSvgAttrs,
    displayName: 'Circle',
};

export default circleSvgs;
