"use client";
import React from "react";
import useUser from "../hook/useUser";
import Price from "../../components/subscription/price";

export default function Page() {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isActive = !user?.subscription?.end_at
        ? false
        : new Date(user.subscription.end_at) > new Date();

    return (
        <div>
            <div>
                <Price />
            </div>
        </div>
    );
}

