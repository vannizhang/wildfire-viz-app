import { 
    createSlice,
    createSelector,
    PayloadAction
} from '@reduxjs/toolkit';

import { add } from 'date-fns';

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

// const dataFromHashParams:{
//     [key in HashParamKey]: string
// } = urlFns.parseHash();

let interval4smokeLayerAnimation: number;
const SmokeLayerAnimationSpeed = 2000;

interface MapReducerInitialState {
    wildfireLayerClassbreakRenderer: GenerateRendererResponse;
    smokeLayerVisible: boolean;
    smokeLayerCurrentTimeExtent: number[];
    smokeLayerFullTimeExtent: number[]
};

const slice = createSlice({
    name: 'map',
    initialState: {
        wildfireLayerClassbreakRenderer: null,
        smokeLayerVisible: false, //dataFromHashParams.smokeForecast && dataFromHashParams.smokeForecast === '1',
        smokeLayerCurrentTimeExtent: [],
        smokeLayerFullTimeExtent: []
    } as MapReducerInitialState,
    reducers: {
        wildfireLayerRendererLoaded: (state, action:PayloadAction<GenerateRendererResponse>)=>{
            state.wildfireLayerClassbreakRenderer = action.payload;
        },
        smokeLayerVisibleToggled: (state)=>{
            state.smokeLayerVisible = !state.smokeLayerVisible;
        },
        smokeLayerCurrentTimeExtentChanged: (state, action:PayloadAction<number[]>)=>{
            state.smokeLayerCurrentTimeExtent = action.payload;
        },
        smokeLayerFullTimeExtentChanged: (state, action:PayloadAction<number[]>)=>{
            state.smokeLayerFullTimeExtent = action.payload;
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
    smokeLayerCurrentTimeExtentChanged,
    smokeLayerFullTimeExtentChanged
} = actions;

export const loadWildfireLayerRenderer = (data:GenerateRendererResponse)=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    if(data){
        dispatch(wildfireLayerRendererLoaded(data));
    }
};

export const startSmokeLayerAnimation = ()=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    interval4smokeLayerAnimation = setInterval(()=>{
        dispatch(incSmokeLayerTimeExtent())
    }, SmokeLayerAnimationSpeed)
}

export const stopSmokeLayerAnimation = ()=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    clearInterval(interval4smokeLayerAnimation);
}

const incSmokeLayerTimeExtent = ()=>(dispatch:StoreDispatch, getState:StoreGetState)=>{

    const { map } = getState();
    const { smokeLayerFullTimeExtent, smokeLayerCurrentTimeExtent } = map;

    const [ LayerTimeExtentStart, LayerTimeExtentEnd ] = smokeLayerFullTimeExtent;

    let [ startTime ] = smokeLayerCurrentTimeExtent;

    startTime = startTime
        ? add(new Date(startTime), { hours: 1 }).getTime() 
        : LayerTimeExtentStart;
            
    if(startTime > LayerTimeExtentEnd){
        startTime = LayerTimeExtentStart;
    };

    const endTime = add(new Date(startTime), { hours: 1 }).getTime();

    dispatch(smokeLayerCurrentTimeExtentChanged([startTime, endTime]))
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

export const smokeLayerFullTimeExtentSelector = createSelector(
    (state:RootState)=>state.map.smokeLayerFullTimeExtent,
    smokeLayerFullTimeExtent=>smokeLayerFullTimeExtent
);

export default reducer;
