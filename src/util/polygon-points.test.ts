import {
    isSvgPointsValue,
    insertPolygonPointAtNearestSegment,
    movePolygonPoint,
    parsePolygonPoints,
    removePolygonPoint,
    serializePolygonPoints,
} from './polygon-points';

describe('polygon points geometry', () => {
    it('parses common SVG points syntax and serializes normalized points', () => {
        const points = parsePolygonPoints('0,0 20 0 20,10 0 10');

        expect(points).toEqual([
            { id: '0', x: 0, y: 0 },
            { id: '1', x: 20, y: 0 },
            { id: '2', x: 20, y: 10 },
            { id: '3', x: 0, y: 10 },
        ]);
        expect(serializePolygonPoints(points!)).toEqual('0,0 20,0 20,10 0,10');
    });

    it.each(['-3,8 3,0 3,0 3,8 0,-1', '-3,8 3,0 3,0 3,8 -1,0', '-3.5,+8\n3e1,-2E-1 0,0'])(
        'parses signed points regardless of separator placement: %s',
        value => {
            expect(isSvgPointsValue(value)).toBe(true);
            expect(parsePolygonPoints(value)).toBeDefined();
        }
    );

    it('moves, inserts, and removes points while preserving polygon validity', () => {
        const points = parsePolygonPoints('0,0 20,0 20,10 0,10')!;
        const moved = movePolygonPoint(points, '1', { x: 22, y: 1 });
        const inserted = insertPolygonPointAtNearestSegment(moved, { x: 12, y: 0 });
        const removed = removePolygonPoint(inserted.points, inserted.id);

        expect(moved[1]).toEqual({ id: '1', x: 22, y: 1 });
        expect(inserted.id).toEqual('1');
        expect(inserted.points[1]).toEqual({ id: '1', x: 12, y: 0 });
        expect(removed).toHaveLength(4);
    });

    it('rejects invalid or too-short point lists', () => {
        expect(parsePolygonPoints('0,0 20,0')).toBeUndefined();
        expect(parsePolygonPoints('0,0 20,0 20')).toBeUndefined();
        expect(parsePolygonPoints('0,0 nope 20,0 20,20')).toBeUndefined();
    });
});
