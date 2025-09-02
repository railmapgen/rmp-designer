import { Svgs } from '../../../constants/svgs';
import { VariableFunction } from '../../../constants/variable-function';

const defaultPolygonSvgAttrs: Record<string, VariableFunction> = {
    points: { type: 'value', value: '8,6 16,6 20,13 16,20 8,20 4,13' },
    fill: { type: 'value', value: '#D6ABC1' },
};

const polygonIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <polygon points="8,6 16,6 20,13 16,20 8,20 4,13" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
);

const polygonSvgs: Svgs = {
    icon: polygonIcon,
    defaultAttrs: defaultPolygonSvgAttrs,
    displayName: 'Polygon',
};

export default polygonSvgs;
