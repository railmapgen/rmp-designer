import { Components, ComponentsType } from '../constants/components';

export const queryComponentValue = (components: Components[], query: string) => {
    components.forEach(c => {
        if (c.id === query) {
            return c.value;
        }
    });
    return undefined;
};

export const getComponentValue = (components: Components[]) =>
    components.map(c => ({
        id: c.id,
        value: c.value ?? c.defaultValue,
        type: c.type,
    }));

export const calcFunc = (str: string, ...rest: string[]) => new Function(...rest, `return ${str}`);

export const calcFuncInBatch = (str: string[], name: string[], value: string[], type: ComponentsType[]) => {
    // const dispatch = useRootDispatch();
    // const { globalAlerts } = useRootSelector(store => store.runtime);
    // globalAlerts && dispatch(setGlobalAlert(undefined));

    return str.map((s, i) => {
        try {
            return calcFunc(
                s,
                ...name
            )(...value.map(s => (type[i] === 'number' && !Number.isNaN(Number(s)) ? Number(s) : s)));
        } catch (e) {
            if (e instanceof Error) {
                console.error(s, e);
                // dispatch(setGlobalAlert(e.message));
                return type[i] === 'number' ? '0' : 'none';
            }
        }
    });
};
