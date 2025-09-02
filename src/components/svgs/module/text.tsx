import { Svgs } from '../../../constants/svgs';
import { VariableFunction } from '../../../constants/variable-function';

const defaultTextSvgAttrs: Record<string, VariableFunction> = {
    _rmp_children_text: { type: 'value', value: 'Text' },
    opacity: { type: 'value', value: '1' },
    fill: { type: 'value', value: 'black' },
    className: { type: 'option', option: 'rmp-name__en' },
    textAnchor: { type: 'option', option: 'middle' },
    fontSize: { type: 'value', value: '12' },
};

const textIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">
            T
        </text>
    </svg>
);

const textSvgs: Svgs = {
    icon: textIcon,
    defaultAttrs: defaultTextSvgAttrs,
    displayName: 'Text',
};

export default textSvgs;
