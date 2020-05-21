import * as React from 'react';
import styled from 'styled-components';
import classnames from 'classnames';

import {
    ListMode
} from '../../store/reducers/UI';

import {
    UIConfig
} from '../../AppConfig';

const ListModeToggleContainer = styled.div`
    display: flex;
    padding: .75rem 0;
    border-top: 1px solid ${UIConfig.ThemeColorBrightPurple};

    .breadcrumbs {
        flex-grow: 1;

        .crumb {
            color: ${UIConfig.ThemeColorYellow};
            cursor: pointer;
        }
    }
`;

const BreadcrumbsData: {
    label: string;
    value: ListMode;
}[] = [
    {
        label: 'timeline',
        value: 'timeline'
    },
    {
        label: 'magnitude',
        value: 'grid'
    }
];

interface Props {
    countOfFires?: number;
    activeListMode?: ListMode;

    onChange: (value: ListMode)=>void;
}

const ListModeToggle:React.FC<Props> = ({
    countOfFires = 0,
    activeListMode,
    onChange
})=>{

    const getBreadcrumbs = ()=>{

        const crumbs = BreadcrumbsData.map((d, i)=>{

            const classNames = classnames('crumb', {
                'is-active': d.value === activeListMode
            });

            return ( 
                <span 
                    key={`listmode-toggle-btn-${i}`}
                    className={classNames}
                    onClick={onChange.bind(this, d.value)}
                >
                    {d.label}
                </span> 
            );
        });

        return(
            <nav className="breadcrumbs">
                { crumbs }
            </nav>
        );
    }

    return(
        <ListModeToggleContainer className='font-size--2'>
            { getBreadcrumbs() }
            <span>total fires in view: {countOfFires}</span>
        </ListModeToggleContainer>
    );
};

export default ListModeToggle;