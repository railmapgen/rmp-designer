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
    useColorModeValue,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDownward, MdArrowUpward, MdClose, MdDriveFileMoveOutline, MdError, MdUpload } from 'react-icons/md';
import type { AttrBinding } from '../../constants/attr-binding';
import { Id, SvgsElem } from '../../constants/constants';
import { SvgsType } from '../../constants/svgs';
import { setSvgs } from '../../redux/param/param-slice';
import { useRootDispatch, useRootSelector } from '../../redux';
import {
    addSelected,
    backupParam,
    clearGlobalAlerts,
    removeGlobalAlert,
    removeSelected,
} from '../../redux/runtime/runtime-slice';
import { applySmoothPathModelToSvgElem, SMOOTH_PATH_DATA_ATTR } from '../../util/smooth-path';
import { countSvgNodes, MAX_EDITABLE_SVG_NODE_COUNT } from '../../util/svg-node-count';
import { getDefaultAttrBinding } from '../../util/svg-attr-metadata';
import { supportsChildren } from '../../util/svgTagWithChildren';
import svgs from '../svgs/module/svgs';
import { ComplexSvgNotice } from './details-svgs/complex-svg-notice';
import { SmoothPathPanel } from './details-svgs/smooth-path-panel';
import { createVariableOptions, removeAttrBinding, updateAttrBinding, updateSvgAtPath } from '../../util/svg-panel';
import { VisualAttrPanel } from './details-svgs/visual-attr-panel';
import { MoveChildrenModal } from './details-svgs-move-children';

