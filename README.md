<a id="english"></a>

# Travel Ops app

**English** · [မြန်မာဘာသာ (Burmese)](#myanmar)

One app for our company work: customers, bookings, trips, visas, passports and air tickets.
It works on a phone and on a computer, and it keeps working without internet.

---

## 1. Open the app

1. Open the app link in **Chrome** (Android or computer) or **Safari** (iPhone).
2. Install it like a normal app:
   - **Android / computer:** Chrome menu **⋮** → **Install app** (or **Add to Home screen**).
   - **iPhone:** **Share** button → **Add to Home Screen**.
3. Open it from your home screen from now on.

## 2. Sign in

1. Your admin sends you an email invitation. Open it and choose a password.
2. In the app, type your **email** and **password** and press **Sign in**.
3. The first sign-in needs internet. After that, the app also opens without internet.
4. If you see **"Waiting for approval"**, your admin has not let you in yet. Ask them, then press **Check again**.

## 3. The screens

| Screen | What it is for |
|---|---|
| **Overview** | Money and work at a glance: revenue, profit, sales, alerts. |
| **Revenue** | Money by service, country, trip length, destination or town. Compare two things. |
| **Packages** | Trip packages with price, cost and profit. You can change prices here. |
| **Visa** / **Passport** | Move each case step by step. See deadlines. |
| **Tickets** | Air tickets and commission. |
| **Trips** | Calendar of trips and deadlines. Add events to Google Calendar. |
| **Heatmaps** | Maps of where customers travel and which towns they come from. |
| **Bookings** | Add, confirm, finish or cancel bookings. |
| **Customers** | Customer list. Passports that expire soon are shown in colour. |
| **Settings** | Your account, sync, currency, install, backup. |
| **Admin** | Only for admins: import data, staff accounts. |

All money is in **kyat (Ks)**. You can show US dollars with the currency menu at the top.

## 4. Offline work and sync

- Every change you make is **saved on your phone first**, then **sent to the company cloud** automatically.
- Changes from other staff **come to your phone** automatically.
- The badge at the top right tells you what is happening:

| Badge | Meaning |
|---|---|
| **Synced** | Everything is up to date. |
| **Syncing…** | Sending and receiving now. |
| **Offline · 3 waiting** | No internet. 3 changes will be sent when internet comes back. Keep working. |
| **Sync problem · retry** | Something went wrong. Tap the badge to try again. If it stays, tell your admin. |

- If two people change **the same record**, the change that reaches the cloud **last** is kept.
- **Do not sign out while changes are waiting.** Signing out removes the company data from this phone (it stays safe in the cloud). The app warns you first.

## 5. For admins

### Let a new staff member in
**Way A — no email needed (easiest):**
1. **supabase.com** → our project → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Type their email and a **temporary password**. Tick **Auto Confirm User**. Click **Create user**.
3. Give them the temporary password in person. They sign in, then go to **Settings** → **Change password**.

**Way B — invite by email:**
1. **Authentication** → **Users** → **Add user** → **Send invitation**. Type their email.
2. They open the email **on the phone or computer they will use**, tap the link, and the app shows **Choose your password**.
3. The link works **once** and expires. If it fails, send a new invite (or they can use **Forgot password?**).

**Then, for both ways:** they see **"Waiting for approval"**. In the app: **Admin** → **Staff accounts** → change their role from **pending** to **staff** (or **admin**).

| Role | Can do |
|---|---|
| **pending** | Nothing. Waiting for approval. |
| **staff** | See and change all business data. |
| **admin** | Everything staff can do, plus import data and change roles. |

To stop someone using the app, change their role back to **pending**. The company always keeps at least one admin.

### Import data from a backup file
1. **Admin** → **Import a backup (JSON)** → **Choose file…**
2. The app checks the file first. Nothing changes yet.
   - **Red box:** the file has problems. Fix them and try again.
   - **Yellow box:** please check these points, but you can still import.
3. Choose how to import:
   - **Add to current data** — keeps everything and adds the file's records.
   - **Replace all data** — removes all current data **for everyone**, then loads the file. Type **REPLACE** to confirm.
4. Press **Import**. The data goes to the cloud and to every phone.
5. **Import history** shows who imported what and when.

Backups from the old app version also work. If a phone still has data from the old version, an extra button **"Import data from the old app version on this device"** appears.

## 6. Backups

- **Settings** → **Backup (JSON)** saves a copy of all data as a file. Do this **every week**.
- The file has customer information. Keep it private. Do not post it or email it to people outside the company.

## 7. Privacy and safety rules

- Never share your password. Each person has their own account.
- Sign out on shared or borrowed phones.
- Customer data must never be put on GitHub or any public website.
- The database **service_role** key must never be put in the app or in Vercel. Only the **anon** key goes there.

## 8. One-time setup (for the IT person)

1. **Create the database:** go to **supabase.com** → **New project**. Region: **Southeast Asia (Singapore)**. Save the database password somewhere safe.
2. **Create the tables:** Supabase → **SQL Editor** → paste all of `supabase/migrations/0001_init.sql` → **Run**.
3. **Close public sign-up:** Supabase → **Authentication** → **Sign In / Providers** → turn **off** "Allow new users to sign up". (Invites still work.)
4. **Set the app's address** (so email links open the app, not `localhost:3000`): Supabase → **Authentication** → **URL Configuration**.
   - **Site URL:** your Vercel address, for example `https://your-app.vercel.app`
   - **Redirect URLs** → **Add URL:** `https://your-app.vercel.app/**`
5. **Create the first admin:**
   1. **Authentication** → **Users** → **Add user** → **Create new user** with the owner's email and a password. Tick **Auto Confirm User**.
   2. **SQL Editor** → run: `update public.profiles set role = 'admin' where email = 'owner@example.com';` (use the real email).
6. **Connect the app:** Supabase → **Project Settings** → **API**. Copy the **Project URL** and the **anon public** key.
   In **Vercel** → our project → **Settings** → **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
7. **Redeploy:** Vercel → **Deployments** → **Redeploy**. The app now shows the sign-in screen.
8. **Load the first data** (optional): sign in as admin → **Admin** → import a backup file.

Without step 6 the app runs in **local-only mode**: no sign-in, no sync, data stays on each device.

**About emails (invites and "Forgot password?"):** Supabase's built-in email sender is only for testing. It sends very few emails per hour and may only deliver to your own Supabase team members. For staff emails, add your own email sender: Supabase → **Authentication** → **Emails** → **SMTP Settings** (for example a Gmail/Google Workspace, Brevo or Resend account). Until then, use **Way A** (no email) to add staff.

## 9. Problems?

| Problem | What to do |
|---|---|
| "You need internet to sign in the first time." | Connect to Wi-Fi or mobile data, then sign in. |
| The app looks old after an update. | Close the app and open it again. |
| **Sync problem** badge does not go away. | Tap it. Check internet. If it stays, tell the admin (they can see the error in **Settings**). |
| Someone left the company. | Admin → **Staff accounts** → set them to **pending**. |
| I deleted something by mistake. | Ask the admin. They can import your latest backup with **Add to current data**. |
| An email link opens `localhost:3000`. | The app's address is not set in Supabase. Do setup step 4, then send a new link. |
| "This email link has expired or was already used." | Links work once and expire. Send a new invite, or press **Forgot password?**. Some email apps open links by themselves, so open the newest email quickly. |
| The invite or reset email never arrives. | Check spam. Supabase's test email sender is very limited; see "About emails" above, or add the person with **Way A**. |

## For developers

- The app is in `app/` (React + Vite + Dexie). `npm install`, `npm run dev`, `npm test`.
- The cloud database schema and its access rules are in `supabase/migrations/`.
- Sync design: every record has a UUID, local changes are queued and uploaded, and downloads follow the database's `updated_at` order. Deletes are soft (`deleted = true`). The last change to reach the cloud wins.
- Copy `app/.env.example` to `app/.env.local` to test against a Supabase project. Never commit `.env` files or customer data.

---

<a id="myanmar"></a>

# Travel Ops app (မြန်မာဘာသာ)

[English](#english) · **မြန်မာဘာသာ**

> ဤမြန်မာဘာသာပြန်ကို ဝန်ထမ်းများ အသုံးမပြုမီ မြန်မာစကား ကျွမ်းကျင်သူ တစ်ဦးက ပြန်စစ်ပေးပါ။

ကုမ္ပဏီ၏ အလုပ်များအတွက် app တစ်ခုတည်း ဖြစ်ပါသည် — ဖောက်သည်များ၊ booking များ၊ ခရီးစဉ်များ၊ ဗီဇာ၊ ပတ်စ်ပို့နှင့် လေယာဉ်လက်မှတ်များ။
ဖုန်းနှင့် ကွန်ပျူတာ နှစ်မျိုးလုံးတွင် သုံးနိုင်ပြီး အင်တာနက် မရှိလည်း ဆက်သုံးနိုင်ပါသည်။

---

## ၁။ App ကို ဖွင့်ခြင်း

1. App link ကို **Chrome** (Android သို့မဟုတ် ကွန်ပျူတာ) သို့မဟုတ် **Safari** (iPhone) ဖြင့် ဖွင့်ပါ။
2. သာမန် app ကဲ့သို့ install လုပ်ပါ —
   - **Android / ကွန်ပျူတာ:** Chrome menu **⋮** → **Install app** (သို့မဟုတ် **Add to Home screen**)။
   - **iPhone:** **Share** ခလုတ် → **Add to Home Screen**။
3. နောက်ပိုင်းတွင် home screen မှ ဖွင့်ပါ။

## ၂။ Sign in ဝင်ခြင်း

1. Admin က သင့်ထံ email ဖိတ်စာ ပို့ပါမည်။ ဖွင့်ပြီး password တစ်ခု ရွေးပါ။
2. App တွင် **email** နှင့် **password** ရိုက်ပြီး **Sign in** ကို နှိပ်ပါ။
3. ပထမဆုံးအကြိမ် sign in ဝင်ရန် အင်တာနက် လိုပါသည်။ ထို့နောက် အင်တာနက် မရှိလည်း app ပွင့်ပါသည်။
4. **"Waiting for approval"** ဟု မြင်ရလျှင် admin က သင့်ကို ခွင့်မပြုရသေးပါ။ Admin ကို ပြောပြီး **Check again** ကို နှိပ်ပါ။

## ၃။ စာမျက်နှာများ

| စာမျက်နှာ | အသုံးဝင်ပုံ |
|---|---|
| **Overview** | ဝင်ငွေ၊ အမြတ်၊ အရောင်း၊ သတိပေးချက်များကို တစ်ချက်တည်း ကြည့်ရန်။ |
| **Revenue** | ဝန်ဆောင်မှု၊ နိုင်ငံ၊ ခရီးရက်၊ သွားမည့်နေရာ သို့မဟုတ် မြို့အလိုက် ဝင်ငွေ။ နှစ်ခုကို နှိုင်းယှဉ်နိုင်သည်။ |
| **Packages** | ခရီးစဉ် package များ၏ ဈေး၊ ကုန်ကျစရိတ်နှင့် အမြတ်။ ဈေးကို ဤနေရာတွင် ပြင်နိုင်သည်။ |
| **Visa** / **Passport** | Case တစ်ခုချင်းစီကို အဆင့်လိုက် ရွှေ့ရန်။ နောက်ဆုံးရက်များကို ကြည့်ရန်။ |
| **Tickets** | လေယာဉ်လက်မှတ်များနှင့် commission။ |
| **Trips** | ခရီးစဉ်များနှင့် နောက်ဆုံးရက်များ၏ ပြက္ခဒိန်။ Google Calendar သို့ ထည့်နိုင်သည်။ |
| **Heatmaps** | ဖောက်သည်များ ခရီးသွားသည့်နေရာနှင့် လာရာမြို့များကို မြေပုံဖြင့် ပြသည်။ |
| **Bookings** | Booking ထည့်ရန်၊ အတည်ပြုရန်၊ ပြီးဆုံးရန် သို့မဟုတ် ပယ်ဖျက်ရန်။ |
| **Customers** | ဖောက်သည်စာရင်း။ မကြာမီ သက်တမ်းကုန်မည့် ပတ်စ်ပို့များကို အရောင်ဖြင့် ပြသည်။ |
| **Settings** | သင့် account၊ sync၊ ငွေကြေး၊ install၊ backup။ |
| **Admin** | Admin များအတွက်သာ — data သွင်းရန်၊ ဝန်ထမ်း account များ။ |

ငွေပမာဏ အားလုံးကို **ကျပ် (Ks)** ဖြင့် သိမ်းပါသည်။ အပေါ်ရှိ ငွေကြေး menu ဖြင့် US ဒေါ်လာ ပြောင်းကြည့်နိုင်ပါသည်။

## ၄။ အင်တာနက်မဲ့ အလုပ်လုပ်ခြင်းနှင့် Sync

- သင် ပြင်ဆင်သမျှကို **ဖုန်းထဲတွင် အရင်သိမ်း**ပြီး **ကုမ္ပဏီ cloud သို့ အလိုအလျောက် ပို့**ပါသည်။
- အခြားဝန်ထမ်းများ ပြင်ဆင်ချက်များလည်း **သင့်ဖုန်းသို့ အလိုအလျောက် ရောက်လာ**ပါသည်။
- ညာဘက်အပေါ်ရှိ badge က ဖြစ်နေသည်ကို ပြပါသည် —

| Badge | အဓိပ္ပာယ် |
|---|---|
| **Synced** | အားလုံး နောက်ဆုံးအခြေအနေ ဖြစ်နေသည်။ |
| **Syncing…** | ယခု ပို့နေ၊ လက်ခံနေသည်။ |
| **Offline · 3 waiting** | အင်တာနက် မရှိပါ။ အင်တာနက် ပြန်ရလျှင် ပြင်ဆင်ချက် ၃ ခု ပို့ပါမည်။ ဆက်လုပ်နိုင်သည်။ |
| **Sync problem · retry** | အမှားတစ်ခု ဖြစ်နေသည်။ Badge ကို နှိပ်ပြီး ထပ်ကြိုးစားပါ။ ဆက်ဖြစ်နေလျှင် admin ကို ပြောပါ။ |

- လူနှစ်ယောက်က **record တစ်ခုတည်း**ကို ပြင်လျှင် cloud သို့ **နောက်ဆုံးရောက်သော** ပြင်ဆင်ချက်ကို သိမ်းပါသည်။
- **ပို့ရန် ကျန်နေသော ပြင်ဆင်ချက်များ ရှိနေစဉ် sign out မလုပ်ပါနှင့်။** Sign out လုပ်လျှင် ဤဖုန်းမှ ကုမ္ပဏီ data များကို ဖယ်ရှားပါသည် (cloud ထဲတွင် ဘေးကင်းစွာ ကျန်ပါသည်)။ App က အရင် သတိပေးပါမည်။

## ၅။ Admin များအတွက်

### ဝန်ထမ်းအသစ်ကို ဝင်ခွင့်ပေးခြင်း
**နည်းလမ်း A — email မလိုပါ (အလွယ်ဆုံး):**
1. **supabase.com** → ကုမ္ပဏီ project → **Authentication** → **Users** → **Add user** → **Create new user**။
2. ၎င်း၏ email နှင့် **ယာယီ password** တစ်ခု ရိုက်ပါ။ **Auto Confirm User** ကို အမှန်ခြစ်ပါ။ **Create user** ကို နှိပ်ပါ။
3. ယာယီ password ကို ၎င်းကို လူကိုယ်တိုင် ပေးပါ။ ၎င်းက sign in ဝင်ပြီး **Settings** → **Change password** ဖြင့် ပြောင်းပါ။

**နည်းလမ်း B — email ဖြင့် ဖိတ်ခြင်း:**
1. **Authentication** → **Users** → **Add user** → **Send invitation**။ ၎င်း၏ email ကို ရိုက်ပါ။
2. ၎င်းက **အသုံးပြုမည့် ဖုန်း သို့မဟုတ် ကွန်ပျူတာ** တွင် email ကို ဖွင့်ပြီး link ကို နှိပ်ပါ။ App တွင် **Choose your password** ပေါ်လာပါမည်။
3. Link သည် **တစ်ကြိမ်သာ** အလုပ်လုပ်ပြီး သက်တမ်းကုန်ပါသည်။ မအောင်မြင်လျှင် invite အသစ် ပို့ပါ (သို့မဟုတ် **Forgot password?** ကို သုံးပါ)။

**ထို့နောက် နည်းလမ်း နှစ်ခုလုံးအတွက်:** ၎င်းက **"Waiting for approval"** ကို မြင်ရပါမည်။ App တွင် **Admin** → **Staff accounts** → role ကို **pending** မှ **staff** (သို့မဟုတ် **admin**) သို့ ပြောင်းပါ။

| Role | လုပ်နိုင်သည် |
|---|---|
| **pending** | ဘာမျှ မလုပ်နိုင်ပါ။ ခွင့်ပြုချက် စောင့်နေသည်။ |
| **staff** | လုပ်ငန်း data အားလုံးကို ကြည့်ပြီး ပြင်နိုင်သည်။ |
| **admin** | Staff လုပ်နိုင်သမျှ အပြင် data သွင်းခြင်းနှင့် role ပြောင်းခြင်း။ |

တစ်စုံတစ်ယောက်ကို app မသုံးစေလိုလျှင် ၎င်း၏ role ကို **pending** သို့ ပြန်ပြောင်းပါ။ ကုမ္ပဏီတွင် admin အနည်းဆုံး တစ်ဦး အမြဲရှိရပါမည်။

### Backup ဖိုင်မှ data သွင်းခြင်း
1. **Admin** → **Import a backup (JSON)** → **Choose file…**
2. App က ဖိုင်ကို အရင် စစ်ဆေးပါသည်။ ဘာမျှ မပြောင်းသေးပါ။
   - **အနီရောင်ကွက်:** ဖိုင်တွင် ပြဿနာ ရှိသည်။ ပြင်ပြီး ထပ်ကြိုးစားပါ။
   - **အဝါရောင်ကွက်:** ဤအချက်များကို စစ်ပါ၊ သို့သော် သွင်းနိုင်ပါသည်။
3. သွင်းပုံကို ရွေးပါ —
   - **Add to current data** — ရှိပြီးသား data အားလုံး ထားပြီး ဖိုင်ထဲမှ record များကို ထပ်ထည့်သည်။
   - **Replace all data** — **လူတိုင်းအတွက်** လက်ရှိ data အားလုံးကို ဖယ်ပြီး ဖိုင်ကို သွင်းသည်။ အတည်ပြုရန် **REPLACE** ဟု ရိုက်ပါ။
4. **Import** ကို နှိပ်ပါ။ Data များ cloud နှင့် ဖုန်းတိုင်းသို့ ရောက်ပါမည်။
5. **Import history** တွင် မည်သူက မည်သည့်အချိန်တွင် ဘာသွင်းခဲ့သည်ကို ပြပါသည်။

App ဗားရှင်းဟောင်းမှ backup များလည်း သုံးနိုင်ပါသည်။ ဖုန်းတစ်လုံးတွင် ဗားရှင်းဟောင်း data ကျန်နေလျှင် **"Import data from the old app version on this device"** ခလုတ် ပေါ်လာပါမည်။

## ၆။ Backup များ

- **Settings** → **Backup (JSON)** ဖြင့် data အားလုံးကို ဖိုင်အဖြစ် သိမ်းနိုင်ပါသည်။ **အပတ်တိုင်း** လုပ်ပါ။
- ဖိုင်ထဲတွင် ဖောက်သည် အချက်အလက်များ ပါပါသည်။ လျှို့ဝှက်စွာ ထားပါ။ ကုမ္ပဏီပြင်ပ လူများထံ မတင်ပါနှင့်၊ email မပို့ပါနှင့်။

## ၇။ ကိုယ်ရေးအချက်အလက်နှင့် လုံခြုံရေး စည်းကမ်းများ

- သင့် password ကို ဘယ်သူ့ကိုမှ မပေးပါနှင့်။ လူတိုင်း ကိုယ်ပိုင် account ရှိရပါမည်။
- မျှဝေသုံးသော သို့မဟုတ် ငှားထားသော ဖုန်းများတွင် sign out လုပ်ပါ။
- ဖောက်သည် data ကို GitHub သို့မဟုတ် အများသုံး website တွင် ဘယ်တော့မှ မတင်ရပါ။
- Database ၏ **service_role** key ကို app ထဲ သို့မဟုတ် Vercel ထဲ ဘယ်တော့မှ မထည့်ရပါ။ **anon** key ကိုသာ ထည့်ပါ။

## ၈။ တစ်ကြိမ်တည်း setup (IT တာဝန်ခံအတွက်)

1. **Database ဖန်တီးရန်:** **supabase.com** → **New project**။ Region: **Southeast Asia (Singapore)**။ Database password ကို လုံခြုံသောနေရာတွင် သိမ်းပါ။
2. **Table များ ဖန်တီးရန်:** Supabase → **SQL Editor** → `supabase/migrations/0001_init.sql` တစ်ဖိုင်လုံးကို paste လုပ်ပြီး → **Run**။
3. **အများသုံး sign-up ပိတ်ရန်:** Supabase → **Authentication** → **Sign In / Providers** → "Allow new users to sign up" ကို **ပိတ်**ပါ။ (Invite များ ဆက်အလုပ်လုပ်ပါသည်။)
4. **App ၏ လိပ်စာ သတ်မှတ်ရန်** (email link များ `localhost:3000` မဟုတ်ဘဲ app ကို ဖွင့်စေရန်): Supabase → **Authentication** → **URL Configuration**။
   - **Site URL:** သင့် Vercel လိပ်စာ၊ ဥပမာ `https://your-app.vercel.app`
   - **Redirect URLs** → **Add URL:** `https://your-app.vercel.app/**`
5. **ပထမ admin ဖန်တီးရန်:**
   1. **Authentication** → **Users** → **Add user** → **Create new user** ဖြင့် ပိုင်ရှင်၏ email နှင့် password ကို ထည့်ပါ။ **Auto Confirm User** ကို အမှန်ခြစ်ပါ။
   2. **SQL Editor** တွင် run ပါ: `update public.profiles set role = 'admin' where email = 'owner@example.com';` (email အစစ်ကို သုံးပါ)။
6. **App ကို ချိတ်ရန်:** Supabase → **Project Settings** → **API**။ **Project URL** နှင့် **anon public** key ကို copy ယူပါ။
   **Vercel** → ကုမ္ပဏီ project → **Settings** → **Environment Variables** တွင် ထည့်ပါ —
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
7. **ပြန် deploy လုပ်ရန်:** Vercel → **Deployments** → **Redeploy**။ ယခု app တွင် sign-in စာမျက်နှာ ပေါ်လာပါမည်။
8. **ပထမ data သွင်းရန်** (မဖြစ်မနေ မဟုတ်): admin အဖြစ် sign in ဝင် → **Admin** → backup ဖိုင် သွင်းပါ။

အဆင့် ၆ မလုပ်ရသေးလျှင် app သည် **local-only mode** ဖြင့် အလုပ်လုပ်ပါသည် — sign in မလို၊ sync မရှိ၊ data သည် စက်တစ်လုံးချင်းစီတွင်သာ ရှိပါသည်။

**Email များအကြောင်း (invite နှင့် "Forgot password?"):** Supabase ၏ မူလ email ပို့စနစ်သည် စမ်းသပ်ရန်သာ ဖြစ်ပါသည်။ တစ်နာရီလျှင် email အနည်းငယ်သာ ပို့နိုင်ပြီး သင့် Supabase team အဖွဲ့ဝင်များထံသာ ပို့နိုင်နိုင်ပါသည်။ ဝန်ထမ်းများအတွက် ကိုယ်ပိုင် email ပို့စနစ် ထည့်ပါ: Supabase → **Authentication** → **Emails** → **SMTP Settings** (ဥပမာ Gmail/Google Workspace၊ Brevo သို့မဟုတ် Resend account)။ ထိုအချိန်အထိ ဝန်ထမ်းများကို **နည်းလမ်း A** (email မလို) ဖြင့် ထည့်ပါ။

## ၉။ ပြဿနာ ရှိပါသလား

| ပြဿနာ | လုပ်ရမည့်အရာ |
|---|---|
| "You need internet to sign in the first time." | Wi-Fi သို့မဟုတ် mobile data ချိတ်ပြီး sign in ဝင်ပါ။ |
| Update ပြီးနောက် app ဟောင်းပုံ ပေါ်နေသည်။ | App ကို ပိတ်ပြီး ပြန်ဖွင့်ပါ။ |
| **Sync problem** badge မပျောက်ပါ။ | ၎င်းကို နှိပ်ပါ။ အင်တာနက် စစ်ပါ။ ဆက်ဖြစ်နေလျှင် admin ကို ပြောပါ (admin က **Settings** တွင် အမှားကို မြင်နိုင်သည်)။ |
| တစ်စုံတစ်ယောက် ကုမ္ပဏီမှ ထွက်သွားသည်။ | Admin → **Staff accounts** → ၎င်းကို **pending** သို့ ပြောင်းပါ။ |
| မှားပြီး တစ်ခုခု ဖျက်မိသည်။ | Admin ကို ပြောပါ။ နောက်ဆုံး backup ကို **Add to current data** ဖြင့် ပြန်သွင်းနိုင်ပါသည်။ |
| Email link က `localhost:3000` ကို ဖွင့်သည်။ | Supabase တွင် app ၏ လိပ်စာ မသတ်မှတ်ရသေးပါ။ Setup အဆင့် ၄ ကို လုပ်ပြီး link အသစ် ပို့ပါ။ |
| "This email link has expired or was already used." | Link များ တစ်ကြိမ်သာ အလုပ်လုပ်ပြီး သက်တမ်းကုန်ပါသည်။ Invite အသစ် ပို့ပါ သို့မဟုတ် **Forgot password?** ကို နှိပ်ပါ။ Email app အချို့က link များကို အလိုအလျောက် ဖွင့်တတ်သဖြင့် နောက်ဆုံး email ကို မြန်မြန် ဖွင့်ပါ။ |
| Invite သို့မဟုတ် reset email မရောက်ပါ။ | Spam ကို စစ်ပါ။ Supabase ၏ စမ်းသပ် email စနစ်သည် အလွန် ကန့်သတ်ထားပါသည်။ အထက်ပါ "Email များအကြောင်း" ကို ကြည့်ပါ သို့မဟုတ် **နည်းလမ်း A** ဖြင့် ထည့်ပါ။ |
