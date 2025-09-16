import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* MetaShield 브랜딩 */}
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="description" content="MetaShield - SOC 보안관제센터 실시간 모니터링 대시보드" />
        <meta name="keywords" content="SOC, 보안관제, MetaShield, 보안이벤트, 실시간모니터링" />
        <meta name="author" content="MetaShield" />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="MetaShield - SOC 대시보드" />
        <meta property="og:description" content="실시간 보안 이벤트 모니터링 및 관제 시스템" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MetaShield - SOC 대시보드" />
        <meta name="twitter:description" content="실시간 보안 이벤트 모니터링 및 관제 시스템" />
        <meta name="twitter:image" content="/logo.png" />

        {/* 추가 파비콘 */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}