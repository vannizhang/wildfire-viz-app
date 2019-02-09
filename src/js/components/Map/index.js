import React from 'react';
import {loadModules} from 'esri-loader';

import FireflySymbols from './FireflySymbolsLookup';

const CONTAINER_ID = 'mapViewDiv';
const WEB_MAP_ID = 'ba6c28836375471d8d6233d521f5ef26';

class Map extends React.Component {

    constructor(props){
        super(props);

        console.log('props of Map Component', props);

        this.mapView = null;
        this.activeFiresLayer = null;

        // this.state = {
        //     isSmokeLayerVisible: false
        // }
    };

    initMap(){

        loadModules([
            "esri/views/MapView",
            "esri/WebMap"
        ]).then(([
            MapView, WebMap,
        ])=>{

            this.mapView = new MapView({
                map: new WebMap({
                    portalItem: { 
                        id: WEB_MAP_ID
                    }
                }),
                container: CONTAINER_ID,
                padding: {
                    right: this.props.rightPadding || 0
                }
            });

            this.initLayers();

            this.mapView.when(()=>{
                this.mapViewOnReadyHandler();
            }).catch((err)=>{
                console.error(err)
            });

        }).catch(err=>{
            console.error(err);
        })
    };

    initLayers(){

        loadModules([
            "esri/layers/GraphicsLayer"
        ]).then(([
            GraphicsLayer
        ])=>{

            this.activeFiresLayer = new GraphicsLayer();

            this.mapView.map.addMany([this.activeFiresLayer]);

        }).catch(err=>{
            console.error(err);
        })
    }

    mapViewOnReadyHandler(){
        // console.log('mapview is ready...');
        this.showFires();
    }

    showFires(){
        
        loadModules([
            "esri/Graphic"
        ]).then(([
            Graphic,
        ])=>{

            this.props.activeFires.forEach(feature=>{

                const activeFireFeature = {
                    geometry: {
                        type: 'point',
                        longitude: feature.attributes.LONGITUDE,
                        latitude: feature.attributes.LATITUDE
                    },
                    attributes: feature.attributes,
                };

                const graphicForActiveFire = new Graphic({
                    ...activeFireFeature,
                    symbol: FireflySymbols['default'][feature.classBreak]
                });

                const graphicForBackground = new Graphic({
                    ...activeFireFeature,
                    symbol: FireflySymbols['background'][feature.classBreak]
                });

                this.activeFiresLayer.addMany([graphicForBackground, graphicForActiveFire]);
            });

        }).catch(err=>{
            console.error(err);
        });

        // console.log('show active fires on map...', this.props.activeFires);
    };

    filterActiveFires(){
        // console.log(this.props);

        this.activeFiresLayer.graphics.forEach(graphic=>{

            // if props.selectFireName is empty, show the feature
            // otherwise, only show feature when it's name matches the props.selectFireName
            const isMatchSelectName = !this.props.selectFireName || this.props.selectFireName === graphic.attributes.FIRE_NAME ? true : false;

            const isVisible = isMatchSelectName;

            graphic.visible = isVisible;
            
        });

    };

    componentDidMount(){
        this.initMap();
    };

    // // // no need to rerender the map after data update
    // shouldComponentUpdate(nextProps){
    //     return false;
    // }

    componentDidUpdate(){
        this.filterActiveFires();
    }

    componentDidCatch(error, info) {
        console.error(error, info);
    }

    render(){
        return(
            <div id={CONTAINER_ID} style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            }}></div>
        );
    };

};

export default Map;