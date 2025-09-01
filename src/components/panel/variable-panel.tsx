import { RmgAutoComplete, RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    defaultVariableFunctionAttrs,
    VariableFunction,
    VariableFunctionConfig,
    VariableFunctionType,
} from '../../constants/variable-function';
import { useRootSelector } from '../../redux';

interface AttrVarList {
    id: string;
    value: string;
}

const defaultVfFunc: VariableFunction = {
    type: 'function',
};
const defaultVfValue: VariableFunction = {
    type: 'value',
    value: '1',
};
const defaultVfVar: VariableFunction = {
    type: 'variable',
    value: 'undefined',
};

export const VariablePanel = (props: {
    isOpen: boolean;
    onClose: () => void;
    vf: VariableFunction;
    setVf: (value: VariableFunction) => void;
}) => {
    const { isOpen, onClose, vf, setVf } = props;
    const { t } = useTranslation();
    const param = useRootSelector(store => store.param);

    const [varList, setVarList] = React.useState<AttrVarList[]>([]);
    React.useEffect(() => {
        const list = param.components.map(c => {
            return { id: c.label, value: c.label };
        });
        if (param.color) {
            list.push({ id: 'color[2]', value: 'color[2]' });
            list.push({ id: 'color[3]', value: 'color[3]' });
        }
        list.push({ id: 'undefined', value: 'undefined' });
        setVarList(list);
    }, [param.components, param.color]);

    const [funcList, setFuncList] = React.useState<AttrVarList[]>([]);
    React.useEffect(() => {
        const list = Object.keys(VariableFunctionConfig).map(key => {
            return { id: key, value: VariableFunctionConfig[key as VariableFunctionType].name };
        });
        setFuncList(list);
    }, []);

    const [subWindowOpen, setSubWindowOpen] = React.useState<boolean[]>([]);
    const setSubWindowStatus = (status: boolean, index: number) => {
        const newStatus = [...subWindowOpen];
        newStatus[index] = status;
        setSubWindowOpen(newStatus);
    };

    const getValueField = (value: string | undefined, onChange: (v: string) => void): RmgFieldsField[] => {
        return [
            {
                type: 'input',
                label: t('variable.value'),
                value: value ?? '',
                onChange,
            },
        ];
    };

    const getSubComponentTitle = (value: VariableFunction | undefined) => {
        if (value) {
            if (value.type === 'value') return `${t('panel.svgs.attrMode.value')}: ${value.value}`;
            else if (value.type === 'variable') return `${t('panel.svgs.attrMode.variable')}: ${value.variable}`;
            else if (value.type === 'option') return `${t('panel.svgs.attrMode.option')}: ${value.option}`;
            else if (value.type === 'function') return `${t('panel.svgs.attrMode.advanced')}: ${value.function}`;
            else return 'uke';
        } else return 'undefined';
    };

    const getField = (): RmgFieldsField[] => {
        if (vf.type === 'value') {
            return getValueField(vf.value, value => setVf({ ...vf, value }));
        } else if (vf.type === 'variable') {
            return [
                {
                    type: 'custom',
                    label: t('variable.variable'),
                    component: (
                        <RmgAutoComplete
                            data={varList}
                            displayHandler={item => item.value}
                            filter={(query, item) =>
                                item.id.toLowerCase().includes(query.toLowerCase()) ||
                                Object.values(item.id).some(name => name.toLowerCase().includes(query.toLowerCase()))
                            }
                            value={vf.variable}
                            onChange={item => setVf({ ...vf, variable: item.value })}
                        />
                    ),
                },
            ];
        } else if (vf.type === 'function') {
            const returnList: RmgFieldsField[] = [];
            const type = vf.function;
            returnList.push({
                type: 'custom',
                label: t('variable.function.type'),
                component: (
                    <RmgAutoComplete
                        data={funcList}
                        displayHandler={item => item.value}
                        filter={(query, item) =>
                            item.id.toLowerCase().includes(query.toLowerCase()) ||
                            Object.values(item.id).some(name => name.toLowerCase().includes(query.toLowerCase()))
                        }
                        value={vf.function}
                        onChange={item => {
                            setVf({
                                ...vf,
                                function: item.id as VariableFunctionType,
                                [item.id]: structuredClone(
                                    defaultVariableFunctionAttrs[item.id as VariableFunctionType]
                                ),
                            });
                        }}
                    />
                ),
            });
            if (type !== undefined && vf[type as VariableFunctionType] !== undefined) {
                const attrs =
                    vf[type as VariableFunctionType] ?? defaultVariableFunctionAttrs[type as VariableFunctionType];
                const config = VariableFunctionConfig[type as VariableFunctionType];
                returnList.push(
                    ...(config.contents.map((c, i) => {
                        if (attrs.contents[i] === undefined) {
                            return [
                                {
                                    type: 'input',
                                    value: 'Something went wrong!',
                                    label: 'Error',
                                },
                            ];
                        }
                        if (c.type === 'option') {
                            return {
                                type: 'select',
                                label: c.label,
                                value: attrs.contents[i]!.value.option,
                                options: c.options || {},
                                onChange: (value: string) => {
                                    const newAttrs = structuredClone(attrs);
                                    newAttrs.contents[i].value.option = value;
                                    setVf({
                                        ...vf,
                                        [type as string]: newAttrs,
                                    });
                                },
                            };
                        } else {
                            return {
                                type: 'custom',
                                label: c.label,
                                component: (
                                    <>
                                        <Button size="xs" variant="outline" onClick={() => setSubWindowStatus(true, i)}>
                                            {getSubComponentTitle(attrs.contents[i]!.value)}
                                        </Button>
                                        <VariablePanel
                                            isOpen={subWindowOpen[i] || false}
                                            onClose={() => setSubWindowStatus(false, i)}
                                            vf={attrs.contents[i]!.value}
                                            setVf={(value: VariableFunction) => {
                                                const newAttrs = structuredClone(attrs);
                                                newAttrs.contents[i]!.value = value;
                                                setVf({
                                                    ...vf,
                                                    [type as string]: newAttrs,
                                                });
                                            }}
                                        />
                                    </>
                                ),
                            };
                        }
                    }) as RmgFieldsField[])
                );
            }
            return returnList;
        } else {
            return [];
        }
    };

    const basicFields: RmgFieldsField[] = [
        {
            type: 'select',
            label: t('variable.type'),
            value: vf.type,
            options: {
                value: 'value',
                variable: 'variable',
                function: 'function',
            },
            onChange: value => {
                if (value === 'value') {
                    setVf(structuredClone(defaultVfValue));
                } else if (value === 'variable') {
                    setVf(structuredClone(defaultVfVar));
                } else if (value === 'function') {
                    setVf(structuredClone(defaultVfFunc));
                }
            },
        },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalBody minH="200px">
                    <RmgFields fields={basicFields} />
                    <RmgFields fields={getField()} />
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('close')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
