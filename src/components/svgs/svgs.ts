import { SvgsType } from '../../constants/svgs';
import rectSvgs from './rect';
import circleSvgs from './circle';
import pathSvgs from './path';
import textSvgs from './text';

const svgs = {
    [SvgsType.Rect]: rectSvgs,
    [SvgsType.Circle]: circleSvgs,
    [SvgsType.Path]: pathSvgs,
    [SvgsType.Text]: textSvgs,
};

export default svgs;
