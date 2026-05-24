import { defaultParam, Param, SvgsElem } from '../constants/constants';
import { Components } from '../constants/components';
import { AttrBinding } from '../constants/attr-binding';
import { compileAttrRecord, legacyAttrToBinding, slugifyComponentLabel } from './attr-binding';

export const SAVE_VERSION = 3;

export const getComponentsWithColor = (param: Param): Components[] =>
    param.color ? [...param.components, param.color] : param.components;

export const prepareParamForExport = (param: Param): Param => {
    const components = getComponentsWithColor(param);
    return {
        ...param,
        svgs: compileSvgs(param.svgs, components),
    };
};

export const stringifyParam = (param: Param): string => JSON.stringify(prepareParamForExport(param));

export const upgrade: (originalParam: string | null) => Promise<string> = async originalParam => {
    let changed = false;

    if (!originalParam) {
        originalParam = JSON.stringify(defaultParam);
        changed = true;
    }

    let originalSave = JSON.parse(originalParam);
    if (!('version' in originalSave) || !Number.isInteger(originalSave.version)) {
        originalSave = { ...originalSave, version: 0 };
        changed = true;
    }

    let version = Number(originalSave.version);
    let save = JSON.stringify(originalSave);
    while (version in UPGRADE_COLLECTION) {
        save = UPGRADE_COLLECTION[version](save);
        version = Number(JSON.parse(save).version);
        changed = true;
    }

    if (changed) {
        console.warn(`Upgrade save to version: ${version}`);
        // Backup original param in case of bugs in the upgrades.
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
            localStorage.setItem('rmp-designer__param__backup', originalParam);
        }
    }

    // Version should be CURRENT_VERSION now.
    return save;
};

export const UPGRADE_COLLECTION: { [version: number]: (param: string) => string } = {
    0: param => {
        const p = JSON.parse(param) as Param;
        const newSvgs: SvgsElem[] = p.svgs.map(s => {
            const modifiedAttrs: Record<string, string> = {};
            for (const key in s.attrs) {
                if (Object.prototype.hasOwnProperty.call(s.attrs, key)) {
                    const regValue = /^"[^"]*"$/;
                    const regNumber = /^[0-9-]+$/;
                    const regVar = /^[A-Za-z0-9]+$/;
                    if (regValue.test(s.attrs[key])) {
                        modifiedAttrs[key] = `1${s.attrs[key]}`;
                    } else if (regNumber.test(s.attrs[key])) {
                        modifiedAttrs[key] = `1"${s.attrs[key]}"`;
                    } else if (regVar.test(s.attrs[key])) {
                        modifiedAttrs[key] = `2${s.attrs[key]}`;
                    } else {
                        modifiedAttrs[key] = `3${s.attrs[key]}`;
                    }
                }
            }
            return { ...s, attrs: modifiedAttrs };
        });
        return JSON.stringify({ ...p, version: 1, svgs: newSvgs } as Param);
    },
    1: param => {
        // Add label
        const p = JSON.parse(param) as Param;
        return JSON.stringify({ ...p, version: 2, label: p.id, transform: defaultParam.transform } as Param);
    },
    2: param => {
        const p = JSON.parse(param) as Param;
        const components = migrateComponents(p.components);
        const color = p.color ? migrateComponent(p.color) : undefined;
        const componentsWithColor = color ? [...components, color] : components;
        return JSON.stringify({
            ...p,
            version: 3,
            components,
            color,
            svgs: migrateSvgs(p.svgs, componentsWithColor),
        } as Param);
    },
};

const migrateComponent = (component: Components): Components => {
    const name = component.name ?? component.label;
    const label = component.label || slugifyComponentLabel(name, component.id);
    const defaultValue = component.type === 'switch' ? Boolean(component.defaultValue) : component.defaultValue;
    const value = component.type === 'switch' && component.value !== undefined ? Boolean(component.value) : component.value;
    const constraints =
        component.type === 'number'
            ? {
                  step: 1,
                  ...component.constraints,
              }
            : component.constraints;
    return {
        ...component,
        label,
        name,
        defaultValue,
        value,
        constraints,
    };
};

const migrateComponents = (components: Components[]): Components[] => components.map(migrateComponent);

const migrateSvgs = (svgs: SvgsElem[], components: Components[]): SvgsElem[] =>
    svgs.map(svg => {
        const attrBindings: Record<string, AttrBinding> = {};
        Object.entries(svg.attrs).forEach(([key, value]) => {
            attrBindings[key] = legacyAttrToBinding(value, components);
        });
        return {
            ...svg,
            attrBindings,
            children: svg.children ? migrateSvgs(svg.children, components) : undefined,
        };
    });

const compileSvgs = (svgs: SvgsElem[], components: Components[]): SvgsElem[] =>
    svgs.map(svg => ({
        ...svg,
        attrs: compileAttrRecord(svg.attrs, svg.attrBindings, components),
        children: svg.children ? compileSvgs(svg.children, components) : undefined,
    }));
