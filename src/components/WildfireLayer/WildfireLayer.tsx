import * as React from 'react';
import { loadModules } from 'esri-loader';

import IMapView from 'esri/views/MapView';
import IFeatureLayer from 'esri/layers/FeatureLayer';
import IwatchUtils from 'esri/core/watchUtils';
import IPictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol';
import IClassBreaksRenderer from 'esri/renderers/ClassBreaksRenderer';
import IPoint from 'esri/geometry/Point';
import IGraphic from 'esri/Graphic';
import IFieldInfo from 'esri/popup/FieldInfo';
import ILabelClass from 'esri/layers/support/LabelClass';
import ITextSymbol from 'esri/symbols/TextSymbol';
import IExpressionInfo from 'esri/popup/ExpressionInfo'

import { 
    WildfireFeatureFields,
    WildfireFeature
} from '../../store/reducers/wildfires';

import {
    GenerateRendererResponse
} from '../../utils/getClassBreakRenderer';

import {
    foregroundSymbols,
    backgroundSymbols
} from './FireflySymbolsLookup';

import {
    stringFns
} from 'helper-toolkit-ts';

interface Props {
    url: string;
    definitionExpression?: string;
    classBreakRendererInfo?: GenerateRendererResponse;
    mapView?: IMapView;
    feature2FlyTo: WildfireFeature;
    feature2OpenPopup: WildfireFeature;
    visibleFeaturesOnChange: (ids:string[])=>void
}

