// 💡 ميزة الفحص والجلب الذكي: إذا أرسل التطبيق طلب GET مع اسم الموديول، نقوم بجلب البيانات له
if (req.method === 'GET') {
    const { module_name, record_id } = req.query;
    
    // إذا كان مجرد فحص عاري بدون موديول
    if (!module_name) {
        return res.status(200).json({ status: "online", message: "محرك nawah.ai جاهز" });
    }

    const filePath = `${module_name}_module/${record_id || `${module_name}_records`}.json`;
    const githubUrl = `https://api.github.com/repos/${process.env.NAWAH_REPO_OWNER}/${process.env.NAWAH_REPO_NAME}/contents/${filePath}`;

    try {
        const response = await fetch(githubUrl, {
            headers: { 
                'Authorization': `Bearer ${process.env.NAWAH_GITHUB_TOKEN}`,
                'User-Agent': 'Nawah-DB-Engine',
                'Cache-Control': 'no-cache'
            }
        });

        if (response.status === 200) {
            const fileData = await response.json();
            // فك تشفير الـ Base64 القادم من جيت هب وإرجاعه للتطبيق كـ JSON صريح
            const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            return res.status(200).json(JSON.parse(decodedContent));
        } else {
            return res.status(404).json({ error: 'لم يتم العثور على ملفات سابقة لهذا الموديول' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
