import { customAlphabet } from 'nanoid';

export const getMousePosition = (e: React.MouseEvent) => {
    const bbox = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bbox.left;
    const y = e.clientY - bbox.top;
    // console.log(e.clientX, bbox.left, e.clientY, bbox.top, x, y);
    return { x, y };
};

export const pointerPosToSVGCoord = (
    x: number,
    y: number,
    svgViewBoxZoom: number,
    svgViewBoxMin: { x: number; y: number }
) => ({ x: (x * svgViewBoxZoom) / 100 + svgViewBoxMin.x, y: (y * svgViewBoxZoom) / 100 + svgViewBoxMin.y });

export const roundToNearestN = (x: number, n: number) => Math.round(x / n) * n;

export const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',10)
