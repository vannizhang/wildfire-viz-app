import React from 'react';

import config from '../../core/config';

class InfoWindow extends React.Component {

    constructor(props){
        super(props);

    };

    getContent(){
        const name = this.props.data && this.props.data.attributes ? this.props.data.attributes[config.fields.name] : 'No Name';
        const infoWindowContent = name;
        return this.props.data ? infoWindowContent : null;
    }

    render(){


        return(
            <div id='customizedInfoWindowDiv' style={{
                position: 'absolute',
                left: `${this.props.position.x}px`,
                top: `${this.props.position.y}px`,
                backgroundColor: 'rgba(26, 0, 17, 0.75)'
            }}>
                {this.getContent()}
            </div>
        )

    };

};

export default InfoWindow;