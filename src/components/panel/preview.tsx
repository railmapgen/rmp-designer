import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateSvgs } from '../svgs/createSvgs';
import { useRootDispatch, useRootSelector } from '../../redux';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { setTransform } from '../../redux/param/param-slice';
import { Export } from './export';

export const Preview = (props: { isOpen: boolean; onClose: () => void }) => {
    const { isOpen, onClose } = props;
    const { t } = useTranslation();
    const param = useRootSelector(store => store.param);
    const dispatch = useRootDispatch();

    const linePaths = [
        'M -1000 0 L 1000 0',
        'M 0 -1000 L 0 1000',
        'M -1000 -1000 L 1000 1000',
        'M 1000 -1000 L -1000 1000',
    ];

    const [showLines, setShowLines] = React.useState(false);
    const [showBadges, setShowBadges] = React.useState(false);
    const [isExportOpen, setExportOpen] = React.useState(false);

    const fields: RmgFieldsField[] = [
        {
            label: t('header.export.showLines'),
            type: 'switch',
            isChecked: showLines,
            onChange: value => setShowLines(value),
        },
        {
            label: t('header.export.showBadges'),
            type: 'switch',
            isChecked: showBadges,
            onChange: value => setShowBadges(value),
        },
        {
            label: t('header.export.offsetX'),
            type: 'input',
            value: param.transform.translateX.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, translateX: Number(value) })),
        },
        {
            label: t('header.export.offsetY'),
            type: 'input',
            value: param.transform.translateY.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, translateY: Number(value) })),
        },
        {
            label: t('header.export.scale'),
            type: 'input',
            value: param.transform.scale.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, scale: Number(value) })),
        },
        {
            label: t('header.export.rotate'),
            type: 'input',
            value: param.transform.rotate.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, rotate: Number(value) })),
        },
    ];

    const handleExport = () => {
        setExportOpen(true);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{t('header.export.preview')}</ModalHeader>

                    <ModalBody>
                        <RmgFields fields={fields} />
                        <svg
                            id="rmp-style-gen-svg"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            colorInterpolationFilters="sRGB"
                            viewBox="-100 -100 200 200"
                            style={{
                                width: '100%',
                                height: '500',
                                userSelect: 'none',
                                touchAction: 'none',
                                backgroundColor: 'white',
                            }}
                            tabIndex={0}
                        >
                            {showLines &&
                                linePaths.map((linePath, i) => (
                                    <path
                                        key={i}
                                        d={linePath}
                                        fill="none"
                                        stroke="#C23A30"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                    />
                                ))}
                            {showBadges && (
                                <g>
                                    <g transform={`translate(-60, 70)`}>
                                        <rect fill="#E4002B" width="21" height="22.67" />
                                        <text
                                            className="rmp-name__zh"
                                            textAnchor="middle"
                                            x="10"
                                            y="19"
                                            fill="white"
                                            fontSize="21.33"
                                            letterSpacing="-1.75"
                                        >
                                            1
                                        </text>
                                        <text className="rmp-name__zh" x={21 + 2} y="12" fontSize="14.67">
                                            号线
                                        </text>
                                        <text className="rmp-name__en" x={21 + 4} y="21.5" fontSize="8">
                                            Line 1
                                        </text>
                                    </g>
                                    <g transform={`translate(8, 72.5)`}>
                                        <rect fill="#c23a30" x="0" width={11.84375 + 21} height="16" rx="2" />
                                        <text
                                            className="rmp-name__zh"
                                            textAnchor="middle"
                                            x={11.84375 / 2 + 2}
                                            y="13.5"
                                            fill="white"
                                            fontSize="15"
                                            letterSpacing="-1.5"
                                        >
                                            1
                                        </text>
                                        <text
                                            className="rmp-name__zh"
                                            x={11.84375 + 3}
                                            y="8.5"
                                            fontSize="7"
                                            fill="white"
                                        >
                                            号线
                                        </text>
                                        <text
                                            className="rmp-name__en"
                                            x={11.84375 + 4.5}
                                            y="13.5"
                                            fontSize="4"
                                            fill="white"
                                        >
                                            Line 1
                                        </text>
                                    </g>
                                </g>
                            )}
                            <g
                                transform={`translate(${param.transform.translateX}, ${param.transform.translateY}) scale(${param.transform.scale}) rotate(${param.transform.rotate})`}
                            >
                                {param.svgs.map(s => {
                                    const components = param.color
                                        ? [...param.components, param.color]
                                        : param.components;
                                    return (
                                        <CreateSvgs
                                            key={s.id}
                                            svgsElem={s}
                                            components={components}
                                            prefix={[s.id]}
                                            handlePointerDown={() => {}}
                                            handlePointerMove={() => {}}
                                            handlePointerUp={() => {}}
                                        />
                                    );
                                })}
                            </g>
                        </svg>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button colorScheme="blue" variant="solid" mr="1" onClick={handleExport}>
                            {t('header.export.export')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Export isOpen={isExportOpen} onClose={() => setExportOpen(false)} param={param} />
        </>
    );
};
