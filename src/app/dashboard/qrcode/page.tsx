"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import QRCodeSkeleton from "@/components/ui/qrcode-skeleton";

export default function QRCodePage() {
    const [isLoading, setIsLoading] = useState(true);
    const qrCodeUrl = "/qrcodes/pst-qrcode.png";

    useEffect(() => {
        // Simulate loading delay for demonstration purposes
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = qrCodeUrl;
        link.download = "pst_qrcode.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }; return (
        <>
            {isLoading ? (
                <QRCodeSkeleton />
            ) : (
                <div className="mx-auto p-4 md:p-8 container">
                    <h1 className="mb-6 font-bold text-2xl md:text-3xl text-center">
                        QR Code PST BPS Kabupaten Batang Hari
                    </h1>
                    <div className="flex flex-col items-center space-y-6">
                        <div className="bg-[#FFF4EC] shadow-lg p-2 border-4 border-gray-300 dark:border-gray-700 rounded-lg">
                            <Image
                                src={qrCodeUrl}
                                alt="QR Code PST BPS Kabupaten Batang Hari"
                                width={300}
                                height={300}
                                priority
                            />
                        </div>
                        <Button
                            onClick={handleDownload}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            <Download className="mr-2 w-5 h-5" />
                            Download QR Code
                        </Button>
                    </div>            <div className="bg-card shadow-sm mt-8 p-6 border rounded-lg">
                        <h2 className="mb-3 font-semibold text-xl">Informasi QR Code</h2>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                            Scan QR code ini untuk mengakses informasi PST BPS Kabupaten Batang Hari secara cepat dan mudah.
                        </p>
                        <div className="bg-primary/10 p-4 border border-primary/30 rounded-md">
                            <h3 className="mb-2 font-medium text-md">Cara Penggunaan:</h3>
                            <ol className="space-y-2 ml-2 text-sm list-decimal list-inside">
                                <li>Tampilkan QR code di area publik kantor BPS Kabupaten Batang Hari</li>
                                <li>Pengunjung dapat memindai QR code dengan kamera smartphone</li>
                                <li>QR code akan mengarahkan pengunjung ke halaman pelayanan statistik terpadu</li>
                                <li>Pengunjung dapat langsung mengakses layanan antrean tanpa perlu mengetikkan URL</li>
                            </ol>                </div>
                    </div>
                </div>
            )}
        </>
    );
}
