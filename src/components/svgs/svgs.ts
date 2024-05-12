import { SvgsType } from '../../constants/svgs';
import rectSvgs from './rect';
import pathSvgs from './path';
import circleSvgs from './circle';

const svgs = {
    [SvgsType.Rect]: rectSvgs,
    [SvgsType.Path]: pathSvgs,
    [SvgsType.Circle]: circleSvgs,
};

export default svgs;
