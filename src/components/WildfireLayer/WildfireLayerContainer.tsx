import * as React from 'react';
import { useDispatch, useSelector  } from 'react-redux';
import { 
    updateVisibleFeatures, 
    definitionExpressionSelector,
    feature2FlyToSelector,
    feature2OpenPopupSelector
} from '../../store/reducers/wildfires';

import {
    wildfireLayerRendererSelector
} from '../../store/reducers/map';

import IMapView from 'esri/views/MapView';

import WildfireLayer from './WildfireLayer';

import { MapConfig } from '../../AppConfig';

interface Props {
    mapView?: IMapView
}

const WildfireLayerContainer:React.FC<Props> = ({
    mapView
})=>{

    const dispatch = useDispatch();

    const definitionExpression = useSelector(definitionExpressionSelector);

    const classBreakRenderer = useSelector(wildfireLayerRendererSelector);

    const feature2FlyTo = useSelector(feature2FlyToSelector);

    const feature2OpenPopup = useSelector(feature2OpenPopupSelector);

    const { WildfiresLayerUrl } = MapConfig;

    const visibleFeaturesOnChange = (ids: string[])=>{
        // console.log(objectIds);
        dispatch(updateVisibleFeatures(ids));
    };

    return classBreakRenderer ? (
        <WildfireLayer 
            mapView={mapView}
            url={WildfiresLayerUrl}
            definitionExpression={definitionExpression}
            classBreakRendererInfo={classBreakRenderer}
            feature2FlyTo={feature2FlyTo}
            feature2OpenPopup={feature2OpenPopup}
            visibleFeaturesOnChange={visibleFeaturesOnChange}
        />
    ) : null;
};

export default WildfireLayerContainer;