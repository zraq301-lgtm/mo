export default async function handler(req, res) {
  // تفعيل الـ CORS لحل أي حظر من المتصفح أو تطبيق الهاتف
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 📥 محرك الجلب والسحب (GET)
  if (req.method === 'GET') {
    const { module_name, record_id } = req.query;

    // إذا طلبنا الرابط مباشرة من المتصفح للفحص بدون بارامترات
    if (!module_name) {
      return res.status(200).json({ 
        status: "online", 
        message: "محرك nawah.ai السحابي يعمل بكفاءة ومستعد لسحب البيانات 🚀" 
      });
    }

    // بناء المسار السحابي بدقة داخل مستودع جيت هب
    const owner = process.env.NAWAH_REPO_OWNER || 'zraq301-lgtm';
    const repo = process.env.NAWAH_REPO_NAME || 'Nawah-AI-db';
    const token = process.env.NAWAH_GITHUB_TOKEN;
    const tenant = 'nawah-core';

    const path = `database/${tenant}/${module_name}/${record_id}.json`;
    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    try {
      const response = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.status === 200) {
        const fileData = await response.json();
        // فك تشفير النص القادم من جيت هب وإرساله للتطبيق كـ JSON نظيف
        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return res.status(200).json(JSON.parse(decodedContent));
      } else {
        // في حال لم يتم رفع هذا الملف بعد، نرسل مصفوفة فارغة لتجنب كراش التطبيق
        return res.status(200).json([]);
      }
    } catch (err) {
      return res.status(500).json({ error: 'خطأ أثناء جلب البيانات السحابية', details: err.message });
    }
  }

  // 📤 محرك الرفع والتحديث (POST) الذي تم شرحه سابقاً
  if (req.method === 'POST') {
    // كود الـ POST الخاص بك الذي يقوم بالرفع الناجح للمخزن...
    // (اتركه كما هو لضمان استمرار الرفع الناجح)
  }
}
