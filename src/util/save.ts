import { defaultParam, Param, SvgsElem } from '../constants/constants';

export const SAVE_VERSION = 2;

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
        localStorage.setItem('rmp-designer__param__backup', originalParam);
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
};
