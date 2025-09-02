import { Svgs } from '../../../constants/svgs';
import { VariableFunction } from '../../../constants/variable-function';

const defaultCircleSvgAttrs: Record<string, VariableFunction> = {
    r: { type: 'value', value: '5' },
    opacity: { type: 'value', value: '1' },
    fill: { type: 'value', value: '#D6ABC1' },
    stroke: { type: 'value', value: 'none' },
    strokeWidth: { type: 'value', value: '0' },
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
