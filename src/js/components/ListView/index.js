import React from 'react';

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
                    This is list view
                </div>
            </div>
        );
    };

};

export default ListView;