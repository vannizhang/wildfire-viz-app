import React from 'react';
import { format } from 'date-fns';
import './style.scss'
import classnames from 'classnames'

interface Props {
    isVisible: boolean;
    currentTime: number;
    // the start time of the smoke layer time extent, this is a constant val
    startTime: number;
    isAnimationOn: boolean;
    onClick: ()=>void;
    playPauseBtnOnClick: ()=>void;
    indicatorOnClick: (idx:number)=>void;
}

const SmokeLayerToggle:React.FC<Props> = ({
    isVisible,
    currentTime,
    startTime,
    isAnimationOn,
    playPauseBtnOnClick,
    onClick,
    indicatorOnClick
})=>{

    const getCheckboxIcon = ()=>{
        return isVisible 
            ? <span className="icon-ui-checkbox-checked"></span>
            : <span className="icon-ui-checkbox-unchecked"></span>;
    };

    const getLabel = ()=>{
        const forcastTime = currentTime && isVisible
            ? <span className='margin-left-half'>({ format(new Date(currentTime), 'MMMM do, p') })</span>
            : null;

        return <span>
            Smoke forecast 
            {forcastTime}
        </span>
    };

    const getIndicators = ()=>{
        // console.log(currentTime, startTime, currentTime - startTime)

        const idx4CurrTime = currentTime && startTime 
            ? (currentTime - startTime) / 3600000 
            : 0

        const indicators:JSX.Element[] = [];

        for(let i = 0 ; i < 48; i++){

            const classname = classnames('smoke-forecast-time-indicator', {
                'is-active': i === idx4CurrTime
            })

            const indicator = (
                <div className={classname} key={i} onClick={indicatorOnClick.bind(this, i)}></div>
            )

            indicators.push(indicator)
        }

        const pauseIcon = (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16">
                <path d="M2 1h5v14H2zm12 0H9v14h5z"/><path fill="none" d="M0 0h16v16H0z"/>
            </svg>
        );

        const playIcon = (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16">
                <path d="M4 1.571l10 6.43-10 6.428z"/><path fill="none" d="M0 0h16v16H0z"/>
            </svg>
        );

        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '.5rem',
                }}
            >
                <div
                    className='play-pause-btn'
                    onClick={playPauseBtnOnClick}
                >
                    { isAnimationOn ? pauseIcon : playIcon }
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        flexGrow: 1,
                        height: '100%'
                    }}
                >
                    { indicators }
                </div>
            </div>

        )
    }

    return (
        <div
            style={{
                'padding': '.5rem',
                'background': 'rgba(103,0,67,0.5)'
            }}
        >
            <div
                className='cursor-pointer font-size--3'
                onClick={onClick}
            >
                { getCheckboxIcon() }
                { getLabel() }
            </div>

            { isVisible ? getIndicators() : null }
        </div>

    )
};

export default SmokeLayerToggle;