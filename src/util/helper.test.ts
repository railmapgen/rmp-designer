import { defaultParam } from '../constants/constants';
import { getErrorList } from './helper';

describe('Unit tests for helper functions', () => {
    it('does not require station params to define a connectable core', () => {
        expect(getErrorList(new Map(), { ...defaultParam, type: 'Station' })).toEqual([]);
    });
});
