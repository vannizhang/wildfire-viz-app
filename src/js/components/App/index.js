import React from 'react';
import * as calcite from 'calcite-web/dist/js/calcite-web';

import Map from '../Map';
import ListView from '../ListView';
import Legend from '../Legend';
import Search from '../Search';
import Checkbox from '../Checkbox';

const SIDE_BAR_WIDTH = 450;

class App extends React.Component {

    constructor(props){
        super(props);

        // console.log(this.props);

        this.state = {
            fireName: '',
            // the active fire feature object that will be used to populate/position the infoWindow
            infoWindowData: null,
            activeFireToZoom: null,
            isSmokeForecastLayerVisible: false,
            smokeForecastTime: this.props.smokeLayerTimeInfo.timeExtent[0],
            listViewData: []
        };

        this.timerForSmokeForecastLayerAnimation = null;

        this.mapExtentChangeHandler = this.mapExtentChangeHandler.bind(this);
        this.mapOnClickHandler = this.mapOnClickHandler.bind(this);
        this.updateInfoWindowData = this.updateInfoWindowData.bind(this);
        this.zoomToActiveFire = this.zoomToActiveFire.bind(this);
        this.updateFireName = this.updateFireName.bind(this);
        this.toggleSmokeForecastLayer = this.toggleSmokeForecastLayer.bind(this);
    };

    updateFireName(name=''){

        this.setState({
            fireName: name 
        },()=>{
            // console.log('filterFiresByName >>>', this.state.fireName);
            this.filterListViewDataByFireName(name)
        });
    };

    updateListViewData(data=[]){
        this.setState({
            listViewData: data 
        },()=>{
            // console.log('listViewData >>>', this.state.listViewData);
        });
    }

    updateInfoWindowData(oid=-1){
        const infoWindowData = this.props.dataStore.getActiveFireByOID(oid);
        // console.log('setInfoWindowDataByOID', infoWindowData);
        this.setState({
            infoWindowData: infoWindowData 
        });
    }

    updateSmokeForecastTime(){
        this.setState((prevState)=>{
            const prevSmokeForecastTime = new Date(prevState.smokeForecastTime);
            const nextSmokeForecastTime = prevSmokeForecastTime.setHours(prevSmokeForecastTime.getHours() + 1);
            const newSmokeForecastTime = nextSmokeForecastTime > this.props.smokeLayerTimeInfo.timeExtent[1] ? this.props.smokeLayerTimeInfo.timeExtent[0] : nextSmokeForecastTime;
            return {
                smokeForecastTime: newSmokeForecastTime
            }   
        }, ()=>{
            // console.log('updateSmokeForecastTime', this.state.smokeForecastTime);
        })
    }

    zoomToActiveFire(oid=-1){
        const activeFireData = this.props.dataStore.getActiveFireByOID(oid);

        this.setState({
            activeFireToZoom: activeFireData
        });
    }

    toggleSmokeForecastLayer(isVisible){
        this.setState({
            isSmokeForecastLayerVisible: isVisible
        },()=>{
            this.animateSmokeForecastLayer();
        });
    }

    animateSmokeForecastLayer(){
        if(this.state.isSmokeForecastLayerVisible){

            this.timerForSmokeForecastLayerAnimation = setInterval(()=>{
                this.updateSmokeForecastTime();
            }, 1500);
        } else {
            clearInterval(this.timerForSmokeForecastLayerAnimation);
        }

    }

    mapExtentChangeHandler(data){
        const activeFiresInMapExtent = this.props.dataStore.getActiveFiresInMapExtent(data.extent);
        this.updateListViewData(activeFiresInMapExtent);
    }

    mapOnClickHandler(extent){
        // search fire feature and open the info window for the selected feature
        const activeFireOid = this.props.dataStore.searchFireByExtent(extent, true) || -1;
        this.updateInfoWindowData(activeFireOid);
    }

    filterListViewDataByFireName(name=''){
        const activeFires= this.props.dataStore.searchFireByName(name);
        this.updateListViewData(activeFires);
        // console.log(activeFires);
    }

    componentDidMount(){
        calcite.init();
    }

    render(){
        return(
            <div className='main-content'>

                <Map 
                    rightPadding={SIDE_BAR_WIDTH}
                    activeFires={this.props.activeFires}
                    selectedFireName={this.state.fireName}
                    infoWindowData={this.state.infoWindowData}
                    activeFireToZoom={this.state.activeFireToZoom}
                    isSmokeForecastLayerVisible={this.state.isSmokeForecastLayerVisible}
                    smokeForecastTime={this.state.smokeForecastTime}

                    // handlers
                    onExtentChange={this.mapExtentChangeHandler}
                    onInfoWindowClose={this.updateInfoWindowData}
                    onClick={this.mapOnClickHandler}
                />
                
                <div className='side-bar' style={{width: SIDE_BAR_WIDTH}}>
                    <div className='content-wrap'>

                        <Search 
                            data={this.props.activeFires}
                            onSelect={this.updateFireName}
                        />
                        
                        <div className='font-size--3 leader-half trailer-0'>
                            <span className='fire-filters-title'>Active wildfires by affected area (in acres)</span>
                            <span className='js-modal-toggle icon-ui-description margin-left-half font-size-0 cursor-pointer right' data-modal="about"></span>
                        </div>

                        <Legend 
                            data={this.props.classBreakInfos}
                        />

                        <Checkbox
                            smokeForecastTime={this.state.smokeForecastTime}
                            onChange={this.toggleSmokeForecastLayer}
                        />

                        <ListView 
                            data={this.state.listViewData}
                            onMouseEnter={this.updateInfoWindowData}
                            onMouseLeave={this.updateInfoWindowData}
                            onClick={this.zoomToActiveFire}
                        />
                    </div>
                </div>

            </div>
        );
    };

};

export default App;