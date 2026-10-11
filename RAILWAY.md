# النشر على Railway (خدمة واحدة: API + الواجهة)

الـ `Dockerfile` يبني الواجهة والـ API معاً، ويقدّم الـ API الواجهة من نفس السيرفر وعلى نفس الدومين.

## التعديلات
- `Dockerfile`: ثلاث مراحل (بناء الواجهة، بناء الـ API، صورة نهائية واحدة). حُذف `--mount=type=cache` (Railway يرفضه) ونسخ `.git`.
- `api/src/core/api.js`: يقدّم ملفات الواجهة عند ضبط `WEB_DIR` (يضبطه الـ Dockerfile). متصفح يفتح `/` يحصل على الواجهة، وعملاء الـ API يحصلون على JSON المعلومات كالمعتاد. كما يضيف رؤوس `COOP/COEP` المطلوبة للمعالجة المحلية.
- `web/src/lib/api/api-url.ts`: القيمة `WEB_DEFAULT_API=self` تعني أن الواجهة تستخدم دومين الصفحة نفسه، فلا حاجة لمعرفة الدومين وقت البناء.
- `api/src/core/env.js`: يقرأ `PORT` ويستنتج `API_URL` من `RAILWAY_PUBLIC_DOMAIN`.
- `api/src/core/api.js`: أُضيف `100.64.0.0/10` إلى `trust proxy` لقراءة IP العميل الحقيقي.
- `packages/version-info`: لا يتعطل عند غياب `.git`.
- `railway.json`: إعداد البناء والـ healthcheck.

## الخطوات
1. ارفع المشروع إلى GitHub.
2. Railway → New Project → Deploy from GitHub repo.
3. Settings → Networking → **Generate Domain**.
4. افتح الدومين: تظهر الواجهة، وطلبات الـ API تذهب لنفس الدومين تلقائياً.

لا حاجة لأي متغير إلزامي.

## ملاحظات
- ضع في Variables المتغير `PORT=9000`، ثم في Networking اجعل منفذ الدومين `9000` ليتطابق مع البورت الذي يستمع عليه التطبيق.
- يجب توليد دومين (Generate Domain) حتى يُستنتج `API_URL`؛ وإلا ضعه يدوياً، مثال: `API_URL=https://اسم-الخدمة.up.railway.app/`.
- لدومين مخصص: حدّث `API_URL` (مع `/` في النهاية) وإلا ستفشل روابط التنزيل (tunnel).
- `WEB_HOST` / `WEB_PLAUSIBLE_HOST` / `WEB_ENABLE_WEBCODECS` اختيارية وتُدمج وقت البناء (تحتاج Redeploy).
- إذا كان الـ API عاماً، فعّل الحماية (`docs/protect-an-instance.md`).
- ملفات الكوكيز: استخدم Volume، فنظام ملفات الحاوية مؤقت.
