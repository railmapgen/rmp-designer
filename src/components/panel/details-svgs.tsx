import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Checkbox,
    Flex,
    Heading,
    HStack,
    Text,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDownward, MdArrowUpward, MdClose, MdDriveFileMoveOutline, MdError, MdUpload } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../../redux';
import {
    addSelected,
    backupParam,
    clearGlobalAlerts,
    removeGlobalAlert,
    removeSelected,
} from '../../redux/runtime/runtime-slice';
import { setCore, setSvgs } from '../../redux/param/param-slice';
import { Id, SvgsElem } from '../../constants/constants';
import { supportsChildren } from '../../util/svgTagWithChildren';
import { MoveChildrenModal } from './details-svgs-move-children';
import svgs from '../svgs/module/svgs';
import { SvgsType } from '../../constants/svgs';
import { VariableFunction } from '../../constants/variable-function';
import { VariablePanel } from './variable-panel';

export function DetailsSvgs() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { globalAlerts, selected } = useRootSelector(store => store.runtime);
    const { t } = useTranslation();

    const handleMove = (index: number, d: number, path: number[]) => {
        const dfsMove = (data: SvgsElem[], path: number[], p: number): SvgsElem[] => {
            if (index >= path.length) {
                const dest = index + d;
                if (dest >= 0 && dest < data.length) {
                    return data
                        .filter((s, i) => i < Math.min(index, dest))
                        .concat(data[Math.max(index, dest)])
                        .concat(data.filter((s, i) => i > Math.min(index, dest) && i < Math.max(index, dest)))
                        .concat(data[Math.min(index, dest)])
                        .concat(data.filter((s, i) => i > Math.max(index, dest)));
                } else {
                    return data;
                }
            }
            const newChildren = dfsMove(data[path[p]].children!, path, p + 1);
            return data
                .filter((s, i) => i < path[p])
                .concat([{ ...data[path[p]], children: newChildren }])
                .concat(data.filter((s, i) => i > path[p]));
        };
        dispatch(backupParam(param));
        dispatch(setSvgs(dfsMove(param.svgs, path, 0)));
    };

    const handleSetValue = (
        id: string,
        key: 'type' | 'label' | 'attrs',
        value: string | Record<string, VariableFunction>,
        path: number[]
    ) => {
        const dfsChangeValue = (
            data: SvgsElem,
            key: 'type' | 'label' | 'attrs',
            value: string | Record<string, VariableFunction>,
            index: number
        ): SvgsElem => {
            if (index >= path.length) {
                if (key === 'attrs') {
                    return { ...data, attrs: value as Record<string, VariableFunction> };
                } else {
                    return { ...data, [key]: value as string };
                }
            }
            const newChildren = structuredClone(data.children!);
            newChildren[path[index]] = dfsChangeValue(data.children![path[index]], key, value, index + 1);
            return { ...data, children: newChildren };
        };
        const newSvgs = structuredClone(param.svgs);
        newSvgs[path[0]] = dfsChangeValue(newSvgs[path[0]], key, value, 1);
        dispatch(backupParam(param));
        dispatch(setSvgs(newSvgs));
        dispatch(removeGlobalAlert(id));
    };

    const handleRemove = (id: string, path: number[]) => {
        const dfsRemove = (data: SvgsElem[], index: number): SvgsElem[] => {
            if (index + 1 >= path.length) {
                return data.filter((s, i) => i !== path[index]);
            }
            const newChildren = dfsRemove(data[path[index]].children!, index + 1);
            return data
                .filter((s, i) => i < path[index])
                .concat([{ ...data[path[index]], children: newChildren.length === 0 ? undefined : newChildren }])
                .concat(data.filter((c, i) => i > path[index]));
        };
        dispatch(backupParam(param));
        dispatch(setSvgs(dfsRemove(param.svgs, 0)));
        dispatch(clearGlobalAlerts());
    };

    const [isMoveChildrenOpen, setIsMoveChildrenOpen] = React.useState(false);
    const [moveChildrenId, setMoveChildrenId] = React.useState<number[]>([]);
    const [moveChildrenElem, setMoveChildrenElem] = React.useState<SvgsElem>();

    const [activeVariableFunction, setActiveVariableFunction] = React.useState<
        { vf: VariableFunction; onChange: (vf: VariableFunction) => void } | undefined
    >(undefined);

    const getSubComponentTitle = (value: VariableFunction | undefined) => {
        if (value) {
            if (value.type === 'value') return `${t('panel.svgs.attrMode.value')}: ${value.value}`;
            else if (value.type === 'variable') return `${t('panel.svgs.attrMode.variable')}: ${value.variable}`;
            else if (value.type === 'option') return `${t('panel.svgs.attrMode.option')}: ${value.option}`;
            else if (value.type === 'function') return `${t('panel.svgs.attrMode.advanced')}: ${value.function}`;
            else return 'uke';
        } else return 'undefined';
    };

    const dfsField = (svgs: SvgsElem[], path: number[], father: Id) =>
        svgs.toReversed().map((s, index) => {
            const i = svgs.length - index - 1; // reversed index
            const field: RmgFieldsField[] = [
                {
                    label: t('panel.common.label'),
                    type: 'input',
                    value: s.label,
                    onChange: value => handleSetValue(s.id, 'label', value, [...path, i]),
                },
                {
                    label: t('panel.common.type'),
                    type: 'input',
                    value: s.type,
                    onChange: value => handleSetValue(s.id, 'type', value, [...path, i]),
                },
                {
                    label: t('panel.svgs.core'),
                    type: 'switch',
                    isChecked: param.core ? param.core === s.id : false,
                    onChange: value => {
                        dispatch(setCore(value ? s.id : undefined));
                    },
                    hidden: param.type !== 'Station',
                },
                {
                    label: '',
                    type: 'custom',
                    oneLine: true,
                    component: (
                        <>
                            <Button size="md" onClick={() => handleMove(i, 1, path)}>
                                <MdArrowUpward />
                            </Button>
                            <Button size="md" onClick={() => handleMove(i, -1, path)}>
                                <MdArrowDownward />
                            </Button>
                            <Button
                                size="md"
                                onClick={() => {
                                    setMoveChildrenId([...path, i]);
                                    setMoveChildrenElem(s);
                                    setIsMoveChildrenOpen(true);
                                    dispatch(backupParam(param));
                                }}
                            >
                                <MdDriveFileMoveOutline />
                            </Button>
                            <Button size="md" onClick={() => handleRemove(s.id, [...path, i])}>
                                <MdClose />
                            </Button>
                        </>
                    ),
                },
            ];
            const attrsField = Object.entries(s.attrs).map(([key, value]) => {
                const field: RmgFieldsField[] = [
                    {
                        label: t('panel.svgs.attrKey'),
                        type: 'input',
                        value: key,
                        onChange: v => {
                            const { [key]: _, ...newAttrs } = s.attrs;
                            handleSetValue(s.id, 'attrs', { ...newAttrs, [v]: value }, [...path, i]);
                        },
                    },
                    {
                        label: t('panel.svgs.attrValue'),
                        type: 'custom',
                        component: (
                            <Button
                                size="sm"
                                variant="outline"
                                width="100%"
                                justifyContent="flex-start"
                                onClick={() =>
                                    setActiveVariableFunction({
                                        vf: value,
                                        onChange: vf => {
                                            handleSetValue(s.id, 'attrs', { ...s.attrs, [key]: vf }, [...path, i]);
                                            setActiveVariableFunction(prev => (prev ? { ...prev!, vf } : undefined));
                                        },
                                    })
                                }
                            >
                                <Box as="span" isTruncated w="100%">
                                    {getSubComponentTitle(value)}
                                </Box>
                            </Button>
                        ),
                    },
                    {
                        label: '',
                        type: 'custom',
                        oneLine: true,
                        component: (
                            <Button
                                onClick={() => {
                                    const { [key]: _, ...newAttrs } = s.attrs;
                                    handleSetValue(s.id, 'attrs', { ...newAttrs }, [...path, i]);
                                }}
                            >
                                -
                            </Button>
                        ),
                    },
                ];
                return <RmgFields key={key} fields={field} minW="100px" />;
            });
            const displayChildren = s.children ? dfsField(s.children, [...path, i], s.id) : [];
            const displayTextChildrenButton =
                supportsChildren(s.type) && displayChildren.length === 0 && !('_rmp_children_text' in s.attrs) ? (
                    <Button
                        width="100%"
                        onClick={() =>
                            handleSetValue(
                                s.id,
                                'attrs',
                                { ...s.attrs, _rmp_children_text: { type: 'value', value: 'value' } },
                                [...path, i]
                            )
                        }
                    >
                        {t('panel.svgs.addTextChildren')}
                    </Button>
                ) : null;
            const handleCheck = (e: React.ChangeEvent) => {
                e.stopPropagation();
                if (selected.has(s.id)) {
                    dispatch(removeSelected(s.id));
                    if (selected.has(father)) {
                        dispatch(removeSelected(father));
                    }
                } else {
                    dispatch(addSelected(s.id));
                }
            };
            return (
                <AccordionItem key={s.id}>
                    <AccordionButton p={2}>
                        <Checkbox isChecked={selected.has(s.id) || selected.has(father)} onChange={handleCheck} />
                        <Box mr={2} />
                        <Box as="span" flex="1" textAlign="left">
                            <Text as="span" fontWeight="bold">
                                {s.label}
                            </Text>{' '}
                            <Text as="span">&lt;{s.type}&gt;</Text>
                        </Box>
                        {globalAlerts.has(s.id) ? <MdError color="#D9534F" title={globalAlerts.get(s.id)} /> : ''}
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <RmgFields fields={field} />
                        {...attrsField}
                        <HStack width="100%" pb={2}>
                            <Button
                                width="100%"
                                onClick={() =>
                                    handleSetValue(
                                        s.id,
                                        'attrs',
                                        { ...s.attrs, new: { type: 'value', value: 'value' } },
                                        [...path, i]
                                    )
                                }
                            >
                                +
                            </Button>
                            {displayTextChildrenButton}
                        </HStack>
                        {...displayChildren}
                    </AccordionPanel>
                </AccordionItem>
            );
        });

    return (
        <>
            <Flex width="100%" height="100%" direction="column" overflow="auto">
                <Flex p={2}>
                    <Heading fontSize="x-large" p={2}>
                        {t('panel.svgs.title')}
                    </Heading>
                </Flex>
                <Box width="100%" height="100%" overflow="scroll">
                    {param.svgs.length > 0 ? (
                        <Accordion width="100%" allowMultiple>
                            {...dfsField(param.svgs, [], 'id_@root')}
                        </Accordion>
                    ) : (
                        <Flex height="100%" width="100%" justifyContent="center" alignItems="center" direction="column">
                            <Text textAlign="center">
                                {t('panel.svgs.tipsA1')}
                                <Button size="sm" variant="outline" m={1}>
                                    <MdUpload />
                                </Button>
                                {t('panel.svgs.tipsA2')}
                            </Text>
                            <br />
                            <Text textAlign="center">
                                {t('panel.svgs.tipsB1')}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={svgs[SvgsType.Rect].icon}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        p: 1,
                                        m: 1,
                                        h: 10,
                                    }}
                                >
                                    Rectangle
                                </Button>
                                {t('panel.svgs.tipsB2')}
                            </Text>
                        </Flex>
                    )}
                </Box>
            </Flex>
            <MoveChildrenModal
                isOpen={isMoveChildrenOpen}
                onClose={() => setIsMoveChildrenOpen(false)}
                param={param}
                path={moveChildrenId}
                movedElem={moveChildrenElem!}
            />
            <VariablePanel
                isOpen={activeVariableFunction !== undefined}
                onClose={() => setActiveVariableFunction(undefined)}
                vf={(activeVariableFunction ?? { vf: { type: 'value', value: 'undefined' } }).vf}
                setVf={(activeVariableFunction ?? { onChange: _ => {} }).onChange}
            />
        </>
    );
}
