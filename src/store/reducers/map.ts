import { 
    createSlice,
    createSelector
} from '@reduxjs/toolkit';

import {
    RootState,
    StoreDispatch,
    StoreGetState
} from '../configureStore';

import {
    GenerateRendererResponse
} from '../../utils/getClassBreakRenderer';
import { urlFns } from 'helper-toolkit-ts';
import { HashParamKey } from '../../types';

const dataFromHashParams:{
    [key in HashParamKey]: string
} = urlFns.parseHash();

interface MapReducerInitialState {
    wildfireLayerClassbreakRenderer: GenerateRendererResponse;
    smokeLayerVisible: boolean;
    smokeLayerCurrentTimeExtent: number[]
};

interface WildfireLayerRendererLoadedAction {
    type: string;
    payload: GenerateRendererResponse;
};

interface SmokeLayerVisibleToggledAction {
    type: string;
    payload: null;
}

interface SmokeLayerCurrentTimeExtentChangedAction {
    type: string;
    payload: number[];
}

const slice = createSlice({
    name: 'map',
    initialState: {
        wildfireLayerClassbreakRenderer: null,
        smokeLayerVisible: dataFromHashParams.smokeForecast && dataFromHashParams.smokeForecast === '1',
        smokeLayerCurrentTimeExtent: []
    } as MapReducerInitialState,
    reducers: {
        wildfireLayerRendererLoaded: (state, action:WildfireLayerRendererLoadedAction)=>{
            state.wildfireLayerClassbreakRenderer = action.payload;
        },
        smokeLayerVisibleToggled: (state, action:SmokeLayerVisibleToggledAction)=>{
            state.smokeLayerVisible = !state.smokeLayerVisible;
        },
        smokeLayerCurrentTimeExtentChanged: (state, action:SmokeLayerCurrentTimeExtentChangedAction)=>{
            state.smokeLayerCurrentTimeExtent = action.payload;
        }
    }
});

const {
    reducer,
    actions
} = slice;

const { 
    wildfireLayerRendererLoaded,
} = actions;

export const { 
    smokeLayerVisibleToggled,
    smokeLayerCurrentTimeExtentChanged
} = actions;

export const loadWildfireLayerRenderer = (data:GenerateRendererResponse)=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    if(data){
        dispatch(wildfireLayerRendererLoaded(data));
    }
};

export const wildfireLayerRendererSelector = createSelector(
    (state:RootState)=>state.map.wildfireLayerClassbreakRenderer,
    wildfireLayerClassbreakRenderer=>wildfireLayerClassbreakRenderer
);

export const smokeLayerVisibleSelector = createSelector(
    (state:RootState)=>state.map.smokeLayerVisible,
    smokeLayerVisible=>smokeLayerVisible
);

export const smokeLayerCurrentTimeExtentSelector = createSelector(
    (state:RootState)=>state.map.smokeLayerCurrentTimeExtent,
    smokeLayerCurrentTimeExtent=>smokeLayerCurrentTimeExtent
);

export default reducer;
