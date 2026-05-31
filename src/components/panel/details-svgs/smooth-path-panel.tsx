import { Box, Button, Heading, HStack, Input, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';
import type { Components } from '../../../constants/components';
import type { SvgsElem } from '../../../constants/constants';
import { evaluateAttrBinding } from '../../../util/attr-binding';
import { nanoid } from '../../../util/helper';
import {
    addWidthStop,
    moveWidthStop,
    parseSmoothPathModel,
    removeWidthStop,
    resizeWidthStop,
    SMOOTH_PATH_DATA_ATTR,
    SmoothPathEndCap,
    SmoothPathModel,
    SmoothPathStartCap,
} from '../../../util/smooth-path';
import { getBindingForAttr } from '../../../util/svg-panel';

const getSmoothPathModelForElem = (elem: SvgsElem, components: Components[]): SmoothPathModel | undefined => {
    const binding = getBindingForAttr(SMOOTH_PATH_DATA_ATTR, elem, components);
    const result = evaluateAttrBinding(binding, { components });
    return result.error ? undefined : parseSmoothPathModel(result.value);
};

const NumberControl = (props: {
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
}) => {
    const { label, value, min, max, step = 1, onChange } = props;
    return (
        <HStack>
            <Text width="120px" fontSize="sm">
                {label}
            </Text>
            <Input
                type="number"
                size="sm"
                value={String(value)}
                min={min}
                max={max}
                step={step}
                onChange={event => {
                    const next = Number(event.target.value);
                    if (!Number.isNaN(next)) onChange(next);
                }}
            />
        </HStack>
    );
};

export const SmoothPathPanel = (props: {
    elem: SvgsElem;
    components: Components[];
    onChangeModel: (model: SmoothPathModel) => void;
}) => {
    const { elem, components, onChangeModel } = props;
    const { t } = useTranslation();
    const model = React.useMemo(() => getSmoothPathModelForElem(elem, components), [components, elem]);
    const panelBg = useColorModeValue('gray.50', 'gray.800');
    const mutedColor = useColorModeValue('gray.600', 'gray.300');

    if (!model) return null;

    const update = (updater: (model: SmoothPathModel) => SmoothPathModel) => onChangeModel(updater(model));
    const startCaps: SmoothPathStartCap[] = ['round', 'flat'];
    const endCaps: SmoothPathEndCap[] = ['round', 'flat', 'arrow'];
    const smoothingField: RmgFieldsField[] = [
        {
            type: 'slider',
            label: t('panel.svgs.smoothPath.smoothing', { defaultValue: 'Smoothing' }),
            value: Math.round(model.smoothing * 100),
            min: 0,
            max: 100,
            step: 1,
            onChange: value => update(current => ({ ...current, smoothing: Math.min(1, Math.max(0, value / 100)) })),
        },
    ];

    return (
        <Box borderWidth="1px" borderRadius="md" p={3} mb={4} bg={panelBg}>
            <Heading fontSize="md" mb={3}>
                {t('panel.svgs.smoothPath.title', { defaultValue: 'Smooth path' })}
            </Heading>
            <VStack align="stretch" spacing={3}>
                <RmgFields fields={smoothingField} />

                <HStack>
                    <Text width="120px" fontSize="sm">
                        {t('panel.svgs.smoothPath.startCap', { defaultValue: 'Start cap' })}
                    </Text>
                    {startCaps.map(cap => (
                        <Button
                            key={cap}
                            size="sm"
                            variant={model.startCap === cap ? 'solid' : 'outline'}
                            onClick={() => update(current => ({ ...current, startCap: cap }))}
                        >
                            {t(`panel.svgs.smoothPath.caps.${cap}`, { defaultValue: cap })}
                        </Button>
                    ))}
                </HStack>

                <HStack>
                    <Text width="120px" fontSize="sm">
                        {t('panel.svgs.smoothPath.endCap', { defaultValue: 'End cap' })}
                    </Text>
                    {endCaps.map(cap => (
                        <Button
                            key={cap}
                            size="sm"
                            variant={model.endCap === cap ? 'solid' : 'outline'}
                            onClick={() => update(current => ({ ...current, endCap: cap }))}
                        >
                            {t(`panel.svgs.smoothPath.caps.${cap}`, { defaultValue: cap })}
                        </Button>
                    ))}
                </HStack>

                {model.endCap === 'arrow' && (
                    <>
                        <NumberControl
                            label={t('panel.svgs.smoothPath.arrowLength', { defaultValue: 'Arrow length' })}
                            value={model.arrow?.length ?? 16}
                            min={1}
                            step={1}
                            onChange={value =>
                                update(current => ({
                                    ...current,
                                    arrow: { width: current.arrow?.width ?? 16, length: Math.max(1, value) },
                                }))
                            }
                        />
                        <NumberControl
                            label={t('panel.svgs.smoothPath.arrowWidth', { defaultValue: 'Arrow width' })}
                            value={model.arrow?.width ?? 16}
                            min={1}
                            step={1}
                            onChange={value =>
                                update(current => ({
                                    ...current,
                                    arrow: { length: current.arrow?.length ?? 16, width: Math.max(1, value) },
                                }))
                            }
                        />
                    </>
                )}

                <Box>
                    <HStack mb={2}>
                        <Text fontWeight="semibold">
                            {t('panel.svgs.smoothPath.widthStops', { defaultValue: 'Width stops' })}
                        </Text>
                        <Text fontSize="xs" color={mutedColor}>
                            {t('panel.svgs.smoothPath.widthStopsHint', {
                                defaultValue: 'Position is a percentage along the path.',
                            })}
                        </Text>
                    </HStack>
                    <VStack align="stretch" spacing={2}>
                        {model.widthStops.map((stop, index) => (
                            <HStack key={stop.id}>
                                <Text width="32px" fontSize="sm">
                                    {index + 1}
                                </Text>
                                <Input
                                    type="number"
                                    size="sm"
                                    value={String(Math.round(stop.t * 100))}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onChange={event => {
                                        const next = Number(event.target.value);
                                        if (!Number.isNaN(next)) {
                                            update(current => moveWidthStop(current, stop.id, next / 100));
                                        }
                                    }}
                                />
                                <Input
                                    type="number"
                                    size="sm"
                                    value={String(stop.width)}
                                    min={0.5}
                                    step={0.5}
                                    onChange={event => {
                                        const next = Number(event.target.value);
                                        if (!Number.isNaN(next)) {
                                            update(current => resizeWidthStop(current, stop.id, next));
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    isDisabled={model.widthStops.length <= 1}
                                    onClick={() => update(current => removeWidthStop(current, stop.id))}
                                >
                                    <MdClose />
                                </Button>
                            </HStack>
                        ))}
                    </VStack>
                    <Button
                        size="sm"
                        mt={2}
                        onClick={() => update(current => addWidthStop(current, () => nanoid(10), 0.5))}
                    >
                        {t('panel.svgs.smoothPath.addWidthStop', { defaultValue: 'Add width stop' })}
                    </Button>
                </Box>
            </VStack>
        </Box>
    );
};
