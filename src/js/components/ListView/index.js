import React from 'react';

import TimeLine from '../TimeLine'

class ListView extends React.Component {

    constructor(props){
        super(props);

        // console.log('ListView props >>>', this.props);

        this.state = {
            // visibleTab: 
        }

    };

    render(){

        return(
            <div id='listViewDiv'>
                <div>filters</div>
                <div>total fires in view: {this.props.data.length}</div>
                <div className={'modifier-class'}>
                    <TimeLine 
                        data={this.props.data}
                    />
                </div>
            </div>
        );
    };

};

export default ListView;