const WildfireLayer:React.FC<Props> = ({
    url,
    definitionExpression,
    classBreakRendererInfo,
    mapView,
    feature2FlyTo,
    feature2OpenPopup,
    visibleFeaturesOnChange
})=>{

    const [ wildfireLayer, setWildfireLayer ] = React.useState<IFeatureLayer>();

    const init = async()=>{

        type Modules = [
            typeof IFeatureLayer
        ]; 

        const [
            FeatureLayer,
        ] = await (loadModules([
            'esri/layers/FeatureLayer'
        ]) as Promise<Modules>);

        const [ rendererForeground, rendererBackground ] = await getRenderer();

        const popupTemplate = await getPopupTemplate();

        const labelClass = await getLabelClass();

        const wildfireLayer = new FeatureLayer({
            url,
            definitionExpression,
            renderer: rendererForeground,
            popupTemplate,
            labelingInfo: [ labelClass ]
        });

        const wildfireBackgroundLayer = new FeatureLayer({
            url,
            definitionExpression,
            renderer: rendererBackground,
            labelsVisible: false,
            popupEnabled: false
        });

        mapView.map.addMany([ wildfireBackgroundLayer, wildfireLayer ]);

        wildfireLayer.when(()=>{
            setWildfireLayer(wildfireLayer);
        })
    };

    const getPopupTemplate = async()=>{

        type Modules = [
            typeof IFieldInfo,
            typeof IExpressionInfo
        ]; 

        const [
            FieldInfo,
            ExpressionInfo
        ] = await (loadModules([
            'esri/popup/FieldInfo',
            'esri/popup/ExpressionInfo'
        ]) as Promise<Modules>);

        const title = `Start Date: <b>{${WildfireFeatureFields.FireDiscoveryDateTime}}</b>`;
        const content = `
            <div>
                The <b>{${WildfireFeatureFields.IncidentName}} fire</b> in {${WildfireFeatureFields.POOState}} is
                estimated to be <b>{${WildfireFeatureFields.DailyAcres}} acres</b>
                and <b>{${WildfireFeatureFields.PercentContained}}%</b> contained
            </div>

            <div class='leader-half'>
                <a href='https://news.google.com/search?q={${WildfireFeatureFields.IncidentName}} fire' class='margin-right-half' target='_blank'>News</a>
                <a href='https://twitter.com/search?q={expression/IncidentNameNoSpace}Fire' class='margin-right-half' target='_blank'>Twitter</a>
                <a href='https://www.facebook.com/search/top/?q={${WildfireFeatureFields.IncidentName}} fire' target='_blank'>Facebook</a>
            </div>
        `.trim().replace(/(\r\n|\n|\r)/gm, "");

        const fieldInfos:IFieldInfo[] = [
            new FieldInfo({
                fieldName: WildfireFeatureFields.FireDiscoveryDateTime,
                format: {
                    dateFormat: 'short-date-short-time'
                }
            }),
            new FieldInfo({
                fieldName: WildfireFeatureFields.DailyAcres,
                format: {
                    places: 0,
                    digitSeparator: true
                }
            })
        ];

        const expressionInfos:IExpressionInfo[] = [
            new ExpressionInfo({
                name: "IncidentNameNoSpace",
                expression: `Replace($feature.${WildfireFeatureFields.IncidentName}, ' ', '')`
            })
        ];

        return {
            title,
            content,
            fieldInfos,
            expressionInfos,
            outFields: ["*"]
        }
    };

    const getRenderer = async(): Promise<IClassBreaksRenderer[]>=>{

        type Modules = [
            typeof IClassBreaksRenderer,
            typeof IPictureMarkerSymbol
        ]; 

        const [
            ClassBreaksRenderer,
            PictureMarkerSymbol
        ] = await (loadModules([
            'esri/renderers/ClassBreaksRenderer',
            'esri/symbols/PictureMarkerSymbol'
        ]) as Promise<Modules>);

        const { classBreakInfos, field } = classBreakRendererInfo;

        const classBreaks = classBreakInfos.map((classBreak, index)=>{

            const { label, classMaxValue } = classBreak;

            return {
                minValue: index === 0 ? 0 : classBreakInfos[index - 1].classMaxValue + .1,
                // use a very large number for the max value of last class,
                // because app uses cached renderer, so the updated acrea can sometimes go beyond the max value from renderer
                maxValue: index === classBreakInfos.length - 1 ? 9999999999999 : classMaxValue,
                symbol: null,
                label
            }
        });

        const rendererForeground = new ClassBreaksRenderer({
            field,
            classBreakInfos: classBreaks.map((d, i)=>{
                const { url, height, width } = foregroundSymbols[i];
                d.symbol = new PictureMarkerSymbol({ url, height, width });
                return d;
            })
        });

        const rendererBackground = new ClassBreaksRenderer({
            field,
            classBreakInfos: classBreaks.map((d, i)=>{
                const { url, height, width } = backgroundSymbols[i];
                d.symbol = new PictureMarkerSymbol({ url, height, width });
                return d;
            })
        });

        return [ rendererForeground, rendererBackground ];
    };

    const getLabelClass = async()=>{

        type Modules = [
            typeof ILabelClass,
            typeof ITextSymbol
        ]; 

        const [
            LabelClass,
            TextSymbol
        ] = await (loadModules([
            'esri/layers/support/LabelClass',
            'esri/symbols/TextSymbol'
        ]) as Promise<Modules>);

        return new LabelClass({
            labelExpressionInfo: { 
                expression: `$feature.${WildfireFeatureFields.IncidentName}`
            },
            symbol: new TextSymbol({
                color: "#d18802 ",
                haloColor: "#1a0011",
                haloSize: 3,
                font: { 
                    size: 9,
                    weight: "bold"
                }
            }),
            labelPlacement: 'below-center',
            maxScale: 0,
            minScale: 1390801
        });
    }

    const queryVisibleFeatures = async ()=>{

        const uniqueIdField = WildfireFeatureFields.UniqueFireIdentifier;

        const { features } = await wildfireLayer.queryFeatures({
            geometry: mapView.extent,
            where: definitionExpression,
            outFields: [ uniqueIdField ],
            returnGeometry: false
        });

        const uniqueIds = features.map(f=>f.attributes[uniqueIdField]);

        visibleFeaturesOnChange(uniqueIds);
    };

    const openPopup = async()=>{

        if(!feature2OpenPopup){
            mapView.popup.close();
            return;
        }

        type Modules = [ typeof IPoint, typeof IGraphic ];

        try {
            const [ 
                Point,
                Graphic
            ] = await (loadModules([
                'esri/geometry/Point',
                'esri/Graphic'
            ]) as Promise<Modules>);
            
            const { geometry, attributes } = feature2OpenPopup;

            const { x, y } = geometry;

            const location = new Point({
                longitude: x,
                latitude: y
            });

            const popupTemplate = await getPopupTemplate();

            const featureGraphic = new Graphic({
                attributes,
                popupTemplate
            });

            mapView.popup.open({
                location,
                features: [ featureGraphic ]
                // fetchFeatures: true
            })

        } catch(err){
            console.error(err);
        }

    }

    const addWatchEvent = async()=>{
        type Modules = [typeof IwatchUtils];

        try {
            const [ 
                watchUtils 
            ] = await (loadModules([
                'esri/core/watchUtils'
            ]) as Promise<Modules>);

            watchUtils.whenTrue(mapView, 'stationary', ()=>{
                // console.log('mapview is stationary', mapView.center, mapView.zoom);
                queryVisibleFeatures();
            });

        } catch(err){   
            console.error(err);
        }
    };

    React.useEffect(()=>{
        if(mapView){
            init();
        }
    }, [mapView]);

    React.useEffect(()=>{
        if( mapView && wildfireLayer ){
            addWatchEvent();
        }
    }, [ wildfireLayer ]);

    React.useEffect(()=>{
        if(mapView && feature2FlyTo){

            const { x, y } = feature2FlyTo.geometry;

            mapView.goTo({
                center: [ x, y ],
                zoom: 10
            });
            // console.log()
        }
    }, [feature2FlyTo]);

    React.useEffect(()=>{
        if( mapView && wildfireLayer ){
            openPopup();
        }

    }, [ feature2OpenPopup ])

    return null;
};

export default WildfireLayer;