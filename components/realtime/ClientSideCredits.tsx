// ClientSideCredits.tsx
"use client";


import { Database } from "../../types/supabase";
import { creditsRow } from "../../types/utils";
import { supabase } from "../../utils/supabaseClient";
import { useEffect, useState } from "react";


export const revalidate = 0;


type ClientSideCreditsProps = {
 creditsRow: creditsRow | null;
};


export default function ClientSideCredits({
 creditsRow,
}: ClientSideCreditsProps) {
 if (!creditsRow) return <p>Credits: 0</p>;


 const [credits, setCredits] = useState<creditsRow>(creditsRow);


 useEffect(() => {
   const channel = supabase
     .channel("realtime credits")
     .on(
       "postgres_changes",
       { event: "UPDATE", schema: "public", table: "credits" },
       (payload: { new: creditsRow }) => {
         setCredits(payload.new);
       }
     )
     .subscribe();


   return () => {
     supabase.removeChannel(channel);
   };
 }, [credits, setCredits]);


 if (!credits) return null;


 return <p>Credits: {credits.credits}</p>;
}