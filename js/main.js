require([
    "esri/arcgis/utils", 
    "esri/request",
    "esri/arcgis/OAuthInfo",
    "esri/arcgis/Portal",
    "esri/IdentityManager",
    "esri/geometry/Point",
    "esri/geometry/Multipoint",
    "esri/SpatialReference",
    "esri/geometry/screenUtils",

    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",

    "esri/layers/LayerDrawingOptions",
    "esri/renderers/SimpleRenderer",
    "esri/renderers/ClassBreaksRenderer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",

    "esri/TimeExtent",

    "dojo/_base/connect",
    "dojo/domReady!"
], function(
    arcgisUtils, 
    esriRequest,
    OAuthInfo,
    arcgisPortal,
    esriId,
    Point,
    Multipoint,
    SpatialReference,
    screenUtils,

    IdentifyTask, IdentifyParameters,

    LayerDrawingOptions,
    SimpleRenderer,
    ClassBreaksRenderer,
    PictureMarkerSymbol,
    SimpleFillSymbol,
    SimpleLineSymbol,
    Color,

    TimeExtent,

    connect
    // SimpleLineSymbol
){
    $(document).ready(function () {
        // Enforce strict mode
        'use strict';

        //////////////////// App Config Data ////////////////////

        // const WEB_MAP_ID = "60f04046d1dc4cf7a8ff66729d872999";
        const WEB_MAP_ID = 'de31c65a5641422ba9ced5b234ba6e02';
        const WILDFIRE_ACTIVITY_BASE_URL = "https://utility.arcgis.com/usrsvcs/servers/141efcbd82fd4c129f5b784c2bc85229/rest/services/LiveFeeds/Wildfire_Activity/MapServer";
        const REQUEST_URL_WILDFIRE_ACTIVITY = WILDFIRE_ACTIVITY_BASE_URL + "/0/query";
        const REQUEST_URL_WILDFIRE_GENERATE_RENDERER = WILDFIRE_ACTIVITY_BASE_URL + "/dynamicLayer/generateRenderer";

        const LAYER_NAME_ACTIVE_FIRE = 'Active_Fire_Report';
        const LAYER_INDEX_ACTIVE_FIRE_PERIMETER = 2;

        // const OAUTH_APP_ID = "5LTx4lRbinywSMvI";
        const AFFECTED_AREA_FIELD_NAME = 'AREA_';
        const PCT_CONTAINED_FIELD_NAME = 'PER_CONT';
        const FIRE_NAME_FIELD_NAME = 'FIRE_NAME';
        const FIELD_NAME_START_DATE = 'START_DATE';
        const FIELD_NAME_START_DAT_FORMATTED = 'START_DATE_FORMATTED';
        const FIELD_NAME_STATE = 'STATE';
        const FIELD_NAME_LAT = 'LATITUDE';
        const FIELD_NAME_LON = 'LONGITUDE';
        const FIELD_NAME_INTERNAL_ID = 'INTERNALID';

        // dom elements data
        const WILDFIRE_GRID_CONTAINER_ID = 'wildfire-grid-container';
        const WILDFIRE_CARD_CONTAINER_ID = 'wildfire-card-container';
        const WILDFIRE_TIMELINE_CONTAINER_ID = 'wildfire-timeline-container';
        
        // look up tables
        const wildfireLayerSymbolsLookup = {
            "default": [
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyB17.png",
                    "type":"picturemarkersymbol",
                    "height": 15,
                    "width": 15,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyB17.png",
                    "type":"picturemarkersymbol",
                    "height": 25,
                    "width": 25,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyB17.png",
                    "type":"picturemarkersymbol",
                    "height": 35,
                    "width": 35,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyB17.png",
                    "type":"picturemarkersymbol",
                    "height": 45,
                    "width": 45,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyB17.png",
                    "type":"picturemarkersymbol",
                    "height": 55,
                    "width": 55,
                },
            ],
            "background": [
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyC1.png",
                    "type":"picturemarkersymbol",
                    "height": 25,
                    "width": 25,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyC1.png",
                    "type":"picturemarkersymbol",
                    "height": 35,
                    "width": 35,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyC1.png",
                    "type":"picturemarkersymbol",
                    "height": 45,
                    "width": 45,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyC1.png",
                    "type":"picturemarkersymbol",
                    "height": 55,
                    "width": 55,
                },
                {
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyC1.png",
                    "type":"picturemarkersymbol",
                    "height": 65,
                    "width": 65,
                },
            ]
        };
        const stateNamesLookup = {"AL":"Alabama","AK":"Alaska","AS":"American Samoa","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","DC":"District Of Columbia","FM":"Federated States Of Micronesia","FL":"Florida","GA":"Georgia","GU":"Guam","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MH":"Marshall Islands","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","MP":"Northern Mariana Islands","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PW":"Palau","PA":"Pennsylvania","PR":"Puerto Rico","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VI":"Virgin Islands","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};
        //////////////////// End of App Config Data ////////////////////

        const WildFireDataModel = function(){

            this.name = ''; 
            this.extent = null;
            // if true, display inactive fires on map
            this.isInactiveFiresVisible = false; 
            // the renderer used by wildfire activity layer were generated using the "Affected AREA" field in the AGOL Map Viewer, we need to store the classification breaks info
            // so that we can filter the wildfires based on the selected "Affected Area"
            this.affectedAreaRendererBreaks = []; 

            this.setName = (nameStr='')=>{
                this.name = nameStr
            };

            this.setExtent = (extent=null)=>{
                this.extent = extent;
            };

            this.setIsInactiveFiresVisible = (isVisible=false)=>{
                this.isInactiveFiresVisible = isVisible;
            };

            this.setAffectedAreaRendererBreaks = (breaksInfo=[])=>{
                this.affectedAreaRendererBreaks = breaksInfo.map( (breakInfo, index)=>{
                    if(index === 0){
                        breakInfo[0] = 0;
                    }
                    return {
                        'breakInfo': breakInfo,
                        'isVisible': true
                    };
                });
                // console.log(this.affectedAreaRendererBreaks);
            };

            this.setAffectedAreaRendererVisibilityByIndex = (index=-1, isVisible)=>{
                if(index !== -1){
                    this.affectedAreaRendererBreaks[index].isVisible = isVisible;
                }
            };

            this.getAffectedAreaRendererBreaks = ()=>{
                return this.affectedAreaRendererBreaks;
            };

            this.getWhereClause = ()=>{

                // list of where clauses that will be concatenated into the where string for the params,
                // the default one is 'PER_CONT < 100' so it always exclude the wildfires that are 100% contained
                const whereClauseForPctContained = PCT_CONTAINED_FIELD_NAME + " < 100";

                let arrOfWhereClauses = [
                    whereClauseForPctContained
                ];
            
                // generate where clause for Affected AREA if there is any invisible renderer classes, 
                // otherwise, no need to add where clause for Affected AREA so it would show wildfires for all Affected Areas
                const countOfInvisibleRendererClasses = this.affectedAreaRendererBreaks.filter(d=>{ 
                    return !d.isVisible 
                }).length;

                if(countOfInvisibleRendererClasses){

                    const visibleRendererClasses = this.affectedAreaRendererBreaks.filter(d=>{ 
                        return d.isVisible 
                    });

                    // if there is any visible class, generate the where clause using min and max value from item, 
                    // otherwise, use the where clause "area == -1" to exlude all wildfires
                    const whereClauseStrForVisibleRendererClasses = (visibleRendererClasses.length > 0)
                        ? visibleRendererClasses.map((item, idx)=>{
                            const minVal = item.breakInfo[0];
                            const maxVal = item.breakInfo[1];
                            const whereClauseStr = `( ${AFFECTED_AREA_FIELD_NAME} > ${minVal} AND ${AFFECTED_AREA_FIELD_NAME} <= ${maxVal} )`;
                            return whereClauseStr;
                        }).join(' OR ')
                        : `${AFFECTED_AREA_FIELD_NAME} = -1 `;

                    arrOfWhereClauses.push(whereClauseStrForVisibleRendererClasses);
                }

                if(this.name){
                    const whereClauseForName = `${FIRE_NAME_FIELD_NAME} = '${this.name}'`
                    arrOfWhereClauses.push(whereClauseForName);
                }

                // add bracket to each where clause
                arrOfWhereClauses = arrOfWhereClauses.map(item=>{
                    return `(${item})`;
                });

                return arrOfWhereClauses.join(' AND ');
            };

            this.getQueryParams = (shouldReturnGeometry=false)=>{

                const whereClauseStr = this.getWhereClause();

                const params = {
                    f: "json",
                    outFields: "*",
                    where: whereClauseStr,
                    returnGeometry: shouldReturnGeometry
                };

                // add geometry to params using extent
                if(this.extent){
                    const extentJSON = JSON.stringify(this.extent.toJson());
                    params.geometry = extentJSON;
                    params.geometryType = "esriGeometryEnvelope";
                }

                return params;
            };

            this.getRendererBreakIndex = (val)=>{
                val = +val;
                let outputIdx = -1;
                this.affectedAreaRendererBreaks.forEach(function(item, idx){
                    const maxVal = item.breakInfo[1];
                    const minVal = item.breakInfo[0];
                    if(val > minVal && val <= maxVal){
                        outputIdx = idx;
                    }
                });
                return outputIdx;
            };

        };
                
        const WildFireVizApp = function(){
            // let app = this;
            this.map = null;
            this.identifyTask = null;
            this.identifyParams = null;
            this.operationalLayers = []; // layers related to wildfire activities
            this.allWildfires = []; 
            this.allWildfiresLookupTable = {}; // a lookup table of all wildfires data by name
            this.wildfireClassBreakRendererInfo = null;
            this.smokeLayerTimeInfo = null;

            let smokeLayerAnimation = null;
            let smokeLayerAnimationFrameTime = null;
            
            this.startUp = function(){
                // get the class break info that will be used to render the wildfire activity layer
                this.generateClassBreakRendererInfo(AFFECTED_AREA_FIELD_NAME, (response)=>{
                    this.setWildfireClassBreakRendererInfo(response);
                    this._initWebMapByID(WEB_MAP_ID);
                });
            };

            this.setMap = function(map){
                this.map = map;
            };

            this.setSmokeLayerTimeInfo = function(timeInfo){
                this.smokeLayerTimeInfo = timeInfo;
            };

            this.setAllWildfires = function(wildfires){
                this.allWildfires = wildfires.map(d=>{
                    const dateFormatted = moment(d.attributes[FIELD_NAME_START_DATE]).format("MMMM Do, YYYY");
                    d.attributes[FIELD_NAME_START_DAT_FORMATTED] = dateFormatted;
                    return d;
                });
                this.setAllWildfiresLookupTable();
            };

            this.setAllWildfiresLookupTable = function(wildfires){
                const lookupTable = {};
                this.allWildfires.forEach(fire=>{
                    const fireID = fire.attributes[FIELD_NAME_INTERNAL_ID];
                    lookupTable[fireID] = fire;
                });
                this.allWildfiresLookupTable = lookupTable;
            };

            this.getFireDataByID = function(id){
                return this.allWildfiresLookupTable[id];
            };

            // set the operation layers for wildfire activity
            this.setOperationalLayers = function(webMapResponse){
                const operationalLayers = this._getWebMapOperationalLayers(webMapResponse);
                const fireLayers = operationalLayers.filter(layer=>{
                    return layer.title.indexOf('Active_Fire') !== -1;
                });
                const fireLayerRendererBreaks = fireLayers[0].layerObject.layerDrawingOptions[0].renderer.breaks
                this.operationalLayers = operationalLayers;
                wildfireModel.setAffectedAreaRendererBreaks(fireLayerRendererBreaks);
                appView.setFilterLabel(fireLayerRendererBreaks);
            };

            this._initWebMapByID = function(webMapID){
                arcgisUtils.createMap(webMapID, "mapDiv").then(response=>{
                    // set map using the map object from response
                    const map = response.map;
                    connect.disconnect(response.clickEventHandle);

                    this.setMap(map);
                    this.setMapEeventHandlers(map);
                    this.setIdentifyTaskAndParams(map);
                    this.setOperationalLayers(response);
                    
                    this.mapOnReadyHandler();
                });
            };

            // load and render all wildfire once map and operational layers are ready
            this.mapOnReadyHandler = function(){
                const queryParams = wildfireModel.getQueryParams(true);
                this._queryWildfireData(queryParams, fullListOfWildfires=>{
                    // console.log('fullListOfWildfires', fullListOfWildfires);
                    this.setAllWildfires(fullListOfWildfires);
                    this.zoomToExtentOfAllFires();
                });
            };

            this.searchWildfire = function(options={}, onSuccessHandler){
                const queryParams = wildfireModel.getQueryParams(); // this._getQueryParams(whereClause, extentJSON);

                const defaultOnSuccessHandler = (res)=>{
                    const sortedFires = this.sortFiresByFieldName(res, AFFECTED_AREA_FIELD_NAME);
                    appView.populateWildfires(sortedFires);
                    // this.updateFirePerimeterLayer(sortedFires);
                    this._setLayerDefinitionsForWildfireLayer(queryParams.where, sortedFires);
                }
                
                onSuccessHandler = onSuccessHandler || defaultOnSuccessHandler;

                this._queryWildfireData(queryParams, onSuccessHandler);
            };

            this.sortFiresByFieldName = function(fires, fieldName){
                const outputFires = fires;
                outputFires.sort(function(a, b) {
                    return +b.attributes[fieldName] - +a.attributes[fieldName];
                });
                return outputFires;
            };

            this.setWildfireClassBreakRendererInfo = function(classBreakRendererInfo){
                this.wildfireClassBreakRendererInfo = classBreakRendererInfo;
            };

            // get fires data from allWildfires
            this.getListOfFires = function(shouldOnlyReturnFireName, fieldName='', fieldVal=''){
                let outputFires = this.allWildfires;

                if(fieldName){
                    outputFires = outputFires.filter(fire=>{
                        return fire.attributes[fieldName] === fieldVal;
                    });
                }

                if(shouldOnlyReturnFireName){
                    outputFires = outputFires.map(fire=>{
                        return fire.attributes[FIRE_NAME_FIELD_NAME];
                    });
                }

                return outputFires;
            };

            this.getMatchedFireNames = (str='')=>{
                const fireNames = this.getListOfFires(true);
                const textToSearch = new RegExp('^' + str + '.*$', 'i');
                let matchedNames = [];
                if(str.length >= 2){
                    matchedNames = fireNames.filter(function(d, i){
                        return d.match(textToSearch);
                    }).splice(0, 5);
                } 
                return matchedNames;
            };

            this.getFireIdByName = function(fireName){
                const fireData = this.getListOfFires(false, FIRE_NAME_FIELD_NAME, fireName)[0];
                return fireData ? fireData.attributes[FIELD_NAME_INTERNAL_ID]: '';
            };

            this.showInfoWindow = function(fireID=''){
                const fireData = this.getFireDataByID(fireID);
                const fireGeom = this.getFeatureGeometryInWgs84(fireData);
                const fireGeomInScreenPoint = this.convertGeomToScreenPoint(fireGeom);
                const stateCode = fireData.attributes[FIELD_NAME_STATE];
                const stateFullName = stateNamesLookup[stateCode] ? stateNamesLookup[stateCode] : stateCode;
                const lat = +fireData.attributes[FIELD_NAME_LAT].toFixed(2);
                const lon = +fireData.attributes[FIELD_NAME_LON].toFixed(2);;
                const contentHtmlStr = `
                    <div class='customized-popup-header'>
                        <span class='font-size--3'>Start Date: ${fireData.attributes[FIELD_NAME_START_DAT_FORMATTED]}</span>
                        <span class='js-close-info-window icon-ui-close avenir-bold cursor-pointer font-size--3 right'></span>
                    </div>
                    <div class='leader-quarter trailer-quarter'>
                        <p class='trailer-quarter'> 
                            The ${fireData.attributes[FIRE_NAME_FIELD_NAME]} fire is estimated to be ${numberWithCommas(fireData.attributes[AFFECTED_AREA_FIELD_NAME])} acres and <strong>${fireData.attributes[PCT_CONTAINED_FIELD_NAME]}%</strong> contained.
                        </p>
                        <p class='font-size--3 trailer-quarter'>
                            ${stateFullName} (${lat}, ${lon})
                        </p>
                    <div>
                `;
                this.map.infoWindow.setContent(contentHtmlStr);
                this.map.infoWindow.show(fireGeom);
                appView.setSquareReferenceBoxPosition(fireGeomInScreenPoint);
            };

            this.hideInforWindow = function(){
                this.map.infoWindow.hide();
                appView.setSquareReferenceBoxPosition(null);
            };

            this.zoomToFire = function(fireID=''){
                const fireData = this.getFireDataByID(fireID);
                const fireGeom = this.getFeatureGeometryInWgs84(fireData);
                this.map.centerAndZoom(fireGeom, 9);
            }

            this._queryWildfireData = function(params, callback){
                let wildfireDataRequest = esriRequest({
                    url: REQUEST_URL_WILDFIRE_ACTIVITY,
                    content: params,
                    handleAs: "json",
                    callbackParamName: "callback"
                });

                function requestSuccessHandler(response) {
                    callback(response.features);
                }
        
                function requestErrorHandler(error) {
                    console.log("Error: ", error.message);
                }
        
                wildfireDataRequest.then(requestSuccessHandler, requestErrorHandler);
            };

            // create def expression to filter fire perimeter layer using fire names
            this.getDefExpForFirePerimeterLayer = (fires=[])=>{
                const defExp = fires.length 
                    ? fires.map(fire=>{
                        const fireName = fire.attributes[FIRE_NAME_FIELD_NAME].replace("'", " ")
                        return `${FIRE_NAME_FIELD_NAME} = '${fireName}'`;
                    }).join(' OR ')
                    :`${FIRE_NAME_FIELD_NAME} = ''`

                return defExp;
            };

            this._setLayerDefinitionsForWildfireLayer =function(whereClause, queryResults){
                const layerDefs = [whereClause];
                this.operationalLayers.forEach((layer)=>{
                    if(layer.id.indexOf('Wildfire') !== -1){
                        if(layer.title === LAYER_NAME_ACTIVE_FIRE){
                            const defExpForPerimeterLayer = this.getDefExpForFirePerimeterLayer(queryResults);
                            layerDefs[LAYER_INDEX_ACTIVE_FIRE_PERIMETER] = defExpForPerimeterLayer;
                        }
                        layer.layerObject.setLayerDefinitions(layerDefs);
                    }
                });
            };

            this._getWebMapOperationalLayers = function(response){
                const operationalLayers = response.itemInfo.itemData.operationalLayers.filter(function(layer){
                    return layer.layerType === 'ArcGISMapServiceLayer';
                });

                // console.log(operationalLayers);

                // update the drawing options to use firefly style
                operationalLayers.forEach(item=>{
                    if(item.title.indexOf('Active_Fire') !== -1){
                        this.setLayerDrawingOptions(item);
                    }

                    if(item.title.indexOf('SmokeForecast') !== -1){
                        // console.log(item.id);
                        this.setCssStyleForSmokeLayerContainer(item.id);
                        this.setSmokeLayerTimeInfo(item.layerObject.timeInfo);
                    }
                });

                return operationalLayers;
            };

            this.setCssStyleForSmokeLayerContainer = function(layerID){
                const container = $('#mapDiv_' + layerID);
                container.css('filter', 'invert(100%) blur(5px) saturate(.4)');
            };

            this.setMapExtent = function(startTime, endTime){

                startTime = startTime ? new Date(startTime) : this.smokeLayerTimeInfo.timeExtent.startTime;
                endTime = endTime ? new Date(endTime) : startTime;

                let timeExtent = new TimeExtent();
                timeExtent.startTime = startTime;
                timeExtent.endTime = endTime;

                this.map.setTimeExtent(timeExtent);
            };

            this.toggleSmokeLayer = function(){
                const smokeLayer = this.operationalLayers.filter(layer=>{
                    return layer.title.indexOf('SmokeForecast') !== -1
                })[0];

                const isVisible = !smokeLayer.layerObject.visible;

                if(isVisible){
                    this.animateSmokeLayer();
                    smokeLayer.layerObject.show();
                } else {
                    clearInterval(smokeLayerAnimation);
                    smokeLayer.layerObject.hide();
                    appView.updateSmokeLayerTimeVal(null);
                }

                // console.log(smokeLayer);
            }

            this.animateSmokeLayer = function(){

                smokeLayerAnimation = setInterval(()=>{

                    if(!smokeLayerAnimationFrameTime){
                        smokeLayerAnimationFrameTime = this.smokeLayerTimeInfo.timeExtent.startTime;
                    } else {

                        smokeLayerAnimationFrameTime = new Date(smokeLayerAnimationFrameTime);

                        smokeLayerAnimationFrameTime = smokeLayerAnimationFrameTime.setHours(smokeLayerAnimationFrameTime.getHours() + 1);

                        if(smokeLayerAnimationFrameTime > this.smokeLayerTimeInfo.timeExtent.endTime){
                            smokeLayerAnimationFrameTime = this.smokeLayerTimeInfo.timeExtent.startTime;
                        }

                        // console.log(startTime);
                    }

                    let timeDiff = Math.abs(smokeLayerAnimationFrameTime - this.smokeLayerTimeInfo.timeExtent.startTime.getTime()) / 3600000;

                    // console.log(timeDiff);

                    this.setMapExtent(smokeLayerAnimationFrameTime);

                    appView.updateSmokeLayerTimeVal(timeDiff);

                }, 1500);
            }

            this.getWildfireLayerRendererByTitle = function(layerTitle){
                const rendererInfo = JSON.parse(JSON.stringify(this.wildfireClassBreakRendererInfo));
                const symbolsInfo = (layerTitle === LAYER_NAME_ACTIVE_FIRE) ? wildfireLayerSymbolsLookup['default'] : wildfireLayerSymbolsLookup['background'];
                
                rendererInfo.classBreakInfos = rendererInfo.classBreakInfos.map(function(info, index){
                    const symbol = new PictureMarkerSymbol(symbolsInfo[index]);
                    info.symbol = symbol.toJson();
                    return info;
                });

                return new ClassBreaksRenderer(rendererInfo);
            };

            this.getRendererForFirePerimeter = ()=>{
                const sfs = new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol( SimpleLineSymbol.STYLE_SOLID, new Color([103, 0, 67, .9]), 1),
                    new Color([103, 0, 67, .4])
                );
                const renderer = new SimpleRenderer(sfs);
                return renderer;
            };

            this.setLayerDrawingOptions = function(operationalLayer){
                const layer = operationalLayer.layerObject;
                const layerTitle = operationalLayer.title;
                const layerOpacity = (layerTitle === LAYER_NAME_ACTIVE_FIRE) ? .75 : .5;
                const layerDrawingOptions = [];
                const activeFireDrawingOption = this.getLayerDrawingOption(layerTitle);
                layerDrawingOptions[0] = activeFireDrawingOption;

                if(layerTitle === LAYER_NAME_ACTIVE_FIRE){
                    const activeFirePerimeterDrawingOption = this.getLayerDrawingOption(layerTitle, LAYER_INDEX_ACTIVE_FIRE_PERIMETER);
                    layerDrawingOptions[LAYER_INDEX_ACTIVE_FIRE_PERIMETER] = activeFirePerimeterDrawingOption;
                }

                layer.setLayerDrawingOptions(layerDrawingOptions);
                layer.setOpacity(layerOpacity);
            };

            this.getLayerDrawingOption = (layerTitle, layerID=0)=>{
                const layerDrawingOption = new LayerDrawingOptions();
                layerDrawingOption.renderer = (layerID === 0) ? this.getWildfireLayerRendererByTitle(layerTitle) : this.getRendererForFirePerimeter();
                return layerDrawingOption;
            };

            this.zoomToExtentOfAllFires = function(){
                let arrOfWildfirePointLocation = this.allWildfires.map(function(d){
                    return [d.geometry.x, d.geometry.y];
                });
                let multipointForAllWildfires = new Multipoint(new SpatialReference({wkid:102100}));
                multipointForAllWildfires.points = arrOfWildfirePointLocation;
                this.map.setExtent(multipointForAllWildfires.getExtent(), true);
            };

            this.execIdentifyTask = function(mapPoint){
                const onSuccessHandler = this.identifyTaskOnSuccessHandler;
                this.identifyParams.geometry = mapPoint;
                this.identifyParams.mapExtent = this.map.extent;
                this.identifyTask.execute(this.identifyParams, onSuccessHandler)
            };

            this.identifyTaskOnSuccessHandler = (results)=>{
                if(results.length){
                    const fireName = results[0].value;
                    const fireID = this.getFireIdByName(fireName);
                    // console.log(fireID);
                    this.showInfoWindow(fireID);
                }
            };

            this.setIdentifyTaskAndParams = function(map){
                const identifyParams = new IdentifyParameters();
                identifyParams.tolerance = 8;
                identifyParams.returnGeometry = false;
                identifyParams.layerIds = [0];
                identifyParams.width = map.width;
                identifyParams.height = map.height;

                this.identifyParams = identifyParams;
                this.identifyTask = new IdentifyTask(WILDFIRE_ACTIVITY_BASE_URL);
            };

            this.setMapEeventHandlers = function(map){

                map.on("click", (evt)=>{
                    this.hideInforWindow();
                    this.execIdentifyTask(evt.mapPoint);
                });

                map.on('extent-change', (evt)=>{
                    this.hideInforWindow();
                    wildfireModel.setExtent(evt.extent);
                    this.searchWildfire();
                }); 
            };

            this.generateClassBreakRendererInfo = function(classificationField, callback){

                const params = {
                    classificationDef: JSON.stringify({
                        "type":"classBreaksDef",
                        "classificationField": classificationField,
                        "classificationMethod":"esriClassifyNaturalBreaks",
                        "breakCount":5
                    }),
                    layer: JSON.stringify({
                        "source": {
                            "type":"mapLayer",
                            "mapLayerId":0
                        }
                    }),
                    f: 'json',
                    where: '',
                };

                const request = esriRequest({
                    url: REQUEST_URL_WILDFIRE_GENERATE_RENDERER,
                    content: params,
                    handleAs: "json",
                });

                function requestSuccessHandler(response) {
                    callback(response);
                }
        
                function requestErrorHandler(error) {
                    console.log("Error: ", error.message);
                }
        
                request.then(requestSuccessHandler, requestErrorHandler);
            };

            this.getFeatureGeometryInWgs84 = function(feature){
                return new Point( {"x": feature.attributes.LONGITUDE, "y": feature.attributes.LATITUDE, "spatialReference": {"wkid": 4326 } });
            };

            this.convertGeomToScreenPoint = (geom)=>{
                const screenPos = screenUtils.toScreenPoint(this.map.extent, this.map.width, this.map.height, geom);
                return screenPos;
            };

            this.startUp();
        };

        const AppView = function(){

            // cache dom elements
            const $numOfFires = $('.val-holder-num-of-fires');
            const $smokeLayerTimeVal = $('.val-holder-smoke-layer-time');
            const $fireNameSearchInput = $('.fire-name-search-input');
            const $squareReferenceBox = $('.square-reference-box');

            // app view components
            this.wildfireGrids = null;
            this.wildfireTimeline = null;
            // this.wildfireCards = null;
            this.fireNameDropdownMenu = null;

            // state observers
            this.fireDataOberver = null;
            this.fireSummaryInfoVisibilityOberver = null;
            
            this.init = function(){
                this.wildfireGrids = new WildfiresGrid(WILDFIRE_GRID_CONTAINER_ID);
                // this.wildfireCards = new WildfiresCards(WILDFIRE_CARD_CONTAINER_ID);
                this.wildfireTimeline = new WildfiresTimeline(WILDFIRE_TIMELINE_CONTAINER_ID);
                this.fireNameDropdownMenu = new AutoCompleteDropdownMenu('fire-name-dropdown-menu');

                this.initFireDataObserser();
                this.initFireSummaryInfoVisibilityOberver();
            };

            this.initFireDataObserser = function(){
                this.fireDataOberver = new Observable();
                this.fireDataOberver.subscribe(this.wildfireGrids.populate);
                // this.wildfireDataOberver.subscribe(this.wildfireCards.populate);
                this.fireDataOberver.subscribe(this.wildfireTimeline.populate);
                this.fireDataOberver.subscribe(this.updateNumOfFiresVal);
            };

            this.populateWildfires = function(fires=[]){
                this.fireDataOberver.notify(fires);
            };

            this.updateNumOfFiresVal = function(fires=[]){
                $numOfFires.text(fires.length);
            };

            this.updateSmokeLayerTimeVal = function(val){
                const txtStr = Number.isInteger(val) ? ` (+${val} hr)` : '';
                $smokeLayerTimeVal.text(txtStr);
            };

            this.initFireSummaryInfoVisibilityOberver = function(){
                this.fireSummaryInfoVisibilityOberver = new Observable();
                this.fireSummaryInfoVisibilityOberver.subscribe(this.wildfireGrids.toggle);
                this.fireSummaryInfoVisibilityOberver.subscribe(this.wildfireTimeline.toggle);
            };

            this.toggleFireSummaryInfo = function(containerID){
                this.fireSummaryInfoVisibilityOberver.notify(containerID);
            };

            this.setFilterLabel = (breakInfos=[])=>{
                // console.log(breakInfos);
                breakInfos.forEach((d,idx)=>{
                    const labelText = abbreviate_number(+d[1]);
                    const filterLabel = $('.filter-wrap[data-filter-index="' + idx + '"]').find('.filter-label');
                    filterLabel.text(labelText);
                });
            };

            this.setSquareReferenceBoxPosition = (screenPos)=>{

                if(!screenPos){
                    $squareReferenceBox.addClass('hide');
                } else {
                    const posOffset = $squareReferenceBox.width() / 2;
                    $squareReferenceBox.css('top', screenPos.y - posOffset);
                    $squareReferenceBox.css('left', screenPos.x - posOffset);
                    $squareReferenceBox.removeClass('hide');
                    // console.log(screenPos);
                }
            };

            const WildfiresTimeline = function(containerID){

                const conatiner = $('#'+containerID);

                const prepareData = function(fires=[]){
                    const firesByDate = {};
                    const distinctDates = [];

                    fires.sort((a,b)=>{
                        return b.attributes[FIELD_NAME_START_DATE] - a.attributes[FIELD_NAME_START_DATE];
                    });

                    fires.forEach(fire=>{
                        const date = fire.attributes[FIELD_NAME_START_DATE];
                        if(!firesByDate[date]){
                            firesByDate[date] = {
                                startDate: date,
                                fires: [fire],
                                isFirstItemInMonth: false
                            };
                            distinctDates.push(date);
                        } else {
                            firesByDate[date].fires.push(fire);
                        }
                    });

                    fires = distinctDates.map( (d, idx)=>{
                        const prevDate = distinctDates[idx - 1];
                        const isMonFromCurDateDiff = compareMonthVal(d, prevDate);
                        if(isMonFromCurDateDiff){
                            firesByDate[d].isFirstItemInMonth = true;
                        }
                        return firesByDate[d];
                    });

                    return fires;
                };

                const compareMonthVal = (d1, d2)=>{
                    d1 = new Date(d1);
                    d2 = new Date(d2);
                    return (d1 && d2 && d1.getMonth() !== d2.getMonth()) ? true: false; 
                };

                this.toggle = function(targetContainerID){
                    if(targetContainerID === containerID){
                        conatiner.removeClass('hide');
                    } else {
                        conatiner.addClass('hide');
                    }
                };

                this.populate = function(fires=[]){

                    fires = prepareData(fires);

                    const timelineItemsHtml = fires.map((d, idx)=>{

                        const startDate = moment(d.startDate).format("MMM Do");
                        const monthName = moment(d.startDate).format("MMMM");

                        const monthTitleHtmlStr = `
                            <div class='timeline-month-title text-center'>
                                <div class='padding-leader-quarter padding-trailer-quarter '>
                                    <span class'avenir-bold'>${monthName}</span>
                                </div>
                            </div>
                        `;

                        const fireInfoHtmlStrs = d.fires.map(fire=>{
                            const pctContained = fire.attributes[PCT_CONTAINED_FIELD_NAME];
                            const fireName = fire.attributes[FIRE_NAME_FIELD_NAME];
                            const affectedArea = fire.attributes[AFFECTED_AREA_FIELD_NAME];
                            const legendClass = wildfireModel.getRendererBreakIndex(affectedArea);
                            const fireID = fire.attributes[FIELD_NAME_INTERNAL_ID];

                            const htmlStr = `
                                <div class='trailer-1 fire-info'>
                                    <div class='inline-block font-size--3 padding-left-half margin-right-half'><span class='cursor-pointer js-show-info-window js-zoom-to-fire' data-fire-id="${fireID}"><strong>${capitalizeFirstLetter(fireName)} Fire</strong>  - ${pctContained}% contained</span></div>
                                    <div class="legend-icon legend-class-${legendClass}"></div>
                                </div>
                            `;
                            return htmlStr;
                        }).join('');

                        const timelineItemHtmlStr = `
                            ${d.isFirstItemInMonth ? monthTitleHtmlStr : ''}
                            <div class='timeline-item'>
                                <div class='date-info font-size--2'>${startDate}</div>
                                <div class='fire-info-wrap text-right'>
                                    ${fireInfoHtmlStrs}
                                </div>
                            </div>
                        `;

                        return timelineItemHtmlStr;

                    }).join('');
                    
                    conatiner.html(timelineItemsHtml);
                };
            };

            const WildfiresGrid = function(containerID){

                const conatiner = $('#'+containerID);

                this.toggle = function(targetContainerID){
                    if(targetContainerID === containerID){
                        conatiner.removeClass('hide');
                    } else {
                        conatiner.addClass('hide');
                    }
                };

                this.populate = function(fires=[]){

                    const gridItemsHtml = fires.map(function(d) {
                        const pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
                        const fireName = d.attributes[FIRE_NAME_FIELD_NAME];
                        const affectedArea = d.attributes[AFFECTED_AREA_FIELD_NAME];
                        const legendClass = wildfireModel.getRendererBreakIndex(affectedArea);
                        const fireID = d.attributes[FIELD_NAME_INTERNAL_ID];

                        const gridItemHtmlStr = `
                            <div class="js-show-info-window block trailer-half js-zoom-to-fire" data-fire-id="${fireID}">
                                <div class="legend-icon legend-class-${legendClass}">
                                    <div class='bottom-pct-indicator'>
                                        <div class='highlight-bar' style="width: ${pctContained}%;"></div>
                                    </div>
                                </div>
                            </div>
                        `;

                        return gridItemHtmlStr;

                    }).join('');
                    
                    conatiner.html(gridItemsHtml);
                };
            };

            const AutoCompleteDropdownMenu = function(containerID){

                const conatiner = $('#'+containerID);
                const parentContainer = conatiner.parent();

                this.populate = (fires)=>{
                    fires = fires || wildFireVizApp.getListOfFires(true);
                    const dorpdownMenuItemsHtmlStr = fires.map(fire=>{
                        return `<div class='suggestion-item js-set-suggested-item' data-fire-name="${fire}"><span class='font-size--2'>${fire}</span></div>`;
                    }).join('');
                    conatiner.html(dorpdownMenuItemsHtmlStr);
                };

                this.getCountOfDropdownMenuItems = ()=>{
                    return conatiner.children().length;
                }

                this.show = ()=>{
                    conatiner.removeClass('hide');
                    this.toggleIsDropdownVisible(true);
                };

                this.hide = ()=>{
                    conatiner.addClass('hide');
                    this.toggleIsDropdownVisible(false);
                };

                this.toggleDropdownMenu = ()=>{
                    conatiner.toggleClass('hide');

                    const isVisible = !conatiner.hasClass('hide');
                    const isDropdownMenuPopulated = this.getCountOfDropdownMenuItems() ? true : false;

                    if(isVisible && !isDropdownMenuPopulated){
                        this.populate();
                    }

                    this.toggleIsDropdownVisible(isVisible);
                };

                this.setSelectedItem = (fireName='')=>{
                    parentContainer.find('.fire-name-search-input').val(fireName);
                    const isFilled = fireName ? true : false;
                    this.toggleIsSearchInputFilled(isFilled);
                    this.hide();

                    wildfireModel.setName(fireName);
                    wildFireVizApp.searchWildfire();
                };

                this.toggleIsDropdownVisible = (isVisiblefalse)=>{
                    if(isVisiblefalse){
                        parentContainer.addClass('is-dropdown-menu-visible');
                    } else {
                        parentContainer.removeClass('is-dropdown-menu-visible');
                    }
                };

                this.toggleIsSearchInputFilled = (isFilled=false)=>{
                    if(isFilled){
                        parentContainer.addClass('is-search-input-filled');
                    } else {
                        parentContainer.removeClass('is-search-input-filled');
                    }
                };

            };

            // const WildfiresCards = function(containerID){

            //     const conatiner = $('#'+containerID);

            //     this.populate = function(fires=[]){

            //         const cardItemsHtml = fires.map(function(d) {
            //             const pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
            //             const fireName = d.attributes[FIRE_NAME_FIELD_NAME];
            //             const affectedArea = d.attributes[AFFECTED_AREA_FIELD_NAME];
            //             const stateCode = d.attributes[FIELD_NAME_STATE];
            //             const stateFullName = stateNamesLookup[stateCode] ? stateNamesLookup[stateCode] : stateCode;
            //             const lat = +d.attributes[FIELD_NAME_LAT].toFixed(2);
            //             const lon = +d.attributes[FIELD_NAME_LON].toFixed(2);;
            //             const startDate = d.attributes[FIELD_NAME_START_DAT_FORMATTED];
            //             const fireID = d.attributes[FIELD_NAME_INTERNAL_ID];
            //             // const legendClass = wildfireModel.getRendererBreakIndex(affectedArea);

            //             const cardHtmlStr = `
            //                 <div class='card customized-card trailer-half'>
            //                     <div class='card-content'>
            //                         <p class='font-size-0 trailer-0 avenir-bold'>${fireName}</p>
            //                         <p class='font-size--3 leader-quarter trailer-quarter'>Started on ${startDate}, the affected area is estimated to be ${affectedArea} acres and ${pctContained}% contained. </p>
            //                         <p class='js-zoom-to-fire font-size--3 trailer-0 right cursor-pointer' data-fire-id="${fireID}"><span class='icon-ui-map-pin'></span>${stateFullName} (${lat}, ${lon})</p>
            //                     </div>
            //                 </div>
            //             `;

            //             return cardHtmlStr;

            //         }).join('');
                    
            //         conatiner.html(cardItemsHtml);
            //     };
            // };

            const initEventHandlers = (()=>{
                const $body = $('body');

                $body.on('click', '.js-zoom-to-fire', function(){
                    const targetFireID = $(this).attr('data-fire-id');
                    wildFireVizApp.zoomToFire(targetFireID);
                });

                $body.on('mouseenter', '.js-show-info-window', function(){
                    const targetFireID = $(this).attr('data-fire-id');
                    wildFireVizApp.showInfoWindow(targetFireID);
                });

                $body.on('mouseleave', '.js-show-info-window', function(){
                    wildFireVizApp.hideInforWindow();
                });

                $body.on('click', '.js-close-info-window', function(){
                    wildFireVizApp.hideInforWindow();
                });

                $body.on('click', '.js-affected-area-filter', function(){
                    const targetFilter = $(this);
                    targetFilter.toggleClass('checked');
        
                    const targetFilterIndex = +targetFilter.attr('data-filter-index');
                    const isVisible = targetFilter.hasClass('checked');
        
                    wildfireModel.setAffectedAreaRendererVisibilityByIndex(targetFilterIndex, isVisible);
                    wildFireVizApp.searchWildfire();
                });

                $body.on('click', '.js-toggle-fire-summary-info-container', function(){
                    const target = $(this);
                    const targetContainerID = target.attr('data-target-container');
                    target.siblings().removeClass('is-active');
                    target.addClass('is-active');
                    appView.toggleFireSummaryInfo(targetContainerID)
                });

                $body.on('click', '.toggle-suggestion-list-btn', function(){
                    appView.fireNameDropdownMenu.toggleDropdownMenu();
                });

                $body.on('click', '.js-set-suggested-item', function(){
                    const targetFireName = $(this).attr('data-fire-name');
                    appView.fireNameDropdownMenu.setSelectedItem(targetFireName);
                });

                $body.on('click', '.js-clear-suggested-item', function(){
                    appView.fireNameDropdownMenu.setSelectedItem(null);
                    appView.fireNameDropdownMenu.populate();
                });

                $fireNameSearchInput.on('keyup', function(){
                    const currentText = $(this).val();
                    const matchedNames = wildFireVizApp.getMatchedFireNames(currentText);

                    appView.fireNameDropdownMenu.populate(matchedNames);

                    if(currentText){
                        appView.fireNameDropdownMenu.toggleIsSearchInputFilled(true);
                    } else {
                        appView.fireNameDropdownMenu.toggleIsSearchInputFilled(false);
                    }

                    if(matchedNames.length){
                        appView.fireNameDropdownMenu.show();
                    } else {
                        appView.fireNameDropdownMenu.hide();
                    }
                });

                $body.on('click', '.js-toggle-smoke-layer', function(){
                    $('.smoke-layer-toggle-btn').toggleClass('checked');
                    wildFireVizApp.toggleSmokeLayer();
                });

            })();

            this.init();
        };

        const Observable = function(){
            this.observers = [];

            this.subscribe = (f)=>{
              this.observers.push(f);
            };
          
            this.unsubscribe = (f)=>{
              this.observers = this.observers.filter(subscriber => subscriber !== f);
            }

            this.notify = (data)=>{
                // console.log('notify', data);
                this.observers.forEach(observer => observer(data));
            }
        }

        //initialize app
        const wildfireModel = new WildFireDataModel();
        const wildFireVizApp = new WildFireVizApp();
        const appView = new AppView();

        // util functions
        const abbreviate_number = function(num, fixed) {
            if (num === null) { return null; } // terminate early
            if (num === 0) { return '0'; } // terminate early
            fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
            fixed = (num > 10000) ? 0 : 1
            var b = (num).toPrecision(2).split("e"), // get power
                k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
                c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(fixed), // divide by power
                d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
                e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
            return e;
        }

        const numberWithCommas = (x) => {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        function capitalizeFirstLetter(strings) {
            return strings.split(' ').map(s=>{
                s = s.toLowerCase();
                return s.charAt(0).toUpperCase() + s.slice(1);
            }).join(' ');
        }

    });

});

console.log('Love the app? The source code is available on GitHub:', 'https://github.com/vannizhang/wildfire-viz-app');