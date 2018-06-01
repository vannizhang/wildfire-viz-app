require([
    "esri/arcgis/utils", 
    "esri/request",
    "esri/arcgis/OAuthInfo",
    "esri/arcgis/Portal",
    "esri/IdentityManager",
    "esri/geometry/Point",
    "esri/geometry/Multipoint",
    "esri/SpatialReference",

    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",

    "esri/layers/LayerDrawingOptions",
    "esri/renderers/ClassBreaksRenderer",
    "esri/symbols/PictureMarkerSymbol",
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

    IdentifyTask, IdentifyParameters,

    LayerDrawingOptions,
    ClassBreaksRenderer,
    PictureMarkerSymbol
){
    $(document).ready(function () {
        // Enforce strict mode
        'use strict';

        //////////////////// App Config Data ////////////////////

        const WEB_MAP_ID = "60f04046d1dc4cf7a8ff66729d872999";
        const WILDFIRE_ACTIVITY_BASE_URL = "https://utility.arcgis.com/usrsvcs/servers/141efcbd82fd4c129f5b784c2bc85229/rest/services/LiveFeeds/Wildfire_Activity/MapServer";
        const REQUEST_URL_WILDFIRE_ACTIVITY = WILDFIRE_ACTIVITY_BASE_URL + "/0/query";
        const REQUEST_URL_WILDFIRE_GENERATE_RENDERER = WILDFIRE_ACTIVITY_BASE_URL + "/dynamicLayer/generateRenderer";
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
                this.affectedAreaRendererBreaks = breaksInfo.map(breakInfo=>{
                    if(breakInfo[0] === breakInfo[1]){
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
                return 5 - outputIdx;
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
                this.operationalLayers = operationalLayers;
                wildfireModel.setAffectedAreaRendererBreaks(operationalLayers[0].layerObject.layerDrawingOptions[0].renderer.breaks);
            };

            this._initWebMapByID = function(webMapID){
                arcgisUtils.createMap(webMapID, "mapDiv").then(response=>{
                    // set map using the map object from response
                    const map = response.map;
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
                    addSearchInputOnTypeEventHandler();
                });
            };

            this.searchWildfire = function(options={}, onSuccessHandler){
                // onSuccessHandler = onSuccessHandler || populateArrayChartForWildfires;
                const defaultOnSuccessHandler = (res)=>{
                    const sortedFires = this.sortFiresByFieldName(res, AFFECTED_AREA_FIELD_NAME);
                    appView.populateWildfires(sortedFires);
                }
                const queryParams = wildfireModel.getQueryParams(); // this._getQueryParams(whereClause, extentJSON);
                onSuccessHandler = onSuccessHandler || defaultOnSuccessHandler;

                this._setLayerDefinitionsForWildfireLayer(queryParams.where);
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

            // this.getArrOfAllWildfires = function(fireNameOnly=false){
            //     const arrOfAllWildfires = (!fireNameOnly)
            //         ? this.allWildfires
            //         : this.allWildfires.map(d=>{
            //             return d.attributes[FIRE_NAME_FIELD_NAME];
            //         })
            //     return arrOfAllWildfires;
            // };

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

            this.showInfoWindow = function(fireID=''){
                const fireData = this.getFireDataByID(fireID);
                const fireGeom = this.getFeatureGeometryInWgs84(fireData);
                const contentHtmlStr = `
                    <div class='customized-popup-header'>
                        <span class='font-size--3'>Start Date: ${moment(fireData.attributes.START_DATE).format("MMMM Do, YYYY")}</span>
                        <span class='js-close-info-window icon-ui-close avenir-bold cursor-pointer font-size--3 right'></span>
                    </div>
                    <div class='leader-quarter trailer-quarter'>
                        <span>
                            The ${fireData.attributes[FIRE_NAME_FIELD_NAME]} fire is estimated to be ${fireData.attributes[AFFECTED_AREA_FIELD_NAME]} acres
                            and <strong>${fireData.attributes[PCT_CONTAINED_FIELD_NAME]}%</strong> contained.
                        </span><br>
                    <div>
                `;
                this.map.infoWindow.setContent(contentHtmlStr);
                this.map.infoWindow.show(fireGeom);
            };

            this.hideInforWindow = function(){
                this.map.infoWindow.hide();
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
                    // addSearchInputOnTypeEventHandler(response.features);
                }
        
                function requestErrorHandler(error) {
                    console.log("Error: ", error.message);
                }
        
                wildfireDataRequest.then(requestSuccessHandler, requestErrorHandler);
            };

            this._setLayerDefinitionsForWildfireLayer =function(whereClause){
                const layerDefs = [whereClause];
                // console.log('setLayerDef', whereClause);
                this.operationalLayers.forEach(function(layer){
                    // console.log(layer);
                    layer.layerObject.setLayerDefinitions(layerDefs);
                });
            };

            this._getWebMapOperationalLayers = function(response){
                const operationalLayers = response.itemInfo.itemData.operationalLayers.filter(function(layer){
                    return layer.layerType === 'ArcGISMapServiceLayer';
                });

                // update the drawing options to use firefly style
                operationalLayers.forEach(item=>{
                    this.setLayerDrawingOptions(item);
                });

                // console.log('renderer.breaks', operationalLayers[0].layerObject.layerDrawingOptions[0].renderer.breaks);
                return operationalLayers;
            };

            this.getWildfireLayerRendererByTitle = function(layerTitle){
                const rendererInfo = JSON.parse(JSON.stringify(this.wildfireClassBreakRendererInfo));
                const symbolsInfo = (layerTitle === 'Active_Fire_Report') ? wildfireLayerSymbolsLookup['default'] : wildfireLayerSymbolsLookup['background'];
                
                rendererInfo.classBreakInfos = rendererInfo.classBreakInfos.map(function(info, index){
                    const symbol = new PictureMarkerSymbol(symbolsInfo[index]);
                    info.symbol = symbol.toJson();
                    return info;
                });

                return new ClassBreaksRenderer(rendererInfo);
            };

            this.setLayerDrawingOptions = function(operationalLayer){
                const layer = operationalLayer.layerObject;
                const layerTitle = operationalLayer.title;
                const layerDrawingOptions = [];
                const layerDrawingOption = new LayerDrawingOptions();
                const layerOpacity = (layerTitle === 'Active_Fire_Report') ? .75 : .5;

                layerDrawingOption.renderer = this.getWildfireLayerRendererByTitle(layerTitle);
                layerDrawingOptions[0] = layerDrawingOption;
                layer.setLayerDrawingOptions(layerDrawingOptions);
                layer.setOpacity(layerOpacity);
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
                    this.showInfoWindow(fireName);
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
                    this.execIdentifyTask(evt.mapPoint);
                });

                map.on('extent-change', (evt)=>{
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

            this.startUp();
        };

        // function populateArrayChartForWildfires(wildfireData){
        //     // console.log('calling populateArrayChartForWildfires', wildfireData);
        //     var legendGrid = $('.legend-grid');
        //     var legendIcons = [];
        //     wildfireData.sort(function(a, b) {
        //         return +b.attributes[AFFECTED_AREA_FIELD_NAME] - +a.attributes[AFFECTED_AREA_FIELD_NAME];
        //     });
        //     // //only show top numbers of wildfires in the list
        //     // var wildfireDataToPopulate = wildfireData.filter(function(d, i){
        //     //     return i < 60;
        //     // });
        //     wildfireData.forEach(function(d) {
        //         var legendClass;
        //         var area = d.attributes[AFFECTED_AREA_FIELD_NAME];
        //         var pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
        //         if(area >= 110720){
        //             legendClass = 1;
        //         } else if(area < 110720 && area >= 40906){
        //             legendClass = 2;
        //         } else if(area < 40906 && area >= 11067){
        //             legendClass = 3;
        //         } else {
        //             legendClass = 4;
        //         }
        //         var legendIconStr = `
        //             <div class="legend-grid-item block trailer-half">
        //                 <div class="legend-icon legend-class-${legendClass}">
        //                     <div class='bottom-pct-indicator'>
        //                         <div class='highlight-bar' style="width: ${pctContained}%;"></div>
        //                     </div>
        //                 </div>
        //             </div>
        //         `;
        //         legendIcons.push(legendIconStr);
        //     });

        //     var legendGridItems = $(legendIcons.join(''));
        //     legendGrid.empty();
        //     legendGrid.append(legendGridItems);
        //     // console.log(wildfireDataToPopulate);

        //     legendGridItems.on('mouseover', function(evt){
        //         var itemIdx = $(this).index();
        //         var selectedFeature = wildfireData[itemIdx];
        //         var selectedFeatureGeom = new Point( {"x": selectedFeature.attributes.LONGITUDE, "y": selectedFeature.attributes.LATITUDE, "spatialReference": {"wkid": 4326 } });
        //         var contentHtmlStr = `
        //             <div class='customized-popup-header'>
        //                 <span class='font-size--3'>Start Date: ${moment(selectedFeature.attributes.START_DATE).format("MMMM Do, YYYY")}</span>
        //                 <span class='icon-ui-close avenir-bold font-size--3 right'></span>
        //             </div>
        //             <div class='leader-quarter trailer-quarter'>
        //                 <span>
        //                     The ${selectedFeature.attributes[FIRE_NAME_FIELD_NAME]} fire is estimated to be ${selectedFeature.attributes.AREA_} acres
        //                     and <strong>${selectedFeature.attributes.PER_CONT}%</strong> contained.
        //                 </span><br>
        //             <div>
        //         `;
        //         wildFireVizApp.map.infoWindow.setContent(contentHtmlStr);
        //         wildFireVizApp.map.infoWindow.show(selectedFeatureGeom);
        //     });

        //     legendGridItems.on('mouseout', function(evt){
        //         wildFireVizApp.map.infoWindow.hide();
        //     });

        //     addClickHandlerToLegendGridItems(wildfireData);
        // }

        // function addClickHandlerToLegendGridItems(wildfireData){
        //     $('.legend-grid-item').on('click', function(evt){
        //         var itemIdx = $(this).index();
        //         var selectedFeature = wildfireData[itemIdx];
        //         var selectedFeatureGeom = new Point( {"x": selectedFeature.attributes.LONGITUDE, "y": selectedFeature.attributes.LATITUDE, "spatialReference": {"wkid": 4326 } });
        //         wildFireVizApp.map.centerAndZoom(selectedFeatureGeom, 10);
        //     });
        // }

        function populateSuggestionList(arrOfSuggestedFireNames, inputTextValue){
            var suggestionListContainer = $('.suggestion-list-container');
            suggestionListContainer.empty();
            if(arrOfSuggestedFireNames.length){
                arrOfSuggestedFireNames = arrOfSuggestedFireNames.map(function(d){
                    return "<div class='suggestion-item'><span class='font-size--2'>" + d + "</span></div>"
                });
                suggestionListContainer.append(arrOfSuggestedFireNames.join(''));
                // suggestionListContainer.removeClass('hide');
                toggleSuggestionList(true);
                addClickEventHandlerToSuggestionListItems(suggestionListContainer);
            } else {
                suggestionListContainer.addClass('hide');
                if(!inputTextValue){
                    wildFireVizApp.searchWildfire();
                }
            }
        }

        function addClickEventHandlerToSuggestionListItems(suggestionListContainer){
            suggestionListContainer.find('.suggestion-item').on('click', function(evt){
                var itemText = $(this).text();
                $('.fire-name-search-input').val(itemText);
                // wildFireVizApp.setSelectedFireName(itemText);
                wildfireModel.setName(itemText);

                toggleSearchBtnIcon(itemText);
                toggleSuggestionList(false);
                // suggestionListContainer.addClass('hide');
                wildFireVizApp.searchWildfire();
            });
        }

        function addSearchInputOnTypeEventHandler(){
            $('.fire-name-search-input').unbind('keyup').on( "keyup", fireNameSearchInputOnKeyupHandler); 
            // console.log(arrOfWildfireNames);
        }

        function fireNameSearchInputOnKeyupHandler(evt){
            // let arrOfWildfireNames = wildFireVizApp.getArrOfAllWildfires(true);
            let arrOfWildfireNames = wildFireVizApp.getListOfFires(true);
            let currentText = $(this).val();
            let textToSearch = new RegExp('^' + currentText + '.*$', 'i');
            let matchedNames = [];
            if(currentText.length >= 2){
                matchedNames = arrOfWildfireNames.filter(function(d, i){
                    return d.match(textToSearch);
                }).splice(0, 5);
            } 
            // wildFireVizApp.setSelectedFireName(currentText);
            wildfireModel.setName(currentText);

            toggleSearchBtnIcon(currentText);
            populateSuggestionList(matchedNames, currentText);
        }

        function affectedAreaFilterOnClickHandler(evt){
            const targetFilter = $(this);
            targetFilter.toggleClass('checked ');

            const targetFilterIndex = +targetFilter.attr('data-filter-index');
            const isTargetFilterChecked = targetFilter.hasClass('checked');

            const targetCBox = targetFilter.find('.fa');
            if(isTargetFilterChecked){
                targetCBox.addClass('fa-check-square-o');
                targetCBox.removeClass('fa-square-o');
            } else {
                targetCBox.removeClass('fa-check-square-o');
                targetCBox.addClass('fa-square-o');
            }

            wildfireModel.setAffectedAreaRendererVisibilityByIndex(targetFilterIndex, isTargetFilterChecked);
            wildFireVizApp.searchWildfire();
        }

        function searchBtnOnClickHandler(evt){
            let searchBtn = $(this);
            let searchBtnIcon = searchBtn.find('.fa');
            let isClickToClickSearchText = searchBtnIcon.hasClass('fa-times');

            if(isClickToClickSearchText){
                $('.fire-name-search-input').val('');
                // wildFireVizApp.setSelectedFireName(null);
                wildfireModel.setName(null);

                toggleSearchBtnIcon(null);
                wildFireVizApp.searchWildfire();
            } 
        }

        function toggleSuggestionListBtnOnClickHandler(){
            let isSuggestionListInvisible = $('.suggestion-list-container').hasClass('hide');

            if(isSuggestionListInvisible){
                // let arrOfWildfireNames = wildFireVizApp.getArrOfAllWildfires(true);
                let arrOfWildfireNames = wildFireVizApp.getListOfFires(true);
                populateSuggestionList(arrOfWildfireNames);
            } else {
                toggleSuggestionList(false);
            }
        }

        function updateToggleSuggestionListBtnIcon(){
            let isSuggestionListInvisible = $('.suggestion-list-container').hasClass('hide');
            let targetBtn = $('.toggle-suggestion-list-btn');
            let toggleSuggestionListBtnIcon = targetBtn.find('.fa');
            if(isSuggestionListInvisible){
                toggleSuggestionListBtnIcon.addClass('fa-caret-down');
                toggleSuggestionListBtnIcon.removeClass('fa-caret-up');
            } else {
                toggleSuggestionListBtnIcon.addClass('fa-caret-up');
                toggleSuggestionListBtnIcon.removeClass('fa-caret-down');
            }
        }

        function toggleSuggestionList(isVisible){
            var suggestionListContainer = $('.suggestion-list-container');
            if(isVisible){
                suggestionListContainer.removeClass('hide');
            } else {
                suggestionListContainer.addClass('hide');
            }   
            updateToggleSuggestionListBtnIcon();
        }

        function toggleSearchBtnIcon(selectedFireName){
            // let selectedFireName = wildFireVizApp.getSelectedFireName();
            let searchBtn = $('.search-by-name-btn');
            let searchBtnIcon = searchBtn.find('.fa');
            if(selectedFireName){
                searchBtnIcon.addClass('fa-times');
                searchBtnIcon.removeClass('fa-search');
            } else {
                searchBtnIcon.removeClass('fa-times');
                searchBtnIcon.addClass('fa-search'); 
                toggleSuggestionList(false);
            }
        }

        //attach app event handlers
        $('.js-affected-area-filter').on('click', affectedAreaFilterOnClickHandler);

        $('.search-by-name-btn').on('click', searchBtnOnClickHandler);

        $('.toggle-suggestion-list-btn').on('click', toggleSuggestionListBtnOnClickHandler);


        const AppView = function(){

            this.wildfireGrids = null;
            this.wildfireCards = null;

            this.init = function(){
                this.wildfireGrids = new WildfiresGrid(WILDFIRE_GRID_CONTAINER_ID);
                this.wildfireCards = new WildfiresCards(WILDFIRE_CARD_CONTAINER_ID);
            };

            this.populateWildfires = function(fires=[]){
                console.log(fires);
                this.wildfireGrids.populate(fires);
                this.wildfireCards.populate(fires);
            };

            const WildfiresGrid = function(containerID){

                const conatiner = $('#'+containerID);

                this.populate = function(fires=[]){

                    const gridItemsHtml = fires.map(function(d) {
                        const pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
                        const fireName = d.attributes[FIRE_NAME_FIELD_NAME];
                        const affectedArea = d.attributes[AFFECTED_AREA_FIELD_NAME];
                        const legendClass = wildfireModel.getRendererBreakIndex(affectedArea);
                        const fireID = d.attributes[FIELD_NAME_INTERNAL_ID];

                        const gridItemHtmlStr = `
                            <div class="legend-grid-item block trailer-half" data-fire-id="${fireID}">
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

            const WildfiresCards = function(containerID){

                const conatiner = $('#'+containerID);

                this.populate = function(fires=[]){

                    const cardItemsHtml = fires.map(function(d) {
                        const pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
                        const fireName = d.attributes[FIRE_NAME_FIELD_NAME];
                        const affectedArea = d.attributes[AFFECTED_AREA_FIELD_NAME];
                        const stateCode = d.attributes[FIELD_NAME_STATE];
                        const stateFullName = stateNamesLookup[stateCode] ? stateNamesLookup[stateCode] : stateCode;
                        const lat = +d.attributes[FIELD_NAME_LAT].toFixed(2);
                        const lon = +d.attributes[FIELD_NAME_LON].toFixed(2);;
                        const startDate = d.attributes[FIELD_NAME_START_DAT_FORMATTED];
                        const fireID = d.attributes[FIELD_NAME_INTERNAL_ID];
                        // const legendClass = wildfireModel.getRendererBreakIndex(affectedArea);

                        const cardHtmlStr = `
                            <div class='card customized-card trailer-half'>
                                <div class='card-content'>
                                    <p class='font-size-0 trailer-0 avenir-bold'>${fireName}</p>
                                    <p class='font-size--3 leader-quarter trailer-quarter'>Started on ${startDate}, the affected area is estimated to be ${affectedArea} acres and ${pctContained}% contained. </p>
                                    <p class='font-size--3 trailer-0 right cursor-pointer' data-fire-id="${fireID}"><span class='icon-ui-map-pin'></span>${stateFullName} (${lat}, ${lon})</p>
                                </div>
                            </div>
                        `;

                        return cardHtmlStr;

                    }).join('');
                    
                    conatiner.html(cardItemsHtml);
                };
            };

            const initEventHandlers = (function(){
                const $body = $('body');

                $body.on('click', '.legend-grid-item', function(){
                    const targetFireID = $(this).attr('data-fire-id');
                    wildFireVizApp.zoomToFire(targetFireID);
                });

                $body.on('mouseenter', '.legend-grid-item', function(){
                    const targetFireID = $(this).attr('data-fire-id');
                    wildFireVizApp.showInfoWindow(targetFireID);
                });

                $body.on('mouseleave', '.legend-grid-item', function(){
                    wildFireVizApp.hideInforWindow();
                });

                $body.on('click', '.js-close-info-window', function(){
                    wildFireVizApp.hideInforWindow();
                })

            })();

            this.init();
        };

        //initialize app
        const wildfireModel = new WildFireDataModel();
        const wildFireVizApp = new WildFireVizApp();
        const appView = new AppView();

    });

});