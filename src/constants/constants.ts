import { SvgsAttrs, SvgsType } from './svgs';

export type ComponentsType = 'text' | 'textarea' | 'number' | 'switch';

export const ComponentsTypeOptions = {
    text: 'text',
    textarea: 'textarea',
    number: 'number',
    switch: 'switch',
};

export interface Components {
    id: string;
    label: string;
    type: ComponentsType;
    defaultValue: any;
    value?: any;
}

export interface SvgsElem<T> {
    id: string;
    type: SvgsType;
    isCore: boolean;
    x: string;
    y: string;
    attrs: T;
}

export interface Param {
    id: string;
    type: 'MiscNode' | 'Station';
    svgs: Array<SvgsElem<SvgsAttrs>>;
    components: Components[];
    color?: Components;
}

export interface AttrsProps<T> {
    id: string;
    attrs: T;
    handleAttrsUpdate: (id: string, attrs: T) => void;
}

export enum Events {
    APP_LOAD = 'APP_LOAD',
}
