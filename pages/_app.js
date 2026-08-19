import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* Basic SEO */}
        <title>Ikigai Journey — Discover Your Purpose | Purposely Learning Hub</title>
        <meta name="description" content="A guided 16-question journey that uncovers what you love, what you're good at, what the world needs, and what you can be paid for. Get your 20-section personal purpose report." />
        <meta name="author" content="Purposely Learning Hub" />
        <meta name="application-name" content="Ikigai Journey" />

        {/* Open Graph — controls how link looks on Facebook, Messenger, Viber, etc. */}
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content="https://app.purposelylearning.com" />
        <meta property="og:title"       content="Ikigai Journey — Discover Your Purpose" />
        <meta property="og:description" content="A guided 16-question journey that uncovers your purpose. Get your personal 20-section report for only ₱499." />
        <meta property="og:image"       content="https://app.purposelylearning.com/og-image.jpg" />
        <meta property="og:image:width"  content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name"   content="Ikigai Journey by Purposely Learning Hub" />
        <meta property="og:locale"      content="en_PH" />

        {/* Twitter / X card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="Ikigai Journey — Discover Your Purpose" />
        <meta name="twitter:description" content="A guided 16-question journey that uncovers your purpose. Get your personal 20-section report for only ₱499." />
        <meta name="twitter:image"       content="https://app.purposelylearning.com/og-image.jpg" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}