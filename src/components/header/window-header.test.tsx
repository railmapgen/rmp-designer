import { screen } from '@testing-library/react';
import { render } from '../../test-utils';
import WindowHeader from './window-header';

describe('WindowHeader', () => {
    it('Can render window header', () => {
        render(<WindowHeader />);

        expect(screen.getByRole('heading').textContent).toContain('RMP Designer');
    });
});
