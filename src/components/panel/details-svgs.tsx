import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Heading,
    HStack,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDownward, MdArrowUpward, MdClose, MdDriveFileMoveOutline, MdError } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../../redux';
import { backupParam, removeGlobalAlert } from '../../redux/runtime/runtime-slice';
import { deleteSvg, setCore, setSvgs } from '../../redux/param/param-slice';
import { SvgsElem } from '../../constants/constants';
import { supportsChildren } from '../../util/svgTagWithChildren';
import { MoveChildrenModal } from './details-svgs-move-children';

export function DetailsSvgs() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { globalAlerts } = useRootSelector(store => store.runtime);
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
        key: 'type' | 'attrs',
        value: string | Record<string, string>,
        path: number[]
    ) => {
        const dfsChangeValue = (
            data: SvgsElem,
            key: 'type' | 'attrs',
            value: string | Record<string, string>,
            path: number[],
            index: number
        ): SvgsElem => {
            if (index >= path.length) {
                if (key === 'attrs') {
                    return { ...data, attrs: value as Record<string, string> };
                } else {
                    return { ...data, [key]: value as string };
                }
            }
            const newChildren = structuredClone(data.children!);
            newChildren[path[index]] = dfsChangeValue(data.children![path[index]], key, value, path, index + 1);
            return { ...data, children: newChildren };
        };
        const newSvgs = structuredClone(param.svgs);
        newSvgs[path[0]] = dfsChangeValue(newSvgs[path[0]], key, value, path, 1);
        dispatch(backupParam(param));
        dispatch(setSvgs(newSvgs));
        dispatch(removeGlobalAlert(id));
    };

    const [isMoveChildrenOpen, setIsMoveChildrenOpen] = React.useState(false);
    const [moveChildrenId, setMoveChildrenId] = React.useState<number[]>([]);
    const [moveChildrenElem, setMoveChildrenElem] = React.useState<SvgsElem>();

    const dfsField = (svgs: SvgsElem[], path: number[]) =>
        svgs.toReversed().map((s, index) => {
            const i = param.svgs.length - index - 1; // reversed index
            const field: RmgFieldsField[] = [
                {
                    label: 'type',
                    type: 'input',
                    value: s.type,
                    onChange: value => handleSetValue(s.id, 'type', value, [...path, i]),
                },
                {
                    label: 'Connectable',
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
                            <Button
                                size="md"
                                onClick={() => {
                                    dispatch(backupParam(param));
                                    dispatch(removeGlobalAlert(s.id));
                                    dispatch(deleteSvg(i));
                                }}
                            >
                                <MdClose />
                            </Button>
                        </>
                    ),
                },
            ];
            const attrsField = Object.entries(s.attrs).map(([key, value]) => {
                const field: RmgFieldsField[] = [
                    {
                        label: 'Attributes key',
                        type: 'input',
                        value: key,
                        onChange: v => {
                            const { [key]: _, ...newAttrs } = s.attrs;
                            handleSetValue(s.id, 'attrs', { ...newAttrs, [v]: value }, [...path, i]);
                        },
                    },
                    {
                        label: 'Value',
                        type: 'input',
                        value: value,
                        onChange: v => handleSetValue(s.id, 'attrs', { ...s.attrs, [key]: v }, [...path, i]),
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
                return <RmgFields key={key} fields={field} />;
            });
            const displayChildren = supportsChildren(s.type) && s.children ? dfsField(s.children, [...path, i]) : [];
            const displayTextChildrenButton =
                supportsChildren(s.type) && displayChildren.length === 0 && !('_rmp_children_text' in s.attrs) ? (
                    <Button
                        width="100%"
                        onClick={() =>
                            handleSetValue(s.id, 'attrs', { ...s.attrs, _rmp_children_text: '"value"' }, [...path, i])
                        }
                    >
                        Add text children
                    </Button>
                ) : null;
            return (
                <AccordionItem key={s.id}>
                    <AccordionButton p={2}>
                        <Box as="span" flex="1" textAlign="left">
                            {s.type}
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
                                    handleSetValue(s.id, 'attrs', { ...s.attrs, new: '"value"' }, [...path, i])
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
            <Box width="100%">
                <Flex p={2}>
                    <Heading fontSize="x-large" p={2}>
                        Svgs
                    </Heading>
                </Flex>
                <Accordion width="100%" allowMultiple>
                    {...dfsField(param.svgs, [])}
                </Accordion>
            </Box>
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
