import React, { createContext, useContext, useState, useCallback } from 'react';
import Popup from '../components/Popup';

const PopupContext = createContext();

export const usePopup = () => {
    const context = useContext(PopupContext);
    if (!context) {
        throw new Error('usePopup must be used within a PopupProvider');
    }
    return context;
};

export const PopupProvider = ({ children }) => {
    const [popupState, setPopupState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        actions: null,
        onClose: null
    });

    const showPopup = useCallback(({ title, message, type = 'info', actions, onClose }) => {
        setPopupState({
            isOpen: true,
            title,
            message,
            type,
            actions,
            onClose
        });
    }, []);

    const closePopup = useCallback(() => {
        setPopupState(prev => {
            if (prev.onClose) prev.onClose();
            return { ...prev, isOpen: false };
        });
    }, []);

    return (
        <PopupContext.Provider value={{ showPopup, closePopup }}>
            {children}
            <Popup
                isOpen={popupState.isOpen}
                onClose={closePopup}
                title={popupState.title}
                message={popupState.message}
                type={popupState.type}
                actions={popupState.actions}
            />
        </PopupContext.Provider>
    );
};
