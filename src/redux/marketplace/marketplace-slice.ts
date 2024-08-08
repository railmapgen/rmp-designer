import { createSlice } from '@reduxjs/toolkit';

interface MarketplaceState {
    refresh: number;
}

const initialState: MarketplaceState = {
    refresh: 0,
};

const marketplaceSlice = createSlice({
    name: 'marketplace',
    initialState,
    reducers: {
        setRefresh: state => {
            state.refresh++;
        },
    },
});

export const { setRefresh } = marketplaceSlice.actions;

const marketplaceReducer = marketplaceSlice.reducer;
export default marketplaceReducer;
