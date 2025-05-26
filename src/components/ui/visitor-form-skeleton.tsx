"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function VisitorFormSkeleton() {
    return (
        <div className="mx-auto px-4 py-8 container">
            <div className="flex flex-col justify-center items-center">
                {/* Title/Header */}
                <div className="mb-6 text-center">
                    <Skeleton className="mx-auto mb-2 w-64 h-8" />
                    <Skeleton className="mx-auto w-80 h-5" />
                </div>

                {/* Form Card */}
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <Skeleton className="mb-2 w-48 h-6" />
                        <Skeleton className="w-full h-4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Form Fields */}
                        {Array(5).fill(0).map((_, i) => (
                            <div key={`field-${i}`} className="space-y-2">
                                <Skeleton className="w-24 h-4" />
                                <Skeleton className="w-full h-10" />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="w-full h-10" />
                    </CardFooter>
                </Card>

                {/* Ticket/Queue Info Card - Hidden initially but part of the skeleton */}
                <div className="mt-8 w-full max-w-md">
                    <Card>
                        <CardHeader>
                            <Skeleton className="mb-2 w-48 h-6" />
                            <Skeleton className="w-full h-4" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center my-4">
                                <Skeleton className="rounded-full w-16 h-16" />
                            </div>
                            <div className="space-y-2 text-center">
                                <Skeleton className="mx-auto w-32 h-8" />
                                <Skeleton className="mx-auto w-48 h-5" />
                                <Skeleton className="mx-auto w-64 h-5" />
                            </div>
                            <div className="space-y-2 mt-4">
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-3/4 h-4" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Skeleton className="w-36 h-10" />
                        </CardFooter>
                    </Card>
                </div>

                {/* Theme Toggle at the bottom */}
                <div className="mt-8">
                    <Skeleton className="rounded-full w-8 h-8" />
                </div>
            </div>
        </div>
    );
}
