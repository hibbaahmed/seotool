'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogPortal,
  DialogOverlay
} from "./ui/dialog";
import { Button } from './ui/Button';
import { useRouter } from 'next/navigation';
import { Coins } from 'lucide-react';

export default function OutOfCreditsDialog({ open, onOpenChange, requiredCredits = 1 }) {
    const router = useRouter();

    // Debug logging
    React.useEffect(() => {
        console.log('OutOfCreditsDialog - open prop:', open, 'requiredCredits:', requiredCredits);
    }, [open, requiredCredits]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay className="bg-black/80" />
                <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-gray-900 p-6 text-white shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg border-gray-700">
                    <DialogHeader>
                        <div className="mx-auto bg-indigo-600/20 p-3 rounded-full mb-4">
                            <Coins className="w-6 h-6 text-indigo-400" />
                        </div>
                        <DialogTitle className="text-center text-xl font-semibold">Out of Credits</DialogTitle>
                        <DialogDescription className="text-gray-400 text-center mt-2">
                            <p className="mb-2">You need {requiredCredits} credit{requiredCredits > 1 ? 's' : ''} to perform this action.</p>
                            <p>Please purchase more credits to continue using this feature!</p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col items-center sm:flex-row sm:justify-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                            onClick={() => {
                                onOpenChange(false);
                                router.push('/price');
                            }}
                        >
                            Buy Credits
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
} 