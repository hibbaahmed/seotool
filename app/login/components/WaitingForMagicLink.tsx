import { Button } from "../../../components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const WaitingForMagicLink = ({
  toggleState,
}: {
  toggleState: () => void;
}) => {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-8">
        <div className="flex flex-col gap-6 bg-white border border-gray-200 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center">
          {/* Header */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-600">
              We&apos;ve sent you a magic link to access your Bridgely account.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-blue-800 font-medium">
                Magic link sent successfully!
              </p>
              <p className="text-xs text-blue-600">
                Check your inbox (and spam folder) for the login link.
              </p>
            </div>
          </div>

          <Button 
            onClick={toggleState} 
            className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium py-3 rounded-xl transition-all duration-300"
            size="sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go back
          </Button>
        </div>
      </div>
    </>
  );
};