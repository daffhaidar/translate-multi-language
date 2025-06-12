// Pastikan file ini mengirimkan Markdown mentah dari Google
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API Key belum dikonfigurasi di server.' });
  }

  try {
    const { text, source, target } = request.body;
    if (!text || !source || !target) {
        return response.status(400).json({ error: 'Input tidak lengkap.' });
    }
    const prompt = `Terjemahkan teks berikut dari bahasa ${source} ke bahasa ${target}. Gaya terjemahannya harus natural, santai, dan seperti percakapan sehari-hari. Berikan beberapa opsi jika memungkinkan menggunakan daftar atau format tebal. Teks: "${text}" Hasil terjemahan:`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('Google API Error:', errorData);
        return response.status(apiResponse.status).json({ error: `Google API Error: ${errorData.error.message}` });
    }
    
    const result = await apiResponse.json();
    const translatedText = result.candidates[0]?.content?.parts[0]?.text || "Gagal mendapatkan hasil terjemahan.";

    // Langsung kirim hasil mentah dari Google, jangan dibersihkan
    return response.status(200).json({ translation: translatedText.trim() });

  } catch (error) {
    console.error('Server Error:', error);
    return response.status(500).json({ error: 'Terjadi kesalahan internal pada server.' });
  }
}
