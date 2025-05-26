import { PrismaClient, Role, ServiceStatus } from "@/generated/prisma";
import bcryptjs from "bcryptjs";
// import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import QRCode from "qrcode";

const prisma = new PrismaClient();
const staticUuid = process.env.NEXT_PUBLIC_STATIC_UUID as string;
if (!staticUuid) {
	throw new Error(
		"NEXT_PUBLIC_STATIC_UUID environment variable must be defined"
	);
}

async function main() {
	// Create QR Code directory if it doesn't exist
	const qrCodeDir = path.join(process.cwd(), "public", "qrcodes");
	if (!fs.existsSync(qrCodeDir)) {
		fs.mkdirSync(qrCodeDir, { recursive: true });
	}

	// Generate QR Code
	const qrCodePath = path.join(qrCodeDir, "pst-qrcode.png");
	const qrCodeUrl = `${process.env.NEXT_PUBLIC_AUTH_URL}/visitor-form/${staticUuid}`;

	await QRCode.toFile(qrCodePath, qrCodeUrl, {
		color: {
			dark: "#13254e",
			light: "#FFFFFF",
		},
		width: 300,
		margin: 1,
	});

	// Save QR Code info to database
	const qrCode = await prisma.qRCode.upsert({
		where: { staticUuid },
		update: {
			path: `/qrcodes/pst-qrcode.png`,
		},
		create: {
			staticUuid,
			path: `/qrcodes/pst-qrcode.png`,
		},
	});

	console.log(
		`QR Code created at ${qrCodePath}, with UUID: ${qrCode.staticUuid}`
	);

	// Create superadmin user
	const hashedPassword = await bcryptjs.hash("superadmin", 10);
	const superadmin = await prisma.user.upsert({
		where: { username: "superadmin" },
		update: {
			password: hashedPassword,
		},
		create: {
			username: "superadmin",
			password: hashedPassword,
			name: "Super Admin",
			role: Role.SUPERADMIN,
		},
	});

	console.log(`Created superadmin user: ${superadmin.username}`);

	// Create regular admin users (11 admins as specified)
	const adminUsers = [];
	for (let i = 1; i <= 11; i++) {
		const username = `admin${i}`;
		const hashedAdminPassword = await bcryptjs.hash(username, 10);

		const admin = await prisma.user.upsert({
			where: { username },
			update: {
				password: hashedAdminPassword,
			},
			create: {
				username,
				password: hashedAdminPassword,
				name: `Admin ${i}`,
				role: Role.ADMIN,
			},
		});

		adminUsers.push(admin);
		console.log(`Created admin user: ${admin.username}`);
	}

	// Create initial services
	const services = [
		{ name: "Perpustakaan", status: ServiceStatus.ACTIVE },
		{ name: "Konsultasi Statistik", status: ServiceStatus.ACTIVE },
		{ name: "Rekomendasi Statistik", status: ServiceStatus.ACTIVE },
	];

	for (const serviceData of services) {
		// First, check if a service with this name already exists
		const existingService = await prisma.service.findFirst({
			where: { name: serviceData.name },
		});

		if (existingService) {
			// Update existing service
			const service = await prisma.service.update({
				where: { id: existingService.id },
				data: {
					status: serviceData.status,
				},
				select: {
					name: true,
				},
			});
			console.log(`Updated service: ${service.name}`);
		} else {
			// Create new service
			const service = await prisma.service.create({
				data: {
					name: serviceData.name,
					status: serviceData.status,
				},
				select: {
					name: true,
				},
			});
			console.log(`Created service: ${service.name}`);
		}
	}

	console.log("Database seeding completed successfully!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
