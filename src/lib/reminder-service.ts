import { checkWhatsAppBotEnv } from "./env-checker";

export interface ReminderResponse {
	success: boolean;
	message: string;
	data?: unknown;
}

/**
 * Sends a reminder via WhatsApp direct link
 * @param phoneNumber The recipient phone number
 * @param message The message to send
 * @returns Response with success status and URL
 */
export async function sendWhatsAppDirectReminder(
	phoneNumber: string,
	message: string
): Promise<ReminderResponse> {
	try {
		// Clean phone number
		let cleanNumber = phoneNumber.replace(/\s+/g, "");
		if (cleanNumber.startsWith("+62")) {
			cleanNumber = cleanNumber.substring(1); // Remove the + sign
		} else if (cleanNumber.startsWith("0")) {
			cleanNumber = "62" + cleanNumber.substring(1);
		} else if (!cleanNumber.startsWith("62")) {
			cleanNumber = "62" + cleanNumber;
		}

		// Create WhatsApp URL
		const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
			message
		)}`;

		return {
			success: true,
			message: "WhatsApp reminder link prepared",
			data: { whatsappUrl, phoneNumber: cleanNumber },
		};
	} catch (error) {
		console.error("Error preparing WhatsApp direct reminder:", error);
		return {
			success: false,
			message: "Gagal menyiapkan pengingat via WhatsApp direct",
		};
	}
}

/**
 * Sends a reminder via WhatsApp Bot API
 * @param phoneNumber The recipient phone number
 * @param message The message to send
 * @returns Response with success status
 */
export async function sendWhatsAppBotReminder(
	phoneNumber: string,
	message: string
  ): Promise<ReminderResponse> {
	try {
	  const envCheck = checkWhatsAppBotEnv();
	  if (!envCheck.isValid) {
		return { success: false, message: envCheck.message };
	  }
  
	  let cleanNumber = phoneNumber.replace(/\s+/g, "");
	  if (cleanNumber.startsWith("+62")) {
		cleanNumber = cleanNumber.substring(1);
	  } else if (cleanNumber.startsWith("0")) {
		cleanNumber = "62" + cleanNumber.substring(1);
	  } else if (!cleanNumber.startsWith("62")) {
		cleanNumber = "62" + cleanNumber;
	  }
  
	  const apiUrl = process.env.NEXT_PUBLIC_WA_API_URL!;
	  const token = process.env.NEXT_PUBLIC_WA_ADMIN_KEY!;
  
	  const response = await fetch(`${apiUrl}/send`, {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		  Authorization: token, // langsung pakai token ini
		},
		body: JSON.stringify({
		  target: cleanNumber,
		  message: message,
		}),
	  });
  
	  const result = await response.json();
  
	  if (result.status === false) {
		return { success: false, message: result.reason || "Gagal mengirim pesan" };
	  }
  
	  return {
		success: true,
		message: "Pesan berhasil dikirim",
		data: result,
	  };
	} catch (error) {
	  console.error("WhatsApp Bot error:", error);
	  return {
		success: false,
		message: "Terjadi kesalahan saat mengirim pesan via WhatsApp Bot",
	  };
	}
  }
  