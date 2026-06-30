import type { AttrBinding } from '../constants/attr-binding';
import type { SvgsElem } from '../constants/constants';

export const SMOOTH_PATH_DATA_ATTR = 'data-rmp-smooth-path';

export type SmoothPathStartCap = 'round' | 'flat';
export type SmoothPathEndCap = 'round' | 'flat' | 'arrow';

export interface SmoothPathPoint {
    id: string;
    x: number;
    y: number;
}

export interface SmoothPathWidthStop {
    id: string;
    t: number;
    width: number;
}

export interface SmoothPathModel {
    version: 1;
    kind: 'open';
    points: SmoothPathPoint[];
    widthStops: SmoothPathWidthStop[];
    smoothing: number;
    startCap: SmoothPathStartCap;
    endCap: SmoothPathEndCap;
    arrow?: {
        length: number;
        width: number;
    };
}

export interface SmoothPathCreateResult {
    model: SmoothPathModel;
    origin: Point;
}

export interface Point {
    x: number;
    y: number;
}

interface SmoothPathCreateOptions {
    minPointDistance?: number;
    simplifyTolerance?: number;
    defaultWidth?: number;
    origin?: Point;
}

const MIN_PATH_LENGTH = 4;
const MIN_WIDTH = 0.5;
const DEFAULT_WIDTH = 8;
const DEFAULT_SMOOTHING = 0.65;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const formatNumber = (value: number): string => {
    const rounded = Math.round(value * 1000) / 1000;
    return Object.is(rounded, -0) ? '0' : String(rounded);
};

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (point: Point, factor: number): Point => ({ x: point.x * factor, y: point.y * factor });
const lerp = (a: Point, b: Point, t: number): Point => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
});

const normalize = (point: Point): Point => {
    const length = Math.hypot(point.x, point.y);
    return length > 0 ? { x: point.x / length, y: point.y / length } : { x: 1, y: 0 };
};

const normalForTangent = (tangent: Point): Point => ({ x: -tangent.y, y: tangent.x });

const literalAttr = (value: string | number): string => `1${JSON.stringify(String(value))}`;

const distanceToSegment = (point: Point, start: Point, end: Point): { distance: number; point: Point; t: number } => {
    const segment = subtract(end, start);
    const lengthSquared = segment.x * segment.x + segment.y * segment.y;
    if (lengthSquared === 0) return { distance: distance(point, start), point: start, t: 0 };

    const t = clamp(((point.x - start.x) * segment.x + (point.y - start.y) * segment.y) / lengthSquared, 0, 1);
    const projected = add(start, scale(segment, t));
    return { distance: distance(point, projected), point: projected, t };
};

const polylineLength = (points: Point[]): number =>
    points.reduce((total, point, index) => (index === 0 ? 0 : total + distance(points[index - 1], point)), 0);

const perpendicularDistance = (point: Point, start: Point, end: Point): number =>
    distanceToSegment(point, start, end).distance;

const rdpSimplify = (points: Point[], tolerance: number): Point[] => {
    if (points.length <= 2 || tolerance <= 0) return points;

    let maxDistance = 0;
    let index = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i += 1) {
        const pointDistance = perpendicularDistance(points[i], start, end);
        if (pointDistance > maxDistance) {
            maxDistance = pointDistance;
            index = i;
        }
    }

    if (maxDistance <= tolerance) return [start, end];

    const before = rdpSimplify(points.slice(0, index + 1), tolerance);
    const after = rdpSimplify(points.slice(index), tolerance);
    return before.slice(0, -1).concat(after);
};

const normalizeInputPoints = (points: Point[], minPointDistance: number, simplifyTolerance: number): Point[] => {
    const finitePoints = points.filter(point => isFiniteNumber(point.x) && isFiniteNumber(point.y));
    if (finitePoints.length < 2) return [];

    const filtered = finitePoints.reduce<Point[]>((acc, point) => {
        const previous = acc[acc.length - 1];
        if (!previous || distance(previous, point) >= minPointDistance) acc.push(point);
        return acc;
    }, []);

    if (filtered.length >= 2 && distance(filtered[filtered.length - 1], finitePoints[finitePoints.length - 1]) > 0) {
        filtered.push(finitePoints[finitePoints.length - 1]);
    }

    const simplified = rdpSimplify(filtered, simplifyTolerance);
    return polylineLength(simplified) >= MIN_PATH_LENGTH ? simplified : [];
};

const normalizeWidthStops = (widthStops: SmoothPathWidthStop[] | undefined, fallbackWidth = DEFAULT_WIDTH) => {
    const safeStops = (widthStops ?? [])
        .filter(stop => isFiniteNumber(stop.t) && isFiniteNumber(stop.width))
        .map((stop, index) => ({
            id: stop.id || `width_${index}`,
            t: clamp(stop.t, 0, 1),
            width: Math.max(MIN_WIDTH, stop.width),
        }))
        .sort((a, b) => a.t - b.t);

    return safeStops.length > 0
        ? safeStops
        : [
              { id: 'width_start', t: 0, width: fallbackWidth * 0.7 },
              { id: 'width_mid', t: 0.5, width: fallbackWidth * 1.35 },
              { id: 'width_end', t: 1, width: fallbackWidth },
          ];
};

export const getWidthAtT = (model: SmoothPathModel, t: number): number => {
    const stops = normalizeWidthStops(model.widthStops);
    const safeT = clamp(t, 0, 1);
    if (safeT <= stops[0].t) return stops[0].width;
    if (safeT >= stops[stops.length - 1].t) return stops[stops.length - 1].width;

    for (let i = 0; i < stops.length - 1; i += 1) {
        const start = stops[i];
        const end = stops[i + 1];
        if (safeT >= start.t && safeT <= end.t) {
            const span = Math.max(0.0001, end.t - start.t);
            return start.width + (end.width - start.width) * ((safeT - start.t) / span);
        }
    }

    return stops[stops.length - 1].width;
};

export const normalizeSmoothPathModel = (value: unknown): SmoothPathModel | undefined => {
    if (!value || typeof value !== 'object') return undefined;
    const candidate = value as Partial<SmoothPathModel>;
    const points = Array.isArray(candidate.points)
        ? candidate.points
              .filter(point => isFiniteNumber(point.x) && isFiniteNumber(point.y))
              .map((point, index) => ({
                  id: point.id || `point_${index}`,
                  x: point.x,
                  y: point.y,
              }))
        : [];

    if (points.length < 2 || polylineLength(points) < MIN_PATH_LENGTH) return undefined;

    const endCap =
        candidate.endCap === 'flat' || candidate.endCap === 'arrow' || candidate.endCap === 'round'
            ? candidate.endCap
            : 'round';
    const startCap = candidate.startCap === 'flat' || candidate.startCap === 'round' ? candidate.startCap : 'round';
    const smoothing = isFiniteNumber(candidate.smoothing) ? clamp(candidate.smoothing, 0, 1) : DEFAULT_SMOOTHING;
    const widthStops = normalizeWidthStops(candidate.widthStops);
    const endWidth = widthStops[widthStops.length - 1]?.width ?? DEFAULT_WIDTH;

    return {
        version: 1,
        kind: 'open',
        points,
        widthStops,
        smoothing,
        startCap,
        endCap,
        arrow: {
            length: Math.max(MIN_WIDTH, candidate.arrow?.length ?? endWidth * 2.4),
            width: Math.max(MIN_WIDTH, candidate.arrow?.width ?? endWidth * 2),
        },
    };
};

export const parseSmoothPathModel = (value: unknown): SmoothPathModel | undefined => {
    if (typeof value === 'string') {
        try {
            return normalizeSmoothPathModel(JSON.parse(value));
        } catch {
            return undefined;
        }
    }
    return normalizeSmoothPathModel(value);
};

export const serializeSmoothPathModel = (model: SmoothPathModel): string =>
    JSON.stringify(normalizeSmoothPathModel(model));

