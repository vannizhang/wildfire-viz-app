import * as React from 'react';
// import styled from 'styled-components';

import { UIConfig } from '../../AppConfig';

import { miscFns } from 'helper-toolkit-ts';

const isMobile = miscFns.isMobileDevice();

const Sidebar:React.FC<{
    children: React.ReactNode
}> = ({
    children
})=>{

    const [ isExpanded, setIsExpanded ] = React.useState<boolean>(true);

    const getToggleBtn = ()=>{
        if(!isMobile){
            return null;
        }

        return (
            <div
                style={{
                    // 'height': '50px',
                    'width': '100%',
                    'textAlign': 'center',
                    'padding': '.25rem 0'
                }}
                onClick={setIsExpanded.bind(this, !isExpanded)}
            >
                <span className='avenir-demi'>{ isExpanded ? 'Close' : 'Open' }</span>
            </div>
        )
    }

    return (
        <div
            style={{
                'position': 'absolute',
                'top': isMobile && !isExpanded ? 'unset' : 0,
                'right': 0,
                'bottom': 0,
                'height': isMobile && !isExpanded ? 'auto' : '100%',
                'width': isMobile ? '100%' : UIConfig.SidebarWidth + 'px',
                'padding': '1rem',
                'boxSizing': 'border-box',
                'backgroundColor': UIConfig.ThemeColorDarkPurple,
                'color': UIConfig.ThemeColorYellow,
                'overflowY': 'auto'
            }}
        >
            { getToggleBtn() }
            { isExpanded ? children : null}
        </div>
    );
};

export default Sidebar;