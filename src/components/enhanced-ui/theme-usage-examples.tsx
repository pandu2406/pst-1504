"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Info, AlertTriangle, AlertCircle, Copy, Check } from "lucide-react";

export function ThemeUsageExamples() {
    const { theme, setTheme } = useTheme();
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Kode disalin ke clipboard!", {
            description: "Kode telah disalin dan siap untuk digunakan di proyek Anda.",
            icon: <CheckCircle className="w-4 h-4 text-green-500" />
        });
    };

    const cssVariableExample = `// Contoh penggunaan CSS variable untuk styling
<div className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)]">
  <h2 className="text-[var(--primary)]">Judul dengan Warna Primary</h2>
  <p className="text-[var(--text-secondary)]">Text sekunder dengan opacity rendah</p>
  <button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]">
    Tombol Primary
  </button>
</div>`;

    const tailwindComponentExample = `// Contoh komponen Card dengan tema yang konsisten
<Card className="bg-[var(--card)] border-[var(--border)]">
  <CardHeader>
    <CardTitle className="text-[var(--text-primary)]">Judul Card</CardTitle>
    <CardDescription className="text-[var(--text-secondary)]">
      Deskripsi singkat tentang konten card
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-[var(--text-primary)]">Konten utama card</p>
  </CardContent>
  <CardFooter className="bg-[var(--background)] border-[var(--border)] border-t">
    <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]">
      Aksi
    </Button>
  </CardFooter>
</Card>`;

    return (
        <div className="space-y-8">
            <Card className="bg-[var(--card)] shadow-md border-[var(--border)] overflow-hidden">
                <CardHeader className="border-[var(--border)] border-b">
                    <CardTitle className="text-[var(--text-primary)]">Panduan Penggunaan Tema</CardTitle>
                    <CardDescription className="text-[var(--text-secondary)]">
                        Contoh penggunaan warna tema dalam berbagai komponen UI
                    </CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                    <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
                        <div className="space-y-5">
                            <h3 className="font-medium text-[var(--text-primary)] text-lg">
                                Contoh Alert dengan Tema
                            </h3>

                            <Alert className="bg-[var(--surface)] border-[var(--primary)] border-l-4">
                                <Info className="w-4 h-4 text-[var(--primary)]" />
                                <AlertTitle className="text-[var(--text-primary)]">Info</AlertTitle>
                                <AlertDescription className="text-[var(--text-secondary)]">
                                    Pesan informasi umum menggunakan warna primary
                                </AlertDescription>
                            </Alert>

                            <Alert className="bg-[var(--surface)] border-[var(--secondary)] border-l-4">
                                <AlertTriangle className="w-4 h-4 text-[var(--secondary)]" />
                                <AlertTitle className="text-[var(--text-primary)]">Peringatan</AlertTitle>
                                <AlertDescription className="text-[var(--text-secondary)]">
                                    Pesan peringatan menggunakan warna secondary
                                </AlertDescription>
                            </Alert>

                            <Alert className="bg-[var(--surface)] border-[var(--accent)] border-l-4">
                                <AlertCircle className="w-4 h-4 text-[var(--accent)]" />
                                <AlertTitle className="text-[var(--text-primary)]">Error</AlertTitle>
                                <AlertDescription className="text-[var(--text-secondary)]">
                                    Pesan error menggunakan warna accent
                                </AlertDescription>
                            </Alert>

                            <div className="bg-[var(--background)] p-4 border border-[var(--border)] rounded-lg">
                                <h3 className="mb-3 font-medium text-[var(--text-primary)] text-base">
                                    Form dengan Tema
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[var(--text-primary)]">
                                            Nama
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="Masukkan nama"
                                            className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[var(--text-primary)]">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            placeholder="email@example.com"
                                            className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <Button
                                        className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] w-full text-[var(--primary-foreground)]"
                                    >
                                        Kirim
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <h3 className="font-medium text-[var(--text-primary)] text-lg">
                                Kode Contoh
                            </h3>

                            <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-md overflow-hidden">
                                <div className="flex justify-between items-center bg-[var(--surface)] px-4 py-2 border-[var(--border)] border-b">
                                    <div className="font-medium text-[var(--text-primary)] text-sm">
                                        Penggunaan CSS Variables
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[var(--text-secondary)] hover:text-[var(--primary)]"
                                        onClick={() => copyToClipboard(cssVariableExample)}
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                <pre className="p-4 max-h-[280px] overflow-auto text-[var(--text-primary)] text-xs">
                                    <code className="font-mono">{cssVariableExample}</code>
                                </pre>
                            </div>

                            <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-md overflow-hidden">
                                <div className="flex justify-between items-center bg-[var(--surface)] px-4 py-2 border-[var(--border)] border-b">
                                    <div className="font-medium text-[var(--text-primary)] text-sm">
                                        Contoh Komponen Card
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[var(--text-secondary)] hover:text-[var(--primary)]"
                                        onClick={() => copyToClipboard(tailwindComponentExample)}
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                <pre className="p-4 max-h-[280px] overflow-auto text-[var(--text-primary)] text-xs">
                                    <code className="font-mono">{tailwindComponentExample}</code>
                                </pre>
                            </div>

                            <div className="space-y-3 bg-[var(--surface)] p-4 border border-[var(--border)] rounded-lg">
                                <h3 className="font-medium text-[var(--text-primary)]">Status Badges</h3>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                                        Aktif
                                    </Badge>
                                    <Badge className="bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                        Tertunda
                                    </Badge>
                                    <Badge className="bg-[var(--accent)] text-[var(--accent-foreground)]">
                                        Ditolak
                                    </Badge>
                                    <Badge variant="outline" className="border-[var(--border)] text-[var(--text-primary)]">
                                        Draft
                                    </Badge>
                                </div>
                                <p className="mt-2 text-[var(--text-secondary)] text-sm">
                                    Badge dapat menggunakan variabel warna theme sesuai dengan konteks penggunaannya.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex md:flex-row flex-col justify-between gap-4 bg-[var(--background)] border-[var(--border)] border-t">
                    <div className="text-[var(--text-secondary)] text-sm">
                        Semua komponen di atas menggunakan CSS variables dari tema yang telah didefinisikan.
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            Ganti Tema
                        </Button>
                        <Button
                            size="sm"
                            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]"
                            onClick={() => toast("Panduan Lengkap",{ 
                                description: "Dokumentasi lengkap penggunaan tema akan segera tersedia.",
                                icon: <Info className="w-4 h-4" />
                            })}
                        >
                            Lihat Dokumentasi
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
