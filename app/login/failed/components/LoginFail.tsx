import { ExternalLink, Mail } from "lucide-react";
import Link from "next/link";

export const LoginFail = ({
    errorMessage,
}: {
    errorMessage: string | null;
}) => {
    const supportEmail = "team@bridgely.io";
    
    return (
        <div className="flex justify-center items-center p-8 min-h-screen">
            <div className="flex flex-col gap-6 bg-neutral-50 dark:bg-neutral-900 p-8 rounded-lg max-w-md w-full shadow-lg border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Login Error</h1>
                    <div className="h-1 w-16 bg-red-500 rounded"></div>
                </div>
                
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {errorMessage}
                    </p>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    Need Help?
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    Please email us at{" "}
                                    <a 
                                        href={`mailto:${supportEmail}`}
                                        className="font-semibold underline hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                                    >
                                        {supportEmail}
                                    </a>
                                    {" "}and we'll help you get back into your account.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Hint: Please make sure you open the link on the same device / browser from which you tried to signup.
                    </p>
                </div>
                
                <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <Link href={"/login"}>
                        <div className="flex gap-2 text-sm items-center justify-center hover:underline text-blue-600 dark:text-blue-400 font-medium">
                            <p>Try logging in again</p>
                            <ExternalLink size={16} />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};