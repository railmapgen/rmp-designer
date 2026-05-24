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
    IconButton,
    Text,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField, RmgLabel } from '@railmapgen/rmg-components';
import React from 'react';
import { MdArrowDownward, MdArrowUpward, MdCircle, MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import {
    addComponent,
    deleteComponent,
    setColor,
    setComponents,
    setComponentValue,
} from '../../redux/param/param-slice';
import { ComponentsType, ComponentsTypeOptions } from '../../constants/components';
import { backupParam, openPaletteAppClip } from '../../redux/runtime/runtime-slice';
import { nanoid } from '../../util/helper';
import ColourUtil from './colour-util';

const normalizeDefaultValue = (type: ComponentsType, value: unknown) => {
    if (type === 'switch') return Boolean(value);
    if (type === 'number') return Number.isNaN(Number(value)) ? 0 : Number(value);
    return value === undefined || value === null ? '' : String(value);
};

const createComponentLabel = (id: string) => `param_${id}`;

export function DetailsComponents() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const {
        paletteAppClip: { output },
    } = useRootSelector(state => state.runtime);
    const { t } = useTranslation();

    const handleAddNewComponent = () => {
        const id = nanoid();
        const name = `Parameter ${param.components.length + 1}`;
        dispatch(backupParam(param));
        dispatch(
            addComponent({
                id,
                label: createComponentLabel(id),
                name,
                type: 'text',
                defaultValue: 'text',
            })
        );
    };

    const handleMove = (index: number, d: number) => {
        const dest = index + d;
        if (dest >= 0 && dest < param.components.length) {
            dispatch(backupParam(param));
            dispatch(
                setComponents(
                    param.components
                        .filter((s, i) => i < Math.min(index, dest))
                        .concat(param.components[Math.max(index, dest)])
                        .concat(
                            param.components.filter((s, i) => i > Math.min(index, dest) && i < Math.max(index, dest))
                        )
                        .concat(param.components[Math.min(index, dest)])
                        .concat(param.components.filter((s, i) => i > Math.max(index, dest)))
                )
            );
        }
    };

    const p = param.components.map((c, index) => {
        const { id, label, type, defaultValue, name, constraints } = c;
        const field: RmgFieldsField[] = [
            {
                label: t('panel.components.name'),
                type: 'input',
                value: name ?? label,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(setComponentValue({ index: index, value: { ...c, name: v } }));
                },
            },
            {
                label: t('panel.common.type'),
                type: 'select',
                options: ComponentsTypeOptions,
                value: type,
                onChange: v => {
                    const nextType = v as ComponentsType;
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                type: nextType,
                                defaultValue: normalizeDefaultValue(nextType, defaultValue),
                                value: c.value === undefined ? undefined : normalizeDefaultValue(nextType, c.value),
                                constraints:
                                    nextType === 'number' ? { step: 1, ...constraints } : constraints,
                            },
                        })
                    );
                },
            },
            {
                label: t('panel.components.defaultValue'),
                type: 'input',
                value: defaultValue,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: { ...c, defaultValue: normalizeDefaultValue(type, v) },
                        })
                    );
                },
                hidden: type === 'switch',
            },
            {
                label: t('panel.components.defaultValue'),
                type: 'switch',
                isChecked: defaultValue,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(setComponentValue({ index: index, value: { ...c, defaultValue: v } }));
                },
                hidden: type !== 'switch',
            },
            {
                label: 'Minimum',
                type: 'input',
                value: constraints?.min?.toString() ?? '',
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                constraints: {
                                    ...constraints,
                                    min: v === '' ? undefined : Number(v),
                                },
                            },
                        })
                    );
                },
                hidden: type !== 'number',
            },
            {
                label: 'Maximum',
                type: 'input',
                value: constraints?.max?.toString() ?? '',
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                constraints: {
                                    ...constraints,
                                    max: v === '' ? undefined : Number(v),
                                },
                            },
                        })
                    );
                },
                hidden: type !== 'number',
            },
            {
                label: 'Step',
                type: 'input',
                value: constraints?.step?.toString() ?? '1',
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(
                        setComponentValue({
                            index: index,
                            value: {
                                ...c,
                                constraints: {
                                    ...constraints,
                                    step: v === '' ? undefined : Number(v),
                                },
                            },
                        })
                    );
                },
                hidden: type !== 'number',
            },
            {
                label: '',
                type: 'custom',
                oneLine: true,
                component: (
                    <>
                        <Button size="md" onClick={() => handleMove(index, -1)}>
                            <MdArrowUpward />
                        </Button>
                        <Button size="md" onClick={() => handleMove(index, 1)}>
                            <MdArrowDownward />
                        </Button>
                        <Button
                            size="md"
                            onClick={() => {
                                dispatch(backupParam(param));
                                dispatch(deleteComponent(index));
                            }}
                        >
                            <MdClose />
                        </Button>
                    </>
                ),
            },
        ];

        return (
            <AccordionItem key={id}>
                <AccordionButton p={2}>
                    <Box as="span" flex="1" textAlign="left">
                        {name ?? label}
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                    <RmgFields fields={field} />
                </AccordionPanel>
            </AccordionItem>
        );
    });

    const [isThemeRequested, setIsThemeRequested] = React.useState(false);
    React.useEffect(() => {
        if (isThemeRequested && output) {
            dispatch(backupParam(param));
            dispatch(setColor({ ...param.color!, defaultValue: output }));
            setIsThemeRequested(false);
        }
    }, [output?.toString()]);

    return (
        <Flex width="100%" height="100%" direction="column" overflow="auto">
            <Flex p={2}>
                <Heading p={2} fontSize="x-large" width="100%">
                    {t('panel.components.title')}
                </Heading>
                <Button onClick={handleAddNewComponent}>+</Button>
            </Flex>
            <Box width="100%" height="100%" overflow="scroll">
                {p.length > 0 || param.color ? (
                    <Accordion width="100%" allowMultiple>
                        {...p}
                        {param.color ? (
                            <AccordionItem key="color">
                                <AccordionButton p={2}>
                                    <Box as="span" flex="1" textAlign="left">
                                        {t('color')}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                                <AccordionPanel>
                                    <RmgLabel label={t('panel.components.defaultColor')}>
                                        <IconButton
                                            aria-label={t('color')}
                                            color={param.color.defaultValue[3]}
                                            bg={param.color.defaultValue[2]}
                                            size="md"
                                            _hover={{ bg: ColourUtil.fade(param.color.defaultValue[2], 0.7) }}
                                            icon={<MdCircle />}
                                            onClick={() => {
                                                setIsThemeRequested(true);
                                                dispatch(openPaletteAppClip(param.color?.defaultValue));
                                            }}
                                        />
                                    </RmgLabel>
                                </AccordionPanel>
                            </AccordionItem>
                        ) : undefined}
                    </Accordion>
                ) : (
                    <Flex height="100%" width="100%" justifyContent="center" alignItems="center">
                        <Text textAlign="center">
                            {t('panel.components.tips1')} <Button size="sm">+</Button> {t('panel.components.tips2')}
                        </Text>
                    </Flex>
                )}
            </Box>
        </Flex>
    );
}
