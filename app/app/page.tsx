import React, { Suspense } from "react";
import AppShell from "@/components/AppShell";

export default function AppPage(){
  return (
    <Suspense fallback={<div className="min-h-screen" />}> 
      <AppShell />
    </Suspense>
  );
}
