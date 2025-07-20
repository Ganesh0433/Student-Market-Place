import { useRouter } from 'next/router';
import Head from 'next/head';

export default function EmailVerification() {
  const router = useRouter();
  const { email } = router.query;

  return (
    <>
      <Head>
        <title>Email Verification • Exchangezo</title>
        <meta name="description" content="Verify your email to join Exchangezo and start trading with fellow students" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-4xl font-extrabold font-space-grotesk text-gray-900 mb-4 tracking-wide">
            Exchangezo
          </h1>
          <h2 className="text-2xl font-bold font-space-grotesk text-gray-900 mb-6">
            Verify Your Email
          </h2>
          <p className="text-lg font-inter font-medium text-gray-700 mb-4">
            Check your Gmail (or email provider) for a verification link to activate your account.
          </p>
          <p className="text-base font-inter font-medium text-gray-600 mb-6">
            Sent to: <span className="font-semibold text-green-500">{email || 'your email'}</span>
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-block px-6 py-3 bg-green-500 text-white font-inter font-semibold text-base rounded-lg hover:bg-green-600 transition-all duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>

      <style jsx>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>
    </>
  );
}