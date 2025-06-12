// File ini adalah Serverless Function Vercel.
// Dia akan berjalan di server, bukan di browser.

export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  // Ambil API Key dari Environment Variables Vercel (disimpan dengan aman)
  // Nama variabelnya 'GEMINI_API_KEY'
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Kalau API Key belum di-set di Vercel, kasih error
    return response.status(500).json({ error: "API Key belum dikonfigurasi di server." });
  }

  try {
    // Ambil data (teks, bahasa sumber, bahasa target) yang dikirim dari web translator
    const { text, source, target } = request.body;

    // Validasi input
    if (!text || !source || !target) {
      return response.status(400).json({ error: "Input tidak lengkap." });
    }

    const prompt = `Terjemahkan teks berikut dari bahasa ${source} ke bahasa ${target}. Gaya terjemahannya harus natural, santai, dan seperti percakapan sehari-hari, bukan terjemahan yang kaku atau formal. Jika ada kata slang atau ungkapan khas, carikan padanan yang paling mendekati. Teks: "${text}" Hasil terjemahan:`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error("Google API Error:", errorData);
      // Teruskan pesan error dari Google ke pengguna
      return response.status(apiResponse.status).json({ error: `Google API Error: ${errorData.error.message}` });
    }

    const result = await apiResponse.json();
    const translatedText = result.candidates[0]?.content?.parts[0]?.text || "Gagal mendapatkan hasil terjemahan.";

    // Kirim hasil terjemahan kembali ke web translator
    return response.status(200).json({ translation: translatedText.trim() });
  } catch (error) {
    console.error("Server Error:", error);
    return response.status(500).json({ error: "Terjadi kesalahan internal pada server." });
  }
}
