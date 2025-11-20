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
        console.log('🎭 OutOfCreditsDialog - open prop:', open, 'requiredCredits:', requiredCredits);
        if (open) {
            console.log('🎭 OutOfCreditsDialog - DIALOG SHOULD BE VISIBLE NOW!');
        }
    }, [open, requiredCredits]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay className="bg-black/50" />
                <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 text-slate-900 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg border-slate-200">
                    <DialogHeader>
                        <div className="mx-auto bg-indigo-100 p-3 rounded-full mb-4">
                            <Coins className="w-6 h-6 text-indigo-600" />
                        </div>
                        <DialogTitle className="text-center text-2xl font-bold text-slate-900">Out of Credits</DialogTitle>
                        <DialogDescription className="text-slate-600 text-center mt-3">
                            <p className="mb-2 text-base">You need credits to perform this action.</p>
                            <p className="text-base">Please purchase more credits to continue using this feature!</p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col items-center sm:flex-row sm:justify-center gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
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