export const createSmoothPathModel = (
    inputPoints: Point[],
    createId: () => string,
    options: SmoothPathCreateOptions = {}
): SmoothPathCreateResult | undefined => {
    const normalized = normalizeInputPoints(inputPoints, options.minPointDistance ?? 2, options.simplifyTolerance ?? 1);
    if (normalized.length < 2) return undefined;

    const origin = options.origin ?? normalized[0];
    const defaultWidth = options.defaultWidth ?? DEFAULT_WIDTH;
    const points = normalized.map(point => ({
        id: createId(),
        x: point.x - origin.x,
        y: point.y - origin.y,
    }));

    const model = normalizeSmoothPathModel({
        version: 1,
        kind: 'open',
        points,
        widthStops: normalizeWidthStops(undefined, defaultWidth).map(stop => ({ ...stop, id: createId() })),
        smoothing: DEFAULT_SMOOTHING,
        startCap: 'round',
        endCap: 'round',
        arrow: { length: defaultWidth * 2.4, width: defaultWidth * 2 },
    });

    return model ? { model, origin } : undefined;
};

const catmullRomPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
        x:
            0.5 *
            (2 * p1.x +
                (-p0.x + p2.x) * t +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
            0.5 *
            (2 * p1.y +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
};

export const getSmoothCenterline = (model: SmoothPathModel): Point[] => {
    const safeModel = normalizeSmoothPathModel(model);
    if (!safeModel) return [];

    const { points, smoothing } = safeModel;
    const output: Point[] = [];

    for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        const steps = clamp(Math.ceil(distance(p1, p2) / 8), 8, 28);

        for (let step = 0; step <= steps; step += 1) {
            if (i > 0 && step === 0) continue;
            const t = step / steps;
            const linear = lerp(p1, p2, t);
            const curved = catmullRomPoint(p0, p1, p2, p3, t);
            output.push(lerp(linear, curved, smoothing));
        }
    }

    return output;
};

const getPolylineMetrics = (points: Point[]) => {
    const cumulative: number[] = [0];
    for (let i = 1; i < points.length; i += 1) {
        cumulative[i] = cumulative[i - 1] + distance(points[i - 1], points[i]);
    }
    return { cumulative, total: cumulative[cumulative.length - 1] ?? 0 };
};

const pointAtDistance = (points: Point[], targetDistance: number): Point => {
    const metrics = getPolylineMetrics(points);
    const safeDistance = clamp(targetDistance, 0, metrics.total);
    if (metrics.total === 0) return points[0] ?? { x: 0, y: 0 };

    for (let i = 0; i < points.length - 1; i += 1) {
        const startDistance = metrics.cumulative[i];
        const endDistance = metrics.cumulative[i + 1];
        if (safeDistance >= startDistance && safeDistance <= endDistance) {
            const segmentLength = Math.max(0.0001, endDistance - startDistance);
            return lerp(points[i], points[i + 1], (safeDistance - startDistance) / segmentLength);
        }
    }

    return points[points.length - 1];
};

const tangentAtDistance = (points: Point[], targetDistance: number): Point => {
    const metrics = getPolylineMetrics(points);
    const delta = Math.max(0.1, Math.min(4, metrics.total / 50));
    const before = pointAtDistance(points, targetDistance - delta);
    const after = pointAtDistance(points, targetDistance + delta);
    return normalize(subtract(after, before));
};

const trimPolylineAtDistance = (points: Point[], targetDistance: number): Point[] => {
    const metrics = getPolylineMetrics(points);
    const safeDistance = clamp(targetDistance, 0, metrics.total);
    const output: Point[] = [points[0]];

    for (let i = 1; i < points.length; i += 1) {
        if (metrics.cumulative[i] < safeDistance) {
            output.push(points[i]);
        } else {
            output.push(pointAtDistance(points, safeDistance));
            break;
        }
    }

    return output.length >= 2 ? output : [points[0], pointAtDistance(points, safeDistance)];
};

export const getPointAtT = (model: SmoothPathModel, t: number): Point => {
    const centerline = getSmoothCenterline(model);
    const metrics = getPolylineMetrics(centerline);
    return pointAtDistance(centerline, metrics.total * clamp(t, 0, 1));
};

export const getNearestCenterlineT = (model: SmoothPathModel, point: Point): number => {
    const centerline = getSmoothCenterline(model);
    const metrics = getPolylineMetrics(centerline);
    if (metrics.total === 0) return 0;

    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPathDistance = 0;

    for (let i = 0; i < centerline.length - 1; i += 1) {
        const projection = distanceToSegment(point, centerline[i], centerline[i + 1]);
        if (projection.distance < bestDistance) {
            bestDistance = projection.distance;
            bestPathDistance = metrics.cumulative[i] + distance(centerline[i], centerline[i + 1]) * projection.t;
        }
    }

    return clamp(bestPathDistance / metrics.total, 0, 1);
};

