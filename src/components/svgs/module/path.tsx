import { Svgs } from '../../../constants/svgs';
import { VariableFunction } from '../../../constants/variable-function';

const defaultPathSvgAttrs: Record<string, VariableFunction> = {
    d: { type: 'value', value: 'M 0 5 L 20 5' },
    stroke: { type: 'value', value: '#D6ABC1' },
    strokeWidth: { type: 'value', value: '5' },
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
