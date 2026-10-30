import React, { Suspense } from 'react';
import { BookingPage } from '../components/BookingPage';
import { CalendarSkeleton } from '../components/Skeleton';

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <CalendarSkeleton />
        </div>
      }
    >
      <BookingPage />
    </Suspense>
  );
}
