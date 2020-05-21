import * as React from 'react';
import styled from 'styled-components';

import { UIConfig } from '../../AppConfig';


const SidebarDiv = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: ${UIConfig.SidebarWidth + 'px'};
    padding: 1rem;
    box-sizing: border-box;
    background-color: ${UIConfig.ThemeColorDarkPurple};
    color: ${ UIConfig.ThemeColorYellow };
    overflow-y: auto;
`;

const Sidebar:React.FC = ({
    children
})=>{

    return (
        <SidebarDiv>
            { children }
        </SidebarDiv>
    );
};

export default Sidebar;