import { customAlphabet } from 'nanoid';

export const getMousePosition = (e: React.MouseEvent) => {
    const bbox = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bbox.left;
    const y = e.clientY - bbox.top;
    // console.log(e.clientX, bbox.left, e.clientY, bbox.top, x, y);
    return { x, y };
};

export const roundToNearestN = (x: number, n: number) => Math.round(x / n) * n;

export const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',10)
