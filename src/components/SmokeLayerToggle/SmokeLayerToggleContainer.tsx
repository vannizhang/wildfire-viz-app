import * as React from 'react';

import { useDispatch, useSelector  } from 'react-redux';
import {
    toggleSmokeLayer,
    smokeLayerVisibleSelector,
    smokeLayerCurrentTimeExtentSelector,
    smokeLayerFullTimeExtentSelector,
    isSmokeLayerAnimationSelector,
    startSmokeLayerAnimation,
    stopSmokeLayerAnimation,
    setStartTimeByIdx
} from  '../../store/reducers/map';

import SmokeLayerToggle from './SmokeLayerToggle';

const SmokeLayerToggleContainer:React.FC = ()=>{

    const dispatch = useDispatch();

    const isVisible = useSelector(smokeLayerVisibleSelector);

    const isAnimationOn = useSelector(isSmokeLayerAnimationSelector)

    const smokeLayerCurrentTimeExtent = useSelector(smokeLayerCurrentTimeExtentSelector);

    const smokeLayerFullTimeExtent = useSelector(smokeLayerFullTimeExtentSelector);

    return (
        <SmokeLayerToggle 
            currentTime={smokeLayerCurrentTimeExtent?.[0]}
            startTime={smokeLayerFullTimeExtent[0]}
            isVisible={isVisible}
            isAnimationOn={isAnimationOn}
            onClick={()=>{
                dispatch(toggleSmokeLayer());
            }}
            playPauseBtnOnClick={()=>{
                if(isAnimationOn){
                    dispatch(stopSmokeLayerAnimation());
                } else {
                    dispatch(startSmokeLayerAnimation());
                }
            }}
            indicatorOnClick={(idx)=>{
                // console.log(idx)
                dispatch(setStartTimeByIdx(idx))
            }}
        />
    )
};

export default SmokeLayerToggleContainer;