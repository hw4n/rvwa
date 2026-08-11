This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production environment

The runtime `.env` used by `next start` must define:

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://example.convex.cloud
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_BASE_URL=https://cdn.example.com
```

For release-directory deployments, set `SHARED_ENV_FILE` to the absolute path of
this file so every release receives a `.env` symlink before PM2 starts Next.js.
The R2 bucket must also allow browser `PUT` requests from the production site
origin and the `Content-Type` request header.

The `next-build` workflow artifact contains `next-build.tar.gz`. Extract it into
the new release directory instead of moving the archive as a regular file:

```bash
ARTIFACT_ARCHIVE="${TMP_DIR}/next-build.tar.gz"
[[ -f "${ARTIFACT_ARCHIVE}" ]] || {
  echo "Missing build archive: ${ARTIFACT_ARCHIVE}" >&2
  exit 1
}
tar -xzf "${ARTIFACT_ARCHIVE}" -C "${NEW_RELEASE}"
```

The tar layer is required because the Next.js build contains traced module
symlinks under `.next/node_modules`. GitHub artifact directory uploads do not
reliably preserve those links, which causes hashed external modules such as the
AWS SDK to be missing at runtime.

Example R2 CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://app.example.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"]
  }
]
```

The GitHub Actions production environment should define
`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_R2_IMAGE_BASE_URL`, and
`R2_PUBLIC_BASE_URL` as repository/environment variables because Next.js image
configuration is generated during the build.

When upload preparation fails in production, inspect the server-side cause with:

```bash
pm2 logs rvwa --lines 100
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
