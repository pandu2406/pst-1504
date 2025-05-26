"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    RefreshCw,
    ArrowRight,
    UserCog,
    LayoutGrid,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Define the queue interface
interface Queue {
    id: string;
    queueNumber: number;
    status: string;
    queueType: string;
    service: {
        name: string;
    };
    admin: {
        name: string;
    } | null;
    createdAt: string;
}

// Format queue time to DDMM format (eg. 1405 for May 14)
const formatQueueTime = (isoDateString: string): string => {
    const date = new Date(isoDateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed, so add 1
    return `${day}${month}`;
};

// Define the admin interface
interface Admin {
    id: string;
    name: string;
    role: string;
}

export default function QueueDisplayPage() {
    const [servingQueues, setServingQueues] = useState<Queue[]>([]);
    const [nextQueue, setNextQueue] = useState<Queue | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
    const [dataHash, setDataHash] = useState<string>("");
    const [selectedAdmin, setSelectedAdmin] = useState<string>("all");
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>("today");
    const [admins, setAdmins] = useState<Admin[]>([]);

    // Fetch queue data
    const fetchQueueData = useCallback(async () => {
        try {
            setLoading(true);
            // Build query parameters
            const queryParams = new URLSearchParams();
            if (selectedAdmin !== "all") {
                queryParams.append("adminId", selectedAdmin);
            }
            if (selectedDateFilter) {
                queryParams.append("dateFilter", selectedDateFilter);
            }

            const queryString = queryParams.toString();
            const endpoint = queryString
                ? `/api/queue-display?${queryString}`
                : "/api/queue-display";

            const response = await fetch(endpoint, {
                headers: {
                    "x-queue-hash": dataHash || "",
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.hasChanges) {
                    setServingQueues(data.servingQueues || []);
                    setNextQueue(data.nextQueue || null);
                    setDataHash(data.hash || "");
                    setLastUpdatedAt(new Date());
                }
            } else {
                console.error("Failed to fetch queue data");
            }
        } catch (error) {
            console.error("Error fetching queue data:", error);
        } finally {
            setLoading(false);
        }
    }, [dataHash, selectedAdmin, selectedDateFilter]);

    // Fetch admin list
    const fetchAdmins = useCallback(async () => {
        try {
            const response = await fetch("/api/queue-display/admins");
            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins || []);
            }
        } catch (error) {
            console.error("Error fetching admins:", error);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchQueueData();
        fetchAdmins();
    }, [fetchQueueData, fetchAdmins]);

    // Set up polling
    useEffect(() => {
        const interval = setInterval(() => {
            fetchQueueData();
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [fetchQueueData]);

    // Handle admin selection change
    const handleAdminChange = (value: string) => {
        setSelectedAdmin(value);
    };

    // Handle date filter change
    const handleDateFilterChange = (value: string) => {
        setSelectedDateFilter(value);
    };

    // Handle manual refresh
    const handleRefresh = () => {
        toast.info("Memperbarui data antrean...");
        fetchQueueData();
    };

    return (
        <div className="flex flex-col p-4 md:p-8 min-h-screen">
            <div className="flex flex-wrap justify-between items-center mb-8">
                <div className="flex items-center gap-4 ml-5">
                    <LayoutGrid className="size-8 text-primary" />
                    <div>
                        <h1 className="font-bold text-3xl md:text-4xl">
                            Informasi Antrean
                        </h1>
                        <p className="text-muted-foreground">
                            Tampilan nomor antrean yang sedang dilayani
                        </p>
                    </div>
                </div>
                <div className="flex md:flex-row flex-col items-end md:items-center gap-4 mt-4 md:mt-0">
                    <div className="flex gap-4">
                        <Select
                            value={selectedDateFilter}
                            onValueChange={handleDateFilterChange}
                        >
                            <SelectTrigger className="w-[180px]">
                                <Calendar className="mr-2 w-4 h-4" />
                                <SelectValue placeholder="Filter Waktu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Antrean Hari Ini</SelectItem>
                                <SelectItem value="all">Semua Antrean</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedAdmin} onValueChange={handleAdminChange}>
                            <SelectTrigger className="w-[180px] md:w-[220px]">
                                <SelectValue placeholder="Pilih Admin/Petugas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Petugas</SelectItem>
                                {admins.map((admin) => (
                                    <SelectItem key={admin.id} value={admin.id}>
                                        {admin.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                            />
                            <span className="hidden md:inline">Perbarui</span>
                        </Button>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
            <div className="flex-grow gap-6 grid md:grid-cols-2">
                {/* Next in queue (now on left) */}
                <Card className="flex flex-col border-2 border-muted h-full">
                    <CardHeader className="bg-muted text-2xl">
                        <CardTitle>Antrean Berikutnya</CardTitle>
                        <CardDescription>
                            Antrean yang akan dilayani selanjutnya
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-grow justify-center items-center p-6">
                        {!nextQueue ? (
                            <div className="py-12 text-muted-foreground text-center">
                                <ArrowRight className="opacity-50 mx-auto mb-4 w-24 h-24" />
                                <p className="text-xl">Tidak ada antrean berikutnya</p>
                            </div>
                        ) : (
                            <div className="flex flex-col justify-center px-10 py-6 border rounded-lg w-full h-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-muted-foreground text-lg">
                                            Nomor Antrean
                                        </p>{" "}
                                        <p className="font-bold text-6xl md:text-8xl">
                                            {nextQueue.queueNumber}-
                                            {formatQueueTime(nextQueue.createdAt)}
                                        </p>
                                        <div className="mt-4">
                                            <Badge
                                                variant="outline"
                                                className={`text-lg px-3 py-1 ${nextQueue.queueType === "ONLINE"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {nextQueue.queueType === "ONLINE"
                                                    ? "Online"
                                                    : "Offline"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground text-2xl">Layanan</p>
                                        <p className="mt-2 font-medium text-3xl">
                                            {nextQueue.service.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Currently being served (now on right) */}
                <Card className="flex flex-col border-5 border-primary h-full">
                    <CardHeader className="text-primary-foreground text-2xl">
                        <CardTitle>Sedang Dilayani</CardTitle>
                        <CardDescription className="text-primary-foreground/90">
                            Antrean yang saat ini sedang dilayani oleh petugas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow py-6">
                        {servingQueues.length === 0 ? (
                            <div className="flex flex-col justify-center items-center py-12 h-full text-muted-foreground text-center">
                                <UserCog className="opacity-50 mb-4 w-24 h-24" />
                                <p className="text-xl">
                                    Tidak ada antrean yang sedang dilayani
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col justify-center space-y-6 h-full">
                                {servingQueues.map((queue) => (
                                    <div
                                        key={queue.id}
                                        className="flex flex-col justify-center bg-sidebar px-10 py-6 border-2 rounded-lg w-full h-full"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-muted-foreground text-lg">
                                                    Nomor Antrean
                                                </p>
                                                <p className="font-bold text-6xl md:text-8xl">
                                                    {queue.queueNumber}-{formatQueueTime(queue.createdAt)}
                                                </p>
                                                <div className="mt-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-lg px-3 py-1 ${queue.queueType === "ONLINE"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-green-100 text-green-800"
                                                            }`}
                                                    >
                                                        {queue.queueType === "ONLINE"
                                                            ? "Online"
                                                            : "Offline"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground text-2xl">
                                                    Layanan
                                                </p>
                                                <p className="mt-2 font-medium text-3xl">
                                                    {queue.service.name}
                                                </p>
                                                <p className="mt-4 text-muted-foreground text-2xl">
                                                    Petugas:{" "}
                                                    <span className="font-bold text-accent">
                                                        {queue.admin?.name || "-"}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>{" "}
            <footer className="mt-6 text-muted-foreground text-sm text-center">
                Data terakhir diperbarui:{" "}
                {lastUpdatedAt
                    ? new Intl.DateTimeFormat("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                    }).format(lastUpdatedAt)
                    : "Belum ada data"}
            </footer>
        </div>
    );
}
