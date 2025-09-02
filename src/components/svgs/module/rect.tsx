import { Svgs } from '../../../constants/svgs';
import { VariableFunction } from '../../../constants/variable-function';

const defaultRectSvgAttrs: Record<string, VariableFunction> = {
    width: { type: 'value', value: '20' },
    height: { type: 'value', value: '10' },
    rx: { type: 'value', value: '2' },
    ry: { type: 'value', value: '2' },
    opacity: { type: 'value', value: '1' },
    fill: { type: 'value', value: '#D6ABC1' },
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
