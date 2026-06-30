import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export const ComplexSvgNotice = (props: { count: number; limit: number }) => {
    const { count, limit } = props;
    const { t } = useTranslation();
    const bg = useColorModeValue('gray.50', 'gray.800');
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

    return (
        <Box mx={3} my={2} p={4} borderWidth="1px" borderRadius="md" bg={bg}>
            <Heading fontSize="md" mb={2}>
                {t('panel.svgs.complexMode.title')}
            </Heading>
            <Text fontSize="sm" color={textColor} mb={2}>
                {t('panel.svgs.complexMode.summary', { count, limit })}
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
                {t('panel.svgs.complexMode.detail')}
            </Text>
        </Box>
    );
};
