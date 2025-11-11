import { supabaseBrowser } from '@/lib/supabase/browser';

export const checkCredits = async (requiredCredits = 1) => {
    try {
        console.log(`checkCredits called with requiredCredits: ${requiredCredits}`);
        
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('No user found, throwing error');
            throw new Error("User not authenticated");
        }

        console.log(`User authenticated: ${user.id}`);

        const { data, error } = await supabase
            .from('credits')
            .select('credits, subscription_id, customer_id')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching credits:', error);
            return { error: 'Could not fetch credits' };
        }

        console.log('Credits data from database:', data);

        const currentCredits = data?.credits || 0;
        const hasEnoughCredits = currentCredits >= requiredCredits;
        const isFreeTrial = !data?.subscription_id && !data?.customer_id;

        console.log(`Credit check result: current=${currentCredits}, required=${requiredCredits}, hasEnough=${hasEnoughCredits}, isFreeTrial=${isFreeTrial}`);

        return {
            credits: currentCredits,
            isFreeTrial,
            hasEnoughCredits,
            requiredCredits,
            error: null
        };
    } catch (error) {
        console.error('Error in checkCredits:', error);
        return { 
            error: error.message,
            credits: 0,
            isFreeTrial: true,
            hasEnoughCredits: false,
            requiredCredits
        };
    }
};

