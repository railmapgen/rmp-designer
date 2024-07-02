import { SvgsType } from '../../constants/svgs';
import rectSvgs from './rect';
import circleSvgs from './circle';
import pathSvgs from './path';
import textSvgs from './text';
import polygonSvgs from './polygon';
import anySvgs from './any';

const svgs = {
    [SvgsType.Rect]: rectSvgs,
    [SvgsType.Circle]: circleSvgs,
    [SvgsType.Polygon]: polygonSvgs,
    [SvgsType.Path]: pathSvgs,
    [SvgsType.Text]: textSvgs,
    [SvgsType.Any]: anySvgs,
};

export default svgs;
