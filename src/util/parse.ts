export const calcFunc = (str: string, ...rest: string[]) => new Function(...rest, `return ${str}`);
