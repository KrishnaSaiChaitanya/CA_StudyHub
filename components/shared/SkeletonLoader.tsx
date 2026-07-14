import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * A full-screen skeleton loader that can be displayed while page data is loading.
 * It uses a subtle backdrop with a spinning loader to indicate progress.
 */
const SkeletonLoader: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

export default SkeletonLoader;
