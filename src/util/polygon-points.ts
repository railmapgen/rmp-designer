export interface Point {
    x: number;
    y: number;
}

export interface PolygonPoint extends Point {
    id: string;
}

const numberTokenPattern = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const parsePointNumbers = (value: unknown): number[] | undefined => {
    if (typeof value !== 'string') return undefined;
    const input = value.trim();
    if (!input) return undefined;

    const leftover = input.replace(numberTokenPattern, '').replace(/[,\s]+/g, '');
    if (leftover) return undefined;

    const numbers = input.match(numberTokenPattern)?.map(Number) ?? [];
    if (numbers.length < 2 || numbers.length % 2 !== 0 || numbers.some(number => !Number.isFinite(number))) {
        return undefined;
    }
    return numbers;
};

export const isSvgPointsValue = (value: unknown): value is string => parsePointNumbers(value) !== undefined;

const formatNumber = (value: number): string => {
    const rounded = Math.round(value * 1000) / 1000;
    return Object.is(rounded, -0) ? '0' : String(rounded);
};

const normalizePolygonPoints = (points: Point[]): PolygonPoint[] =>
    points
        .filter(point => isFiniteNumber(point.x) && isFiniteNumber(point.y))
        .map((point, index) => ({ id: String(index), x: point.x, y: point.y }));

const distanceToSegment = (point: Point, start: Point, end: Point): { distance: number } => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return { distance: Math.hypot(point.x - start.x, point.y - start.y) };

    const rawT = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    const t = Math.min(1, Math.max(0, rawT));
    const projected = { x: start.x + dx * t, y: start.y + dy * t };
    return { distance: Math.hypot(point.x - projected.x, point.y - projected.y) };
};

export const parsePolygonPoints = (value: unknown): PolygonPoint[] | undefined => {
    const numbers = parsePointNumbers(value);
    if (!numbers || numbers.length < 6) return undefined;

    const points: Point[] = [];
    for (let i = 0; i < numbers.length; i += 2) {
        points.push({ x: numbers[i], y: numbers[i + 1] });
    }

    return normalizePolygonPoints(points);
};

export const serializePolygonPoints = (points: Point[]): string =>
    points.map(point => `${formatNumber(point.x)},${formatNumber(point.y)}`).join(' ');

export const movePolygonPoint = (points: PolygonPoint[], pointId: string, point: Point): PolygonPoint[] =>
    normalizePolygonPoints(points.map(item => (item.id === pointId ? { ...item, x: point.x, y: point.y } : item)));

export const removePolygonPoint = (points: PolygonPoint[], pointId: string): PolygonPoint[] =>
    points.length <= 3 ? points : normalizePolygonPoints(points.filter(point => point.id !== pointId));

export const insertPolygonPointAtNearestSegment = (
    points: PolygonPoint[],
    point: Point
): { points: PolygonPoint[]; id: string } => {
    let bestDistance = Number.POSITIVE_INFINITY;
    let insertIndex = points.length;

    for (let i = 0; i < points.length; i += 1) {
        const start = points[i];
        const end = points[(i + 1) % points.length];
        const projection = distanceToSegment(point, start, end);
        if (projection.distance < bestDistance) {
            bestDistance = projection.distance;
            insertIndex = i + 1;
        }
    }

    const normalized = normalizePolygonPoints([...points.slice(0, insertIndex), point, ...points.slice(insertIndex)]);
    return { points: normalized, id: String(insertIndex) };
};
