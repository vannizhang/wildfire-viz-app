import React from 'react';

import TimeLine from '../TimeLine';
import GridList from '../GridList';
import TabBtn from './TabBtn';

const tabData = [
    'timeline',
    'magnitude'
];

class ListView extends React.Component {

    constructor(props){
        super(props);

        // console.log('ListView props >>>', this.props);

        this.state = {
            visibleTab: tabData[0]
        }

        this.toggleVisibleTab = this.toggleVisibleTab.bind(this);

    };

    toggleVisibleTab(val){

        val = tabData.indexOf(val) > -1 ? val : tabData[0];

        this.setState({
            visibleTab: val
        });
    }

    render(){

        const tabLookup = {
            timeline: <TimeLine data={this.props.data} />,
            magnitude: <GridList data={this.props.data} />
        }

        return(
            <div id='listViewDiv'>
                <div className="trailer-quarter font-size--3">

                    <TabBtn 
                        data={tabData}
                        visibleTab={this.state.visibleTab}
                        onClick={this.toggleVisibleTab}
                    />

                    <span className='right'>total fires in view: {this.props.data.length}</span>
                </div>

                <div className={'leader-half'}>
                    {tabLookup[this.state.visibleTab]}
                </div>
            </div>
        );
    };

};

export default ListView;