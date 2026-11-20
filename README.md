# Mirror Magic Beauty Parlour

A Next.js salon website with the two original salon photos, a 3D gallery, a customer-facing menu without displayed prices, appointment booking and a private staff desk. The app uses local SQLite for development and a hosted Turso database on Vercel. A fresh database starts with the sample service menu and stylists. Bookings on the existing ChatGPT site belong to its separate database.

## Run on your computer

1. Install Node.js 24.x with npm. Check with `node -v`.
2. Extract the ZIP. In VS Code, open the folder containing `package.json` and open Terminal.
3. Run these commands one at a time.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The first start creates `studio.db` beside `package.json`. Bookings persist when the server restarts. Stop it with Ctrl+C. To test the production build locally, run `npm run build` and then `npm start`.

## Deploy to Vercel

1. Create a database in [Turso](https://app.turso.tech/). Open its dashboard and copy the database URL beginning with `libsql://`. Generate a database token with read and write access. Keep the token private.
2. Create a GitHub repository and upload the extracted project files. Keep the folder structure, including `public/images`, `scripts`, `db`, and `drizzle`. The repository root should contain `package.json`. If using Git, the included .gitignore excludes local credentials, installed packages and booking data.
3. In [Vercel](https://vercel.com/new), import the repository. Choose **Next.js**, Node.js **24.x**, and the root directory containing `package.json`. Use the framework defaults for install, build and output. The build initializes the database tables.
4. Before clicking **Deploy**, add these values under **Environment Variables**.

| Name | Value | Used for |
| --- | --- | --- |
| TURSO_DATABASE_URL | Your libsql:// database URL | Persistent bookings |
| TURSO_AUTH_TOKEN | Your private read/write database token | Database access |
| STUDIO_STAFF_KEY | A random private key of at least 32 characters | Optional staff sign-in |

5. Select **Production** for the production values. If using Vercel Preview deployments, configure the same variable names for **Preview** with a separate test database and token. Click **Deploy**. After changing an environment variable, redeploy to apply it.
6. Open your Vercel URL. Check the photos and service menu, then make a test booking. Open **My bookings**, reload, and check that you can find and cancel the test appointment. The API health endpoint is `/api/health`.

## Staff access

Generate a random staff key in your terminal.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set that value as STUDIO_STAFF_KEY in Vercel. For local staff access, copy .env.example to .env.local, set STUDIO_STAFF_KEY, and restart the local server. On /staff enter the key to manage appointments and services. Staff sessions expire after eight hours. Rotating the key and redeploying invalidates earlier sessions. Customers use the guest booking flow. For lookup on another device, use the booking reference and the original email.

## Common setup issues

- If the build asks for Turso variables, check the spelling, the selected Vercel environment, and that you supplied a database token with write access. Redeploy after saving.
- If Vercel cannot find Next.js, choose the directory that contains package.json as the root.
- To use the hosted database on your computer, put its URL and token in .env.local and restart. Use a dedicated development database for test appointments.

## Project files

- app and components/studio contain the pages, gallery, booking forms and staff dashboard.
- lib/server contains booking logic and staff sessions. db contains the database adapter.
- drizzle and scripts contain the SQL schema, database setup and source download generator.
- public contains the two uploaded photos, other site imagery, fonts and installable app assets.

Further reading: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) and [Turso TypeScript client](https://docs.turso.tech/sdk/ts/reference).
