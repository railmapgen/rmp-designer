import { Button, Flex, SystemStyleObject, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setMode } from '../../redux/runtime/runtime-slice';
import { SvgsType } from '../../constants/svgs';
import svgs from '../svgs/module/svgs';

const buttonStyle: SystemStyleObject = {
    justifyContent: 'flex-start',
    p: 0,
    w: '100%',
    h: 10,
};

const EXPAND_ANIMATION_DURATION = 0.3; // in second

export const ToolsPanel = () => {
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const { mode } = useRootSelector(state => state.runtime);
    const bgColor = useColorModeValue('white', 'var(--chakra-colors-gray-800)');

    // text should only be appended after the expansion animation is complete
    const [isTextShown, setIsTextShown] = React.useState(true);
    const handleExpand = () => {
        if (!isTextShown) setTimeout(() => setIsTextShown(true), (EXPAND_ANIMATION_DURATION + 0.02) * 1000);
        else setIsTextShown(false);
    };
    const handleClick = (type: SvgsType) => dispatch(setMode(mode === 'free' ? `svgs-${type}` : 'free'));

    return (
        <Flex
            flexShrink="0"
            direction="column"
            width={isTextShown ? 250 : 10}
            maxWidth="100%"
            height="100%"
            bg={bgColor}
            zIndex="5"
            transition={`width ${EXPAND_ANIMATION_DURATION}s ease-in-out`}
        >
            <Button
                aria-label="Menu"
                leftIcon={
                    isTextShown ? (
                        <MdExpandMore size={40} transform="rotate(90)" />
                    ) : (
                        <MdExpandLess size={40} transform="rotate(90)" />
                    )
                }
                onClick={handleExpand}
                sx={buttonStyle}
            >
                {isTextShown ? t('panel.tools.showLess') : undefined}
            </Button>

            <Flex direction="column" overflow="auto">
                {Object.values(SvgsType).map(type => (
                    <Button
                        key={type}
                        aria-label={type}
                        leftIcon={svgs[type].icon}
                        onClick={() => handleClick(type)}
                        variant={mode === `svgs-${type}` ? 'solid' : 'outline'}
                        sx={buttonStyle}
                    >
                        {isTextShown ? t(svgs[type].displayName) : undefined}
                    </Button>
                ))}
            </Flex>
        </Flex>
    );
};
