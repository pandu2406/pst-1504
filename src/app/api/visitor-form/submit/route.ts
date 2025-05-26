import { PrismaClient, QueueStatus, QueueType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, phone, institution, email, serviceId, tempUuid, queueType } = data;

    // 1. Validasi input
    if (!name || !phone || !serviceId || !tempUuid || !queueType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Cek UUID sementara
    const tempVisitorLink = await prisma.tempVisitorLink.findUnique({ where: { uuid: tempUuid } });
    if (!tempVisitorLink) {
      return NextResponse.json({ error: "Invalid temporary link" }, { status: 400 });
    }
    if (tempVisitorLink.used) {
      return NextResponse.json({ error: "This form has already been submitted" }, { status: 400 });
    }
    if (new Date() > tempVisitorLink.expiresAt) {
      return NextResponse.json({ error: "Link has expired" }, { status: 400 });
    }

    // 3. Ambil antrean terakhir hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestQueue = await prisma.queue.findFirst({
      where: { createdAt: { gte: today } },
      orderBy: { queueNumber: "desc" },
    });

    const nextQueueNumber = latestQueue ? latestQueue.queueNumber + 1 : 1;
    const trackingLink = nanoid(10);

    // 4. Jalankan transaksi untuk buat visitor, queue, dan update UUID
    const result = await prisma.$transaction(async (tx) => {
      const visitor = await tx.visitor.create({
        data: { name, phone, institution, email },
      });

      const queue = await tx.queue.create({
        data: {
          queueNumber: nextQueueNumber,
          status: QueueStatus.WAITING,
          queueType: queueType === "ONLINE" ? QueueType.ONLINE : QueueType.OFFLINE,
          visitorId: visitor.id,
          serviceId,
          tempUuid,
          trackingLink,
          filledSKD: false,
        },
        include: { service: true },
      });

      await tx.tempVisitorLink.update({
        where: { uuid: tempUuid },
        data: { used: true },
      });

      return { visitor, queue };
    });

    // 5. Buat notifikasi di luar transaksi
    const formatQueueDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      return `${day}${month}`;
    };

    await prisma.notification.create({
      data: {
        type: "NEW_QUEUE",
        title: "Antrean Baru",
        message: `Antrean baru #${result.queue.queueNumber}-${formatQueueDate(
          new Date(result.queue.createdAt)
        )} (${result.queue.queueType === "ONLINE" ? "Online" : "Offline"}) dari ${result.visitor.name} untuk layanan ${result.queue.service.name}`,
        isRead: false,
      },
    });

    // 6. Response sukses
    return NextResponse.json({
      success: true,
      message: "Queue created successfully",
      data: {
        queueNumber: result.queue.queueNumber,
        serviceName: result.queue.service.name,
        visitorName: result.visitor.name,
        createdAt: result.queue.createdAt,
        queueType: result.queue.queueType,
        redirectUrl: `/visitor-form/${tempUuid}`,
      },
    });

  } catch (error: unknown) {
    console.error("Error submitting visitor form:", error);
    return NextResponse.json({ error: "Failed to process visitor form" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
