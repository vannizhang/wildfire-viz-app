import { 
    createSlice,
    createSelector
} from '@reduxjs/toolkit';

import {
    RootState,
    StoreDispatch,
    StoreGetState
} from '../configureStore';

export type ListMode = 'timeline' | 'grid';

interface UIReducerInitialState {
    listMode: ListMode;
    searchTerm: string;
};

interface ListModeChangedAction {
    type: string;
    payload: ListMode;
};

interface SearchTermChangedAction {
    type: string;
    payload: string;
}

const slice = createSlice({
    name: 'UI',
    initialState: {
        listMode: 'timeline',
        searchTerm: ''
    } as UIReducerInitialState,
    reducers: {
        listModeChanged: (state, action:ListModeChangedAction)=>{
            state.listMode = action.payload;
        },
        searchTermChanged: (state, action:SearchTermChangedAction)=>{
            state.searchTerm = action.payload;
        }
    }
});

const {
    reducer,
    actions
} = slice;

export const {
    listModeChanged,
    searchTermChanged
} = actions;

export const listModeSelector = createSelector(
    (state:RootState)=>state.ui.listMode,
    listMode=>listMode
);

export const searchTermSelector = createSelector(
    (state:RootState)=>state.ui.searchTerm,
    searchTerm=>searchTerm
);

export default reducer;