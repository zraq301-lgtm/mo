// api/engine.js
const ALLOWED_MODULES = ['dashboard', 'inventory', 'sales', 'purchases', 'manufacturing'];

export default async function handler(req, res) {
    // إعدادات CORS للحماية والوصول
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // جلب بيانات التوكن والمستودع من متغيرات فيرسل السرية بأمان
    const GITHUB_TOKEN = process.env.NAWAH_GITHUB_TOKEN;
    const REPO_OWNER = process.env.NAWAH_REPO_OWNER;
    const REPO_NAME = process.env.NAWAH_REPO_NAME;

    // 1. استقبال وحفظ البيانات في جيت هب مباشرة
    if (req.method === 'POST') {
        const { module_name, record_id, payload } = req.body;

        if (!ALLOWED_MODULES.includes(module_name)) {
            return res.status(400).json({ error: 'الموديول غير معرف' });
        }

        const filePath = `${module_name}_module/${record_id}.json`;
        const githubUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

        try {
            // أ. محاولة معرفة هل الملف موجود قبل كدة عشان نجيب الـ SHA بتاعه (تحديث أو إضافة)
            let sha = null;
            const checkRes = await fetch(githubUrl, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });
            if (checkRes.status === 200) {
                const checkData = await checkRes.json();
                sha = checkData.sha;
            }

            // ب. تحويل البيانات لـ Base64 كما يطلب جيت هب
            const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');

            // ج. الرفع المباشر لجيت هب
            const uploadRes = await fetch(githubUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Nawah-DB-Engine'
                },
                body: JSON.stringify({
                    message: `🔄 Nawah Commit: ${record_id} in ${module_name}`,
                    content: contentBase64,
                    sha: sha // لو موجود هيحدثه، لو مش موجود (null) هيضيفه جديد
                })
            });

            if (uploadRes.status === 200 || uploadRes.status === 201) {
                return res.status(200).json({ success: true, message: 'تم التخزين الدائم في جيت هب للأبد 🔐' });
            } else {
                const errData = await uploadRes.json();
                return res.status(500).json({ error: 'فشل الرفع لجيت هب', details: errData });
            }

        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(404).end();
}