export function DetailsSvgs() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { globalAlerts, selected } = useRootSelector(store => store.runtime);
    const { t } = useTranslation();
    const components = React.useMemo(() => param.components, [param.components]);
    const variableOptions = React.useMemo(() => createVariableOptions(components, t), [components, t]);
    const svgNodeCount = React.useMemo(() => countSvgNodes(param.svgs), [param.svgs]);
    const isComplexSvg = svgNodeCount > MAX_EDITABLE_SVG_NODE_COUNT;
    const svgEditHintBg = useColorModeValue('blue.50', 'blue.900');
    const svgEditHintBorder = useColorModeValue('blue.200', 'blue.700');
    const svgEditHintColor = useColorModeValue('blue.800', 'blue.100');

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
        key: 'type' | 'label' | 'attrs' | 'attrBindings',
        value: string | Record<string, string> | Record<string, AttrBinding>,
        path: number[]
    ) => {
        dispatch(backupParam(param));
        dispatch(
            setSvgs(
                updateSvgAtPath(param.svgs, path, data => {
                    if (key === 'attrs') return { ...data, attrs: value as Record<string, string> };
                    if (key === 'attrBindings') return { ...data, attrBindings: value as Record<string, AttrBinding> };
                    return { ...data, [key]: value as string };
                })
            )
        );
        dispatch(removeGlobalAlert(id));
    };

    const handleSetAttrsAndBindings = (
        elem: SvgsElem,
        attrs: Record<string, string>,
        attrBindings: Record<string, AttrBinding>,
        path: number[]
    ) => {
        dispatch(backupParam(param));
        dispatch(setSvgs(updateSvgAtPath(param.svgs, path, data => ({ ...data, attrs, attrBindings }))));
        dispatch(removeGlobalAlert(elem.id));
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

    const dfsField = (svgs: SvgsElem[], path: number[], father: Id) =>
        svgs.toReversed().map((s, index) => {
            const i = svgs.length - index - 1;
            const currentPath = [...path, i];
            const editHintKey =
                s.type === 'polygon'
                    ? 'panel.svgs.polygonEditHint'
                    : s.type === 'path' &&
                        (SMOOTH_PATH_DATA_ATTR in s.attrs || SMOOTH_PATH_DATA_ATTR in (s.attrBindings ?? {}))
                      ? 'panel.svgs.smoothPathEditHint'
                      : undefined;
            const field: RmgFieldsField[] = [
                {
                    label: t('panel.common.label'),
                    type: 'input',
                    value: s.label,
                    onChange: value => handleSetValue(s.id, 'label', value, currentPath),
                },
                {
                    label: t('panel.common.type'),
                    type: 'input',
                    value: s.type,
                    onChange: value => handleSetValue(s.id, 'type', value, currentPath),
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
                                    setMoveChildrenId(currentPath);
                                    setMoveChildrenElem(s);
                                    setIsMoveChildrenOpen(true);
                                    dispatch(backupParam(param));
                                }}
                            >
                                <MdDriveFileMoveOutline />
                            </Button>
                            <Button size="md" onClick={() => handleRemove(s.id, currentPath)}>
                                <MdClose />
                            </Button>
                        </>
                    ),
                },
            ];

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
                    {({ isExpanded }) => {
                        const displayChildren = isExpanded && s.children ? dfsField(s.children, currentPath, s.id) : [];
                        const displayTextChildrenButton =
                            supportsChildren(s.type) &&
                            displayChildren.length === 0 &&
                            !('_rmp_children_text' in s.attrs) ? (
                                <Button
                                    width="100%"
                                    onClick={() => {
                                        const next = updateAttrBinding(
                                            s,
                                            '_rmp_children_text',
                                            getDefaultAttrBinding(s.type, '_rmp_children_text'),
                                            components
                                        );
                                        handleSetAttrsAndBindings(s, next.attrs, next.attrBindings, currentPath);
                                    }}
                                >
                                    {t('panel.svgs.addTextChildren')}
                                </Button>
                            ) : null;

                        return (
                            <>
                                <AccordionButton p={2}>
                                    <Checkbox
                                        isChecked={selected.has(s.id) || selected.has(father)}
                                        onChange={handleCheck}
                                    />
                                    <Box mr={2} />
                                    <Box as="span" flex="1" textAlign="left">
                                        <Text as="span" fontWeight="bold">
                                            {s.label}
                                        </Text>{' '}
                                        <Text as="span">&lt;{s.type}&gt;</Text>
                                    </Box>
                                    {globalAlerts.has(s.id) ? (
                                        <MdError color="#D9534F" title={globalAlerts.get(s.id)} />
                                    ) : (
                                        ''
                                    )}
                                    <AccordionIcon />
                                </AccordionButton>
                                <AccordionPanel>
                                    {isExpanded && (
                                        <>
                                            <RmgFields fields={field} />
                                            {editHintKey && (
                                                <Box
                                                    borderWidth="1px"
                                                    borderColor={svgEditHintBorder}
                                                    borderRadius="md"
                                                    bg={svgEditHintBg}
                                                    px={3}
                                                    py={2}
                                                    mt={1}
                                                    mb={4}
                                                >
                                                    <Text fontSize="sm" color={svgEditHintColor}>
                                                        {t(editHintKey)}
                                                    </Text>
                                                </Box>
                                            )}
                                            <SmoothPathPanel
                                                elem={s}
                                                components={components}
                                                onChangeModel={model => {
                                                    const next = applySmoothPathModelToSvgElem(s, model);
                                                    handleSetAttrsAndBindings(
                                                        s,
                                                        next.attrs,
                                                        next.attrBindings ?? {},
                                                        currentPath
                                                    );
                                                }}
                                            />
                                            <VisualAttrPanel
                                                elem={s}
                                                components={components}
                                                variableOptions={variableOptions}
                                                onChange={(attrKey, nextBinding) => {
                                                    const next = updateAttrBinding(s, attrKey, nextBinding, components);
                                                    handleSetAttrsAndBindings(
                                                        s,
                                                        next.attrs,
                                                        next.attrBindings,
                                                        currentPath
                                                    );
                                                }}
                                                onRemove={attrKey => {
                                                    const next = removeAttrBinding(s, attrKey);
                                                    handleSetAttrsAndBindings(
                                                        s,
                                                        next.attrs,
                                                        next.attrBindings,
                                                        currentPath
                                                    );
                                                }}
                                                onAdd={attr => {
                                                    const next = updateAttrBinding(
                                                        s,
                                                        attr,
                                                        getDefaultAttrBinding(s.type, attr),
                                                        components
                                                    );
                                                    handleSetAttrsAndBindings(
                                                        s,
                                                        next.attrs,
                                                        next.attrBindings,
                                                        currentPath
                                                    );
                                                }}
                                            />
                                            <HStack width="100%" pb={2}>
                                                {displayTextChildrenButton}
                                            </HStack>
                                            {displayChildren}
                                        </>
                                    )}
                                </AccordionPanel>
                            </>
                        );
                    }}
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
                        isComplexSvg ? (
                            <ComplexSvgNotice count={svgNodeCount} limit={MAX_EDITABLE_SVG_NODE_COUNT} />
                        ) : (
                            <Accordion width="100%" allowMultiple>
                                {dfsField(param.svgs, [], 'id_@root')}
                            </Accordion>
                        )
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
        </>
    );
}
