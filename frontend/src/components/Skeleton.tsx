
import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-zinc-200 rounded ${className}`} />
    );
};

export const SkeletonLine: React.FC<{ width?: string, height?: string }> = ({ width = "100%", height = "1rem" }) => (
    <div className="animate-pulse bg-zinc-100 rounded" style={{ width, height }} />
);

export const SkeletonCircle: React.FC<{ size?: string }> = ({ size = "3rem" }) => (
    <div className="animate-pulse bg-zinc-100 rounded-full" style={{ width: size, height: size }} />
);

export const SkeletonCard: React.FC = () => (
    <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
            <SkeletonCircle size="3rem" />
            <div className="space-y-2 flex-1">
                <SkeletonLine width="60%" />
                <SkeletonLine width="40%" height="0.75rem" />
            </div>
        </div>
        <div className="space-y-2">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine width="80%" />
        </div>
    </div>
);
