import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Marketplace } from '../../constants/marketplace';

interface MarketplaceState {
    styles: Marketplace;
}

const initialState: MarketplaceState = {
    styles: {},
};

const marketplaceSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setStyles: (state, action: PayloadAction<Marketplace>) => {
            state.styles = action.payload;
        },
    },
});

export const { setStyles } = marketplaceSlice.actions;

const marketplaceReducer = marketplaceSlice.reducer;
export default marketplaceReducer;
