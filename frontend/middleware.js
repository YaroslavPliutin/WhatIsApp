export const config = {
  matcher: '/'
};

export default function middleware(req) {
  const ua = req.headers.get('user-agent') || '';

  const isCrawler = /TelegramBot|Twitterbot|facebookexternalhit|LinkedInBot/i.test(ua);

  if (isCrawler) {
    return new Response(`<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="WhatIsItApp" />
  <meta property="og:description" content="Upload and explore wrong images easily" />
  <meta property="og:image" content="https://app.whatisitapp.site/whatisapppreview_png.png" />
  <meta property="og:url" content="https://app.whatisitapp.site/" />
  <meta property="og:type" content="website" />
</head>
<body></body>
</html>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return fetch(req);
}