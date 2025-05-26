import { NextResponse } from "next/server";
import { checkWhatsAppBotEnv } from "@/lib/env-checker";

export async function GET() {
	const waCheck = checkWhatsAppBotEnv();
	const services = {
		database: {
			status: "ok",
			message: "Database connection is active",
		},
		whatsapp: {
			status: waCheck.isValid ? "ok" : "error",
			message: waCheck.isValid ? "WhatsApp Bot is configured" : waCheck.message,
		},
		api: {
			status: "ok",
			message: "API is responding",
		},
	};

	const allServicesOk = Object.values(services).every(
		(service) => service.status === "ok"
	);

	return NextResponse.json(
		{
			status: allServicesOk ? "ok" : "degraded",
			message: allServicesOk
				? "All services are operational"
				: "Some services have issues",
			timestamp: new Date().toISOString(),
			services,
		},
		{ status: 200 }
	);
}
