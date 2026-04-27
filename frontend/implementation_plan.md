# Feature-Based Architecture — insightO Frontend

## الهدف
تحويل هيكل المشروع من الهيكل الحالي إلى **Feature-Based Architecture** بحيث كل فيتشر (مثل `auth`) يكون معزول تماماً وعنده كل اللي بيحتاجه جوّاه.

---

## الهيكل المقترح

```
src/
├── app/                          # إعدادات التطبيق العامة
│   ├── App.tsx
│   ├── main.tsx
│   ├── store.ts                  # Redux store (يجمع كل الـ slices من الفيتشرز)
│   └── router.tsx                # React Router (يجمع كل الـ routes من الفيتشرز)
│
├── features/                     # 🎯 قلب الـ Feature-Based Architecture
│   └── auth/                     # فيتشر المصادقة
│       ├── api/                  # كل API calls الخاصة بـ auth
│       │   └── authApi.ts        # axios calls للـ backend
│       ├── components/           # كومبونانتز الخاصة بـ auth بس
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   └── AuthGuard.tsx
│       ├── hooks/                # custom hooks خاصة بـ auth
│       │   └── useAuth.ts
│       ├── store/                # Redux slice خاص بـ auth
│       │   └── authSlice.ts
│       ├── types/                # TypeScript types خاصة بـ auth
│       │   └── auth.types.ts
│       ├── pages/                # الصفحات الخاصة بـ auth
│       │   ├── LoginPage.tsx
│       │   └── RegisterPage.tsx
│       └── index.ts              # Public API للفيتشر (barrel export)
│
├── shared/                       # مشترك بين كل الفيتشرز
│   ├── components/
│   │   └── ui/                   # (ينقل من src/components/ui)
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── ThemeToggle.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── api/
│       └── axiosInstance.ts      # Axios base instance (ينقل من src/api)
│
└── assets/
```

---

## الفرق بين الهيكل القديم والجديد

| القديم | الجديد |
|--------|--------|
| `src/api/Api.ts` | `src/shared/api/axiosInstance.ts` + `src/features/auth/api/authApi.ts` |
| `src/features/Auth/authSlice.ts` | `src/features/auth/store/authSlice.ts` |
| `src/features/Auth/authService.ts` | `src/features/auth/api/authApi.ts` |
| `src/components/ui/` | `src/shared/components/ui/` |
| `src/Pages/` | داخل كل فيتشر `src/features/*/pages/` |
| `src/store/` | `src/app/store.ts` |
| `src/layout/` | `src/shared/components/layout/` |

---

## User Review Required

> [!IMPORTANT]
> **اسم الفولدر**: هنستخدم lowercase `auth` بدل `Auth` (أحسن convention في feature-based)

> [!WARNING]
> **نقل الملفات**: الـ `authSlice.ts` و `authService.ts` الحاليين فاضيين، هنملاهم بـ boilerplate كامل.

> [!NOTE]
> **الـ `src/api/Api.ts`** فاضي كمان — هنعمل `axiosInstance.ts` فيه الـ base config.

---

## الخطوات التنفيذية

### 1. إنشاء هيكل الفولدرات الجديد
- إنشاء `src/features/auth/api/`
- إنشاء `src/features/auth/components/`
- إنشاء `src/features/auth/hooks/`
- إنشاء `src/features/auth/store/`
- إنشاء `src/features/auth/types/`
- إنشاء `src/features/auth/pages/`
- إنشاء `src/shared/components/ui/`
- إنشاء `src/shared/api/`
- إنشاء `src/app/`

### 2. نقل الملفات الموجودة
- نقل `src/components/ui/*` → `src/shared/components/ui/`
- نقل `src/lib/utils.ts` → `src/shared/lib/utils.ts`

### 3. إنشاء الملفات الجديدة مع boilerplate

**`src/shared/api/axiosInstance.ts`** — Base Axios instance  
**`src/features/auth/types/auth.types.ts`** — TypeScript interfaces  
**`src/features/auth/api/authApi.ts`** — API calls  
**`src/features/auth/store/authSlice.ts`** — Redux slice  
**`src/features/auth/hooks/useAuth.ts`** — Custom hook  
**`src/features/auth/components/LoginForm.tsx`** — Login component  
**`src/features/auth/components/RegisterForm.tsx`** — Register component  
**`src/features/auth/pages/LoginPage.tsx`** — Login page  
**`src/features/auth/pages/RegisterPage.tsx`** — Register page  
**`src/features/auth/index.ts`** — Barrel export  
**`src/app/store.ts`** — Redux store  

### 4. تحديث path aliases
- تحديث `vite.config.ts` و `tsconfig.json` لو محتاج

---

## Open Questions

> [!IMPORTANT]
> هل عندك backend API جاهز؟ عشان أعمل الـ `authApi.ts` بإندبوينتس حقيقية ولا هنعمل مؤقتاً بـ mock data؟

> [!NOTE]
> هل بتستخدم **React Router** للـ routing؟ وعايز أضيف `router.tsx` في الـ `app/` فولدر؟

---

## Verification Plan
- التأكد إن الـ imports مابتتكسرش بعد نقل الملفات
- رن `npm run dev` والتأكد إن المشروع بيبني تمام
- التأكد إن الـ path aliases (`@/`) شغالة مع الهيكل الجديد
