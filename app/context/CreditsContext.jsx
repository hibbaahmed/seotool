'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkCredits } from '../utils/creditCheck';
import OutOfCreditsDialog from '../../components/OutOfCreditsDialog';

const CreditsContext = createContext({
    credits: 0,
    isFreeTrial: true,
    loading: true,
    checkUserCredits: async (required) => false,
    refreshCredits: async () => {},
    deductCredits: (amount) => {}
});

export function CreditsProvider({ children }) {
    const [showOutOfCreditsDialog, setShowOutOfCreditsDialog] = useState(false);
    const [requiredCredits, setRequiredCredits] = useState(1);
    const [credits, setCredits] = useState(0);
    const [isFreeTrial, setIsFreeTrial] = useState(true);
    const [loading, setLoading] = useState(true);

    // Fetch initial credits on mount
    useEffect(() => {
        fetchCredits();
    }, []);

    // Debug: Track dialog state changes
    useEffect(() => {
        console.log('🔔 Dialog state changed:', showOutOfCreditsDialog, 'requiredCredits:', requiredCredits);
    }, [showOutOfCreditsDialog, requiredCredits]);

    const fetchCredits = async () => {
        setLoading(true);
        const result = await checkCredits(1);
        if (!result.error) {
            setCredits(result.credits);
            setIsFreeTrial(result.isFreeTrial);
        }
        setLoading(false);
    };

    const checkUserCredits = useCallback(async (required = 1) => {
        console.log(`Checking credits: required=${required}`);
        const result = await checkCredits(required);
        
        console.log('Credit check result:', result);
        
        if (result.error) {
            console.error('Error checking credits:', result.error);
            return false;
        }

        // Update local state with latest values
        setCredits(result.credits);
        setIsFreeTrial(result.isFreeTrial);

        console.log(`User has ${result.credits} credits, needs ${required}, hasEnough: ${result.hasEnoughCredits}`);

        if (!result.hasEnoughCredits) {
            console.log('❌ Not enough credits - setting dialog to show');
            setRequiredCredits(required);
            // Use functional update to ensure state is set immediately
            setShowOutOfCreditsDialog((prev) => {
                console.log('Setting dialog open from', prev, 'to true');
                return true;
            });
            console.log('✅ Dialog state update queued');
            return false;
        }

        console.log('✅ User has enough credits, proceeding');
        return true;
    }, []);

    const deductCredits = (amount = 1) => {
        setCredits(prev => Math.max(0, prev - amount));
    };

    const value = {
        credits,
        isFreeTrial,
        loading,
        checkUserCredits,
        refreshCredits: fetchCredits,
        deductCredits
    };

    // Wrap onOpenChange to add logging
    const handleDialogChange = useCallback((open) => {
        console.log('🔔 Dialog onOpenChange called with:', open);
        setShowOutOfCreditsDialog(open);
    }, []);

    return (
        <CreditsContext.Provider value={value}>
            {children}
            <OutOfCreditsDialog 
                open={showOutOfCreditsDialog}
                onOpenChange={handleDialogChange}
                requiredCredits={requiredCredits}
            />
        </CreditsContext.Provider>
    );
}

export const useCredits = () => {
    const context = useContext(CreditsContext);
    if (!context) {
        throw new Error('useCredits must be used within a CreditsProvider');
    }
    return context;
};

