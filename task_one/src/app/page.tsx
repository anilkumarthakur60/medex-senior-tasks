import React, { Suspense } from 'react';
import { ServiceExplorer } from '../components/ServiceExplorer';
import { CardSkeleton } from '../components/Skeleton';

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      }
    >
      <ServiceExplorer />
    </Suspense>
  );
}
