import * as React from 'react';
import { useDispatch, useSelector  } from 'react-redux';
// import axios from 'axios';
import App from './App';

import {
    loadWildfires,
    WildfireFeature,
    definitionExpressionSelector
} from '../../store/reducers/wildfires';

import {
    loadWildfireLayerRenderer
} from '../../store/reducers/map';

import {
    getClassBreakRenderer,
    GenerateRendererResponse
} from '../../utils/getClassBreakRenderer';

import {
    MapConfig
} from '../../AppConfig';
import { lastSyncTimeChanged, lastSyncTimeSelector } from '../../store/reducers/UI';


const fecthWildfires = async(definitionExpression:string): Promise<WildfireFeature[]>=>{

    const { WildfiresLayerUrl } = MapConfig;

    const requestUrl = `${WildfiresLayerUrl}/query?f=json&where=${definitionExpression}&outFields=*`;

    try {
        const res = await fetch(requestUrl);

        const data = await res.json();

        const { features } = data;
        return features;

    } catch(err){
        console.error('failed to load wildfires', err);
        return [];
    }
};

const assignClassBreak2WildfireFeatures = (features: WildfireFeature[], classbreakRenderer: GenerateRendererResponse)=>{

    const { classBreakInfos, field } = classbreakRenderer;
    
    return features.map(feature=>{

        for(let i = 0, len = classBreakInfos.length; i < len; i++){

            const value = feature.attributes[field]

            if(value <= classBreakInfos[i].classMaxValue){
                feature.classBreak = i;
                break;
            }
        }

        return feature;
    });
};

const AppContainer:React.FC = ()=>{

    const definitionExpression = useSelector(definitionExpressionSelector);

    const lastSyncTime = useSelector(lastSyncTimeSelector);

    const dispatch = useDispatch();

    const initApp = async()=>{

        const { WildfiresLayerUrl, WildfireLayerClassificationField } = MapConfig;

        const classbreakRenderer = await getClassBreakRenderer({
            url: WildfiresLayerUrl,
            where: definitionExpression,
            classificationField: WildfireLayerClassificationField,
        });
        // console.log(classbreakRenderer);

        const wildfires = await fecthWildfires(definitionExpression);
        // console.log(wildfires);

        const formattedWildfires = assignClassBreak2WildfireFeatures(wildfires, classbreakRenderer);
        // console.log(formattedWildfires);

        dispatch(loadWildfireLayerRenderer(classbreakRenderer));

        dispatch(loadWildfires(formattedWildfires));
    }

    React.useEffect(()=>{
        initApp();
    }, [lastSyncTime]);

    React.useEffect(()=>{
        // console.log(new Date())
        setInterval(()=>{
            dispatch(lastSyncTimeChanged(new Date().getTime()))
        }, 1000 * 60 * 60)
    }, []);

    return (
        <App/>
    );
};

export default AppContainer;