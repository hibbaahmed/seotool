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

        // Get user email to query subscription table
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userEmail = authUser?.email;

        if (!userEmail) {
            throw new Error("User email not found");
        }

        // Fetch credits and subscription data
        const { data: creditsData, error: creditsError } = await supabase
            .from('credits')
            .select('credits, subscription_id, customer_id')
            .eq('user_id', user.id)
            .single();

        if (creditsError) {
            console.error('Error fetching credits:', creditsError);
            return { error: 'Could not fetch credits' };
        }

        // Fetch subscription data to check trial status
        const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscription')
            .select('trial_ends_at')
            .eq('email', userEmail)
            .maybeSingle();

        if (subscriptionError) {
            console.error('Error fetching subscription:', subscriptionError);
            // Don't fail - just log the error and continue without trial check
        }

        console.log('Credits data from database:', creditsData);
        console.log('Subscription data from database:', subscriptionData);

        const currentCredits = creditsData?.credits || 0;
        
        // Check if user is in trial period (unlimited usage) from subscription table
        const now = new Date();
        const trialEndsAt = subscriptionData?.trial_ends_at ? new Date(subscriptionData.trial_ends_at) : null;
        const isInTrial = trialEndsAt && now < trialEndsAt;
        
        // During trial, always allow usage (unlimited credits)
        const hasEnoughCredits = isInTrial || currentCredits >= requiredCredits;
        const isFreeTrial = !creditsData?.subscription_id && !creditsData?.customer_id;

        console.log(`Credit check result: current=${currentCredits}, required=${requiredCredits}, hasEnough=${hasEnoughCredits}, isInTrial=${isInTrial}, trialEndsAt=${trialEndsAt}`);

        return {
            credits: currentCredits,
            isFreeTrial,
            isInTrial, // New field to indicate trial period
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

