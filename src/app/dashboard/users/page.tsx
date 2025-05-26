"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import UsersManagementSkeleton from "@/components/ui/users-management-skeleton";

interface User {
    id: string;
    name: string;
    username: string;
    role: Role;
    createdAt: string;
}

export default function UsersManagementPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form states
    const [newUsername, setNewUsername] = useState("");
    const [newName, setNewName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Check if user is superadmin
    useEffect(() => {
        if (session && session.user.role !== Role.SUPERADMIN) {
            toast.error("Anda tidak memiliki akses ke halaman ini");
            router.push("/dashboard");
        }
    }, [session, router]);

    // Fetch users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/users");

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            } else {
                toast.error("Gagal memuat daftar pengguna");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Terjadi kesalahan saat memuat pengguna");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Password dan konfirmasi password tidak sama");
            return;
        }

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newName,
                    username: newUsername,
                    password: newPassword,
                    role: Role.ADMIN,
                }),
            });

            if (response.ok) {
                toast.success("Admin berhasil ditambahkan");
                setAddDialogOpen(false);
                resetFormFields();
                fetchUsers();
            } else {
                const data = await response.json();
                toast.error(data.error || "Gagal menambahkan admin");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            toast.error("Terjadi kesalahan saat menambahkan admin");
        }
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;

        // Only check passwords if they're being changed
        if (newPassword && newPassword !== confirmPassword) {
            toast.error("Password dan konfirmasi password tidak sama");
            return;
        }

        try {
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newName || selectedUser.name,
                    username: newUsername || selectedUser.username,
                    ...(newPassword ? { password: newPassword } : {}),
                }),
            });

            if (response.ok) {
                toast.success("Admin berhasil diperbarui");
                setEditDialogOpen(false);
                resetFormFields();
                fetchUsers();
            } else {
                const data = await response.json();
                toast.error(data.error || "Gagal memperbarui admin");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Terjadi kesalahan saat memperbarui admin");
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Admin berhasil dihapus");
                setDeleteDialogOpen(false);
                fetchUsers();
            } else {
                const data = await response.json();
                toast.error(data.error || "Gagal menghapus admin");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Terjadi kesalahan saat menghapus admin");
        }
    };

    const resetFormFields = () => {
        setNewUsername("");
        setNewName("");
        setNewPassword("");
        setConfirmPassword("");
        setSelectedUser(null);
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setNewUsername(user.username);
        setNewName(user.name);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    if (session?.user?.role !== Role.SUPERADMIN) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-bold text-2xl">Kelola Admin</h1>
                    <p className="text-muted-foreground">
                        Kelola pengguna admin sistem
                    </p>
                </div>

                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 w-4 h-4" />
                            Tambah Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Admin Baru</DialogTitle>
                            <DialogDescription>
                                Tambahkan admin baru untuk mengelola sistem antrean PST
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Masukkan nama lengkap"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Masukkan username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Masukkan konfirmasi password"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleAddUser}>Simpan</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Admin</CardTitle>
                    <CardDescription>
                        Daftar pengguna admin yang dapat mengelola sistem antrean
                    </CardDescription>                </CardHeader>
                <CardContent>
                    {loading ? (
                        <UsersManagementSkeleton />
                    ) : users.length === 0 ? (
                        <div className="py-4 text-center">Tidak ada admin saat ini</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Tgl Dibuat</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.username}</TableCell>
                                            <TableCell>
                                                {user.role === Role.SUPERADMIN ? "Super Admin" : "Admin"}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.createdAt).toLocaleDateString("id-ID")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditDialog(user)}
                                                        disabled={user.role === Role.SUPERADMIN}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => openDeleteDialog(user)}
                                                        disabled={user.role === Role.SUPERADMIN}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Admin</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi admin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nama Lengkap</Label>
                            <Input
                                id="edit-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Masukkan nama lengkap"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-username">Username</Label>
                            <Input
                                id="edit-username"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Masukkan username"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">Password Baru (opsional)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Biarkan kosong jika tidak ingin mengubah"
                            />
                        </div>
                        {newPassword && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-confirmPassword">Konfirmasi Password</Label>
                                <Input
                                    id="edit-confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Konfirmasi password baru"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleEditUser}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Admin</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus admin ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            Admin <strong>{selectedUser?.name}</strong> akan dihapus dari sistem.
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}