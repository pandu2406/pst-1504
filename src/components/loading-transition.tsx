'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoadingTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    // Listen for route changes
    useEffect(() => {
        // When route changes, show loading
        setIsLoading(true);

        // Then hide loading after a small delay for animation
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    if (isLoading) {
        return (
            <div className="z-50 fixed inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">Memuat halaman...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
