import { Button } from "../../../components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const WaitingForMagicLink = ({
  toggleState,
}: {
  toggleState: () => void;
}) => {
  return (
    <>
      <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23F8FAFC%22%20fill-opacity%3D%220.5%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-gray-200/20 text-center">
            {/* Header */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-700 mb-3 tracking-tight">Check your email</h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                We&apos;ve sent you a magic link to access your Bridgely account.
              </p>
            </div>

            <div className="bg-blue-50/80 border border-blue-200/60 rounded-2xl p-6 mb-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-blue-700 font-medium">
                    Magic link sent successfully!
                  </p>
                </div>
                <p className="text-sm text-blue-600">
                  Check your inbox (and spam folder) for the login link.
                </p>
              </div>
            </div>

            <Button 
              onClick={toggleState} 
              className="w-full bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 border border-gray-200 font-medium py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-md"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};