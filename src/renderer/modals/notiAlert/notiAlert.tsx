import React from 'react';
import ReactDOM from 'react-dom';

const NotiAlert: React.FC = () => {
    return (
        <div className='alertMain'>
            <img
                id='alertMemberAvatar'
                style={{borderRadius: '50%'}}
            />
            <h2 className='blink'>
                <strong style={{fontSize: '1.3em'}}/>{'님 호출'}
            </h2>
            <h4/>
            <div style={{textAlign: 'center'}}>
                <button
                    id='close'
                    onClick={() => window.api.send('closeAlert', true)}
                >
                    {'확인'}
                </button>
            </div>
        </div>
    );
};

const start = async () => {
    ReactDOM.render(
        <NotiAlert/>,
        document.getElementById('app'),
    );
};

start();
