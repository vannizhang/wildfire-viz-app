import React from 'react';

import Map from '../Map';

const SIDE_BAR_WIDTH = 450;

class App extends React.Component {

    constructor(props){
        super(props);

        console.log(this.props);

        this.state = {
            fireName: '',
        };

        window.foobar = (val)=>{
            this.filterFiresByName(val);
        };
    };

    filterFiresByName(name=''){

        this.setState({
            fireName: name 
        },()=>{
            // console.log('filterFiresByName >>>', this.state.fireName);
        });
    }

    render(){
        return(
            <div className='main-content'>

                <Map 
                    rightPadding={SIDE_BAR_WIDTH}
                    activeFires={this.props.activeFires}
                    selectFireName={this.state.fireName}
                />
                
                {/* <div className='side-bar' style={{width: SIDE_BAR_WIDTH}}>
                    <div className='content-wrap'>
                        foobar text
                    </div>
                </div> */}

            </div>
        );
    };

};

export default App;