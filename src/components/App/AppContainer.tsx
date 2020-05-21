import * as React from 'react';
import { useDispatch, useSelector  } from 'react-redux';
import axios from 'axios';
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

const AppContainer:React.FC = ()=>{

    const definitionExpression = useSelector(definitionExpressionSelector);

    const dispatch = useDispatch();

    const initApp = async()=>{

        const { WildfiresLayerUrl, WildfireLayerClassificationField } = MapConfig;

        const classbreakRenderer = await getClassBreakRenderer({
            url: WildfiresLayerUrl,
            where: definitionExpression,
            classificationField: WildfireLayerClassificationField,
        });
        // console.log(classbreakRenderer);

        const wildfires = await fecthWildfires();
        // console.log(wildfires);

        const formattedWildfires = assignClassBreak2WildfireFeatures(wildfires, classbreakRenderer);
        // console.log(formattedWildfires);

        dispatch(loadWildfireLayerRenderer(classbreakRenderer));

        dispatch(loadWildfires(formattedWildfires));
    }

    const fecthWildfires = async(): Promise<WildfireFeature[]>=>{

        const { WildfiresLayerUrl } = MapConfig;

        const requestUrl = `${WildfiresLayerUrl}/query?f=json&where=${definitionExpression}&outFields=*`;
    
        try {
            const { data } = await axios.get(requestUrl);
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
                if(feature.attributes[field] <= classBreakInfos[i].classMaxValue){
                    feature.classBreak = i;
                    break;
                }
            }

            return feature;
        });
    };

    React.useEffect(()=>{
        initApp();
    }, []);

    return (
        <App/>
    );
};

export default AppContainer;