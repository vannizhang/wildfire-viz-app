import { 
    createSlice,
    createSelector,
    PayloadAction
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
    // last time app synced to source data, whenever this changes, we re-load the app data
    lastSyncTime: number;
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
        searchTerm: '',
        lastSyncTime: new Date().getTime()
    } as UIReducerInitialState,
    reducers: {
        listModeChanged: (state, action:ListModeChangedAction)=>{
            state.listMode = action.payload;
        },
        searchTermChanged: (state, action:SearchTermChangedAction)=>{
            state.searchTerm = action.payload;
        },
        lastSyncTimeChanged: (state, action:PayloadAction<number>)=>{
            state.lastSyncTime = action.payload;
        },
    }
});

const {
    reducer,
    actions
} = slice;

export const {
    listModeChanged,
    searchTermChanged,
    lastSyncTimeChanged
} = actions;

export const listModeSelector = createSelector(
    (state:RootState)=>state.ui.listMode,
    listMode=>listMode
);

export const searchTermSelector = createSelector(
    (state:RootState)=>state.ui.searchTerm,
    searchTerm=>searchTerm
);

export const lastSyncTimeSelector = createSelector(
    (state:RootState)=>state.ui.lastSyncTime,
    lastSyncTime=>lastSyncTime
);

export default reducer;