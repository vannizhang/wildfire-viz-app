import { 
    createSlice,
    createSelector,
    PayloadAction,
} from '@reduxjs/toolkit';

import { add, differenceInMinutes } from 'date-fns';

import {
    RootState,
    StoreDispatch,
    StoreGetState
} from '../configureStore';

import {
    GenerateRendererResponse
} from '../../utils/getClassBreakRenderer';

// const dataFromHashParams:{
//     [key in HashParamKey]: string
// } = urlFns.parseHash();

let interval4smokeLayerAnimation: number;
const SmokeLayerAnimationSpeed = 3000;

interface MapReducerInitialState {
    wildfireLayerClassbreakRenderer: GenerateRendererResponse;
    smokeLayerVisible: boolean;
    smokeLayerCurrentTimeExtent: number[];
    smokeLayerFullTimeExtent: number[];
    isSmokeLayerAnimation: boolean;
};

const slice = createSlice({
    name: 'map',
    initialState: {
        wildfireLayerClassbreakRenderer: null,
        smokeLayerVisible: false, //dataFromHashParams.smokeForecast && dataFromHashParams.smokeForecast === '1',
        smokeLayerCurrentTimeExtent: [],
        smokeLayerFullTimeExtent: [],
        isSmokeLayerAnimation: false
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
        },
        isSmokeLayerAnimationToggled: (state)=>{
            state.isSmokeLayerAnimation = !state.isSmokeLayerAnimation;
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
    smokeLayerFullTimeExtentChanged,
    isSmokeLayerAnimationToggled
} = actions;

export const loadWildfireLayerRenderer = (data:GenerateRendererResponse)=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    if(data){
        dispatch(wildfireLayerRendererLoaded(data));
    }
};

export const loadSmokeLayerFullTimeExtent = (timeExtent:number[])=>(dispatch:StoreDispatch, getState:StoreGetState)=>{

    const now = new Date();

    let [startTime, endTime] = timeExtent;

    while(startTime < endTime){

        const diff = differenceInMinutes(startTime, now)

        if(diff >= 0 && diff < 60){
            break;
        }

        startTime = add(new Date(startTime), { hours: 1 }).getTime();
    }

    endTime = add(new Date(startTime), { hours: 23 }).getTime()

    dispatch(smokeLayerFullTimeExtentChanged([startTime, endTime]))
};

export const toggleSmokeLayer = ()=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    dispatch(smokeLayerVisibleToggled())
}

export const startSmokeLayerAnimation = ()=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    dispatch(isSmokeLayerAnimationToggled())

    interval4smokeLayerAnimation = setInterval(()=>{
        dispatch(incSmokeLayerTimeExtent())
    }, SmokeLayerAnimationSpeed)
}

export const stopSmokeLayerAnimation = ()=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    dispatch(isSmokeLayerAnimationToggled())
    clearInterval(interval4smokeLayerAnimation);
}

export const setStartTimeByIdx = (idx:number)=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    const { map } = getState();
    const { smokeLayerFullTimeExtent } = map;

    const [ LayerTimeExtentStart ] = smokeLayerFullTimeExtent;

    const startTime = add(new Date(LayerTimeExtentStart), { hours: idx }).getTime() 

    const endTime = add(new Date(startTime), { hours: 1 }).getTime();

    dispatch(smokeLayerCurrentTimeExtentChanged([startTime, endTime]))
            
}

const incSmokeLayerTimeExtent = ()=>(dispatch:StoreDispatch, getState:StoreGetState)=>{

    const { map } = getState();
    const { smokeLayerFullTimeExtent, smokeLayerCurrentTimeExtent, smokeLayerVisible } = map;

    if(!smokeLayerVisible){
        return;
    }

    const [ LayerTimeExtentStart, LayerTimeExtentEnd ] = smokeLayerFullTimeExtent;

    let [ startTime ] = smokeLayerCurrentTimeExtent;

    startTime = startTime && startTime >= LayerTimeExtentStart
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

export const isSmokeLayerAnimationSelector = createSelector(
    (state:RootState)=>state.map.isSmokeLayerAnimation,
    isSmokeLayerAnimation=>isSmokeLayerAnimation
);


export default reducer;