export const getSmoothPathCenterlineD = (model: SmoothPathModel): string => {
    const centerline = getSmoothCenterline(model);
    if (centerline.length < 2) return '';
    return centerline
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${formatNumber(point.x)} ${formatNumber(point.y)}`)
        .join(' ');
};

export const getWidthStopGeometry = (model: SmoothPathModel, stopId: string) => {
    const stop = model.widthStops.find(item => item.id === stopId);
    if (!stop) return undefined;

    const centerline = getSmoothCenterline(model);
    const metrics = getPolylineMetrics(centerline);
    const pathDistance = metrics.total * clamp(stop.t, 0, 1);
    const center = pointAtDistance(centerline, pathDistance);
    const normal = normalForTangent(tangentAtDistance(centerline, pathDistance));
    const width = Math.max(MIN_WIDTH, stop.width);

    return {
        center,
        normal,
        width,
        start: add(center, scale(normal, width / 2)),
        end: add(center, scale(normal, -width / 2)),
    };
};

export const insertControlPointAtNearestSegment = (
    model: SmoothPathModel,
    point: Point,
    createId: () => string
): SmoothPathModel => {
    let bestDistance = Number.POSITIVE_INFINITY;
    let insertIndex = 1;

    for (let i = 0; i < model.points.length - 1; i += 1) {
        const projection = distanceToSegment(point, model.points[i], model.points[i + 1]);
        if (projection.distance < bestDistance) {
            bestDistance = projection.distance;
            insertIndex = i + 1;
        }
    }

    return {
        ...model,
        points: [
            ...model.points.slice(0, insertIndex),
            { id: createId(), x: point.x, y: point.y },
            ...model.points.slice(insertIndex),
        ],
    };
};

export const moveControlPoint = (model: SmoothPathModel, pointId: string, point: Point): SmoothPathModel => ({
    ...model,
    points: model.points.map(item => (item.id === pointId ? { ...item, x: point.x, y: point.y } : item)),
});

export const removeControlPoint = (model: SmoothPathModel, pointId: string): SmoothPathModel =>
    model.points.length <= 2 ? model : { ...model, points: model.points.filter(point => point.id !== pointId) };

export const moveWidthStop = (model: SmoothPathModel, stopId: string, t: number): SmoothPathModel => ({
    ...model,
    widthStops: normalizeWidthStops(
        model.widthStops.map(stop => (stop.id === stopId ? { ...stop, t: clamp(t, 0, 1) } : stop))
    ),
});

export const resizeWidthStop = (model: SmoothPathModel, stopId: string, width: number): SmoothPathModel => ({
    ...model,
    widthStops: normalizeWidthStops(
        model.widthStops.map(stop => (stop.id === stopId ? { ...stop, width: Math.max(MIN_WIDTH, width) } : stop))
    ),
});

export const addWidthStop = (model: SmoothPathModel, createId: () => string, t = 0.5): SmoothPathModel => ({
    ...model,
    widthStops: normalizeWidthStops([
        ...model.widthStops,
        { id: createId(), t: clamp(t, 0, 1), width: getWidthAtT(model, t) },
    ]),
});

export const removeWidthStop = (model: SmoothPathModel, stopId: string): SmoothPathModel =>
    model.widthStops.length <= 1
        ? model
        : { ...model, widthStops: normalizeWidthStops(model.widthStops.filter(stop => stop.id !== stopId)) };

export const generateSmoothPathD = (model: SmoothPathModel): string => {
    const safeModel = normalizeSmoothPathModel(model);
    if (!safeModel) return '';

    const centerline = getSmoothCenterline(safeModel);
    const fullMetrics = getPolylineMetrics(centerline);
    if (centerline.length < 2 || fullMetrics.total < MIN_PATH_LENGTH) return '';

    const usesArrow = safeModel.endCap === 'arrow';
    const arrowLength = usesArrow
        ? clamp(safeModel.arrow?.length ?? DEFAULT_WIDTH * 2.4, MIN_WIDTH, fullMetrics.total * 0.75)
        : 0;
    const bodyEndDistance = usesArrow ? fullMetrics.total - arrowLength : fullMetrics.total;
    const bodyLine = usesArrow ? trimPolylineAtDistance(centerline, bodyEndDistance) : centerline;
    const bodyMetrics = getPolylineMetrics(bodyLine);
    if (bodyLine.length < 2 || bodyMetrics.total <= 0) return '';

    const edges = bodyLine.map((point, index) => {
        const previous = bodyLine[Math.max(0, index - 1)];
        const next = bodyLine[Math.min(bodyLine.length - 1, index + 1)];
        const tangent = normalize(subtract(next, previous));
        const normal = normalForTangent(tangent);
        const t = fullMetrics.total > 0 ? clamp(bodyMetrics.cumulative[index] / fullMetrics.total, 0, 1) : 0;
        const halfWidth = getWidthAtT(safeModel, t) / 2;
        return {
            point,
            normal,
            width: halfWidth * 2,
            left: add(point, scale(normal, halfWidth)),
            right: add(point, scale(normal, -halfWidth)),
        };
    });

    const commandFor = (prefix: 'M' | 'L', point: Point) =>
        `${prefix} ${formatNumber(point.x)} ${formatNumber(point.y)}`;
    const commands: string[] = [commandFor('M', edges[0].left)];

    edges.slice(1).forEach(edge => commands.push(commandFor('L', edge.left)));

    if (usesArrow) {
        const base = pointAtDistance(centerline, bodyEndDistance);
        const tip = centerline[centerline.length - 1];
        const endNormal = normalForTangent(tangentAtDistance(centerline, bodyEndDistance));
        const arrowHalfWidth = Math.max(MIN_WIDTH, safeModel.arrow?.width ?? DEFAULT_WIDTH * 2) / 2;
        const baseLeft = add(base, scale(endNormal, arrowHalfWidth));
        const baseRight = add(base, scale(endNormal, -arrowHalfWidth));
        commands.push(commandFor('L', baseLeft));
        commands.push(commandFor('L', tip));
        commands.push(commandFor('L', baseRight));
        commands.push(commandFor('L', edges[edges.length - 1].right));
    } else if (safeModel.endCap === 'round') {
        const end = edges[edges.length - 1];
        const radius = Math.max(MIN_WIDTH, end.width / 2);
        commands.push(
            `A ${formatNumber(radius)} ${formatNumber(radius)} 0 0 0 ${formatNumber(end.right.x)} ${formatNumber(
                end.right.y
            )}`
        );
    } else {
        commands.push(commandFor('L', edges[edges.length - 1].right));
    }

    for (let i = edges.length - 2; i >= 0; i -= 1) {
        commands.push(commandFor('L', edges[i].right));
    }

    if (safeModel.startCap === 'round') {
        const start = edges[0];
        const radius = Math.max(MIN_WIDTH, start.width / 2);
        commands.push(
            `A ${formatNumber(radius)} ${formatNumber(radius)} 0 0 0 ${formatNumber(start.left.x)} ${formatNumber(
                start.left.y
            )}`
        );
    } else {
        commands.push(commandFor('L', edges[0].left));
    }

    commands.push('Z');
    return commands.join(' ');
};

export const getSmoothPathAttrPatch = (
    model: SmoothPathModel
): { attrs: Record<string, string>; attrBindings: Record<string, AttrBinding> } => {
    const safeModel = normalizeSmoothPathModel(model);
    const d = safeModel ? generateSmoothPathD(safeModel) : '';
    const serialized = safeModel ? serializeSmoothPathModel(safeModel) : '';

    return {
        attrs: {
            d: literalAttr(d),
            [SMOOTH_PATH_DATA_ATTR]: literalAttr(serialized),
        },
        attrBindings: {
            d: { kind: 'literal', value: d },
            [SMOOTH_PATH_DATA_ATTR]: { kind: 'literal', value: serialized },
        },
    };
};

export const applySmoothPathModelToSvgElem = (elem: SvgsElem, model: SmoothPathModel): SvgsElem => {
    const patch = getSmoothPathAttrPatch(model);
    return {
        ...elem,
        attrs: { ...elem.attrs, ...patch.attrs },
        attrBindings: { ...(elem.attrBindings ?? {}), ...patch.attrBindings },
    };
};
