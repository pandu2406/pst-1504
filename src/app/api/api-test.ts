import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Contoh query sederhana untuk cek koneksi, misal hitung jumlah user
    const count = await prisma.user.count();
    res.status(200).json({ success: true, userCount: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
