export const checkWhatsAppBotEnv = (): {
	isValid: boolean;
	message: string;
} => {
	const apiUrl = process.env.NEXT_PUBLIC_WA_API_URL;
	const adminKey = process.env.NEXT_PUBLIC_WA_ADMIN_KEY;
	console.log(`apiUrl: ${apiUrl}, adminKey: ${adminKey}`);

	if (!apiUrl || !adminKey) {
		return {
			isValid: false,
			message:
				"Variabel lingkungan untuk WhatsApp Bot belum dikonfigurasi. Tambahkan NEXT_PUBLIC_WA_API_URL dan NEXT_PUBLIC_WA_ADMIN_KEY di file .env",
		};
	}

	return { isValid: true, message: "" };
};
