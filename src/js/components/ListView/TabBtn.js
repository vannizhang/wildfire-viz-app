import React from 'react';

class TabBtns extends React.Component {

    constructor(props){
        super(props);
    };

    render(){

        const btns = this.props.data.map((d, i)=>{

            const onClickHandler = ()=>{
                this.props.onClick(d);
            };

            const labelText = i === 0 ? d + ' / ' : d;

            const label = this.props.visibleTab === d ? (<strong>{labelText}</strong>) : labelText;

            return (
                <span key={`tab-btn-${d}`} className={'cursor-pointer'} onClick={onClickHandler}>{label}</span>
            );
        })

        return(
            <nav className='breadcrumb-nav inline-block'>
                {btns}
            </nav>
        );
    };

};

export default TabBtns;