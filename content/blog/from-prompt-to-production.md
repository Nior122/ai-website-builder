---
title: From prompt to production — deploying your site
date: 2026-07-02
excerpt: The path from a generated site to a live, custom-domain URL, and the choices you make along the way.
author: AI Website Builder Studio
tags:
  - deploy
  - production
---

Generating a site is the easy part. Shipping it is where a lot of builders slow
down. This post walks the deployment path and the decisions that come with it.

## Step 1 — Refine in the editor

Before deploying, sweep the generated content for anything obviously
placeholder: hero copy, contact details, gallery images, and the brand name in
the footer. Spending ten minutes here saves a first impression with lorem
ipsum.

## Step 2 — Add your domain

On Pro and Enterprise plans you can attach a custom domain. DNS changes take
time to propagate, so start this step early — point your domain's apex or
`www` at the platform while you finish content edits.

## Step 3 — Configure metadata

Good metadata is cheap and high-leverage. Set a concise, keyword-aware title
and a description under 160 characters per page. The studio's SEO audit flags
missing or overlong metadata automatically.

## Step 4 — Choose a deploy target

The studio publishes to Vercel, Netlify, or Cloudflare, or exports the raw
code for self-hosting. For most users a managed target is the right call: TLS,
CDN, and preview deployments come included.

## Step 5 — Verify, then promote

Always check the preview deployment before promoting to production. Confirm
forms submit where they should, images load, links are correct, and the site
is responsive at mobile width. Then promote.

## After launch

A site is not finished when it ships. Watch for drift: out-of-date business
hours, stale pricing, broken external links. The studio keeps your source
editable, so edits are a two-minute fix rather than a redeployment project.
