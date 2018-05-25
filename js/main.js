require([
    "esri/arcgis/utils", 
    "esri/request",
    "esri/arcgis/OAuthInfo",
    "esri/arcgis/Portal",
    "esri/IdentityManager",
    "esri/geometry/Point",
    "esri/geometry/Multipoint",
    "esri/SpatialReference",

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

    LayerDrawingOptions,
    ClassBreaksRenderer,
    PictureMarkerSymbol
){
    $(document).ready(function () {
        // Enforce strict mode
        'use strict';

        // App Config Data
        const WEB_MAP_ID = "60f04046d1dc4cf7a8ff66729d872999";
        const WILDFIRE_ACTIVITY_BASE_URL = "https://utility.arcgis.com/usrsvcs/servers/141efcbd82fd4c129f5b784c2bc85229/rest/services/LiveFeeds/Wildfire_Activity/MapServer";
        const REQUEST_URL_WILDFIRE_ACTIVITY = WILDFIRE_ACTIVITY_BASE_URL + "/0/query";
        const REQUEST_URL_WILDFIRE_GENERATE_RENDERER = WILDFIRE_ACTIVITY_BASE_URL + "/dynamicLayer/generateRenderer";
        // const OAUTH_APP_ID = "5LTx4lRbinywSMvI";
        const AFFECTED_AREA_FIELD_NAME = 'AREA_';
        const PCT_CONTAINED_FIELD_NAME = 'PER_CONT';
        const FIRE_NAME_FIELD_NAME = 'FIRE_NAME';

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
            }

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
                            const whereClauseStr = `( ${AFFECTED_AREA_FIELD_NAME} >= ${minVal} AND ${AFFECTED_AREA_FIELD_NAME} < ${maxVal} )`;
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

        };
                
        const WildFireVizApp = function(){
            // let app = this;
            this.map = null;
            this.operationalLayers = []; // layers related to wildfire activities
            this.arrOfAllWildfires = [];
            this.wildfireClassBreakRendererInfo = null;
            
            this.startUp = function(){
                // get the class break info that will be used to render the wildfire activity layer
                this.generateClassBreakRendererInfo(AFFECTED_AREA_FIELD_NAME, (response)=>{
                    this.setWildfireClassBreakRendererInfo(response);
                    this._initWebMapByID(WEB_MAP_ID);
                });
            };

            this._initWebMapByID = function(webMapID){
                arcgisUtils.createMap(webMapID, "mapDiv").then(response=>{
                    // set map object for the app
                    this.map = response.map;
                    this._addExtentChangeEventHandlerToMap(this.map);

                    // set the operation layers for wildfire activity
                    const operationalLayers = this._getWebMapOperationalLayers(response);
                    const wildfireLayerRendererBreaksInfo = operationalLayers[0].layerObject.layerDrawingOptions[0].renderer.breaks;
                    this.operationalLayers = operationalLayers;
                    wildfireModel.setAffectedAreaRendererBreaks(wildfireLayerRendererBreaksInfo);
                    // console.log(wildfireLayerRendererBreaksInfo);

                    // load all wildfire
                    const queryParams = wildfireModel.getQueryParams(true);
                    this._queryWildfireData(queryParams, fullListOfWildfires=>{
                        // console.log('fullListOfWildfires', fullListOfWildfires);
                        this._setArrOfAllWildfires(fullListOfWildfires);
                        this._zoomToExtentOfAllFires(fullListOfWildfires);
                        addSearchInputOnTypeEventHandler();
                    })
                });
            }

            this.searchWildfire = function(options={}, onSuccessHandler){
                onSuccessHandler = onSuccessHandler || populateArrayChartForWildfires;
                const queryParams = wildfireModel.getQueryParams(); // this._getQueryParams(whereClause, extentJSON);

                this._setLayerDefinitionsForWildfireLayer(queryParams.where);
                this._queryWildfireData(queryParams, onSuccessHandler);
            }

            this.setWildfireClassBreakRendererInfo = function(classBreakRendererInfo){
                this.wildfireClassBreakRendererInfo = classBreakRendererInfo;
            };

            this._setArrOfAllWildfires = function(wildfires){
                this.arrOfAllWildfires = wildfires;
            }

            this.getArrOfAllWildfires = function(fireNameOnly=false){
                let arrOfAllWildfires = (!fireNameOnly)
                    ? this.arrOfAllWildfires
                    : this.arrOfAllWildfires.map(d=>{
                        return d.attributes[FIRE_NAME_FIELD_NAME];
                    })
                return arrOfAllWildfires;
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

            this._zoomToExtentOfAllFires = function(fullListOfWildfires){
                let arrOfWildfirePointLocation = fullListOfWildfires.map(function(d){
                    return [d.geometry.x, d.geometry.y];
                });
                let multipointForAllWildfires = new Multipoint(new SpatialReference({wkid:102100}));
                multipointForAllWildfires.points = arrOfWildfirePointLocation;
                this.map.setExtent(multipointForAllWildfires.getExtent(), true);
            };

            this._addExtentChangeEventHandlerToMap = function(map){
                map.on('extent-change', evt=>{
                    const currentMapExtent = evt.extent;
                    wildfireModel.setExtent(currentMapExtent);
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

        };

        function populateArrayChartForWildfires(wildfireData){
            // console.log('calling populateArrayChartForWildfires', wildfireData);
            var legendGrid = $('.legend-grid');
            var legendIcons = [];
            wildfireData.sort(function(a, b) {
                return +b.attributes[AFFECTED_AREA_FIELD_NAME] - +a.attributes[AFFECTED_AREA_FIELD_NAME];
            });
            // //only show top numbers of wildfires in the list
            // var wildfireDataToPopulate = wildfireData.filter(function(d, i){
            //     return i < 60;
            // });
            wildfireData.forEach(function(d) {
                var legendClass;
                var area = d.attributes[AFFECTED_AREA_FIELD_NAME];
                var pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
                if(area >= 110720){
                    legendClass = 1;
                } else if(area < 110720 && area >= 40906){
                    legendClass = 2;
                } else if(area < 40906 && area >= 11067){
                    legendClass = 3;
                } else {
                    legendClass = 4;
                }
                var legendIconStr = `
                    <div class="legend-grid-item block trailer-half">
                        <div class="legend-icon legend-class-${legendClass}">
                            <div class='bottom-pct-indicator'>
                                <div class='highlight-bar' style="width: ${pctContained}%;"></div>
                            </div>
                        </div>
                    </div>
                `;
                legendIcons.push(legendIconStr);
            });

            var legendGridItems = $(legendIcons.join(''));
            legendGrid.empty();
            legendGrid.append(legendGridItems);
            // console.log(wildfireDataToPopulate);

            legendGridItems.on('mouseover', function(evt){
                var itemIdx = $(this).index();
                var selectedFeature = wildfireData[itemIdx];
                var selectedFeatureGeom = new Point( {"x": selectedFeature.attributes.LONGITUDE, "y": selectedFeature.attributes.LATITUDE, "spatialReference": {"wkid": 4326 } });
                var contentHtmlStr = `
                    <div class='customized-popup-header'>
                        <span class='font-size--3'>Start Date: ${moment(selectedFeature.attributes.START_DATE).format("MMMM Do, YYYY")}</span>
                        <span class='icon-ui-close avenir-bold font-size--3 right'></span>
                    </div>
                    <div class='leader-quarter trailer-quarter'>
                        <span>
                            The ${selectedFeature.attributes[FIRE_NAME_FIELD_NAME]} fire is estimated to be ${selectedFeature.attributes.AREA_} acres
                            and <strong>${selectedFeature.attributes.PER_CONT}%</strong> contained.
                        </span><br>
                    <div>
                `;
                wildFireVizApp.map.infoWindow.setContent(contentHtmlStr);
                wildFireVizApp.map.infoWindow.show(selectedFeatureGeom);
            });

            legendGridItems.on('mouseout', function(evt){
                wildFireVizApp.map.infoWindow.hide();
            });

            addClickHandlerToLegendGridItems(wildfireData);
        }

        function addClickHandlerToLegendGridItems(wildfireData){
            $('.legend-grid-item').on('click', function(evt){
                var itemIdx = $(this).index();
                var selectedFeature = wildfireData[itemIdx];
                var selectedFeatureGeom = new Point( {"x": selectedFeature.attributes.LONGITUDE, "y": selectedFeature.attributes.LATITUDE, "spatialReference": {"wkid": 4326 } });
                wildFireVizApp.map.centerAndZoom(selectedFeatureGeom, 10);
            });
        }

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
            let arrOfWildfireNames = wildFireVizApp.getArrOfAllWildfires(true);
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
                let arrOfWildfireNames = wildFireVizApp.getArrOfAllWildfires(true);
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

        };

        const AppController = function(){

        };

        //initialize app
        const wildfireModel = new WildFireDataModel();
        const wildFireVizApp = new WildFireVizApp();
        wildFireVizApp.startUp();
    });

});