import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [signupError, setSignupError] = useState('');
  const passwordRef = useRef();
  const router = useRouter();

  // Particle setup (no animations)
  useEffect(() => {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 600; // Fixed width
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 8 + 3;
        this.speedX = Math.random() * 2.5 - 1.25;
        this.speedY = Math.random() * 2.5 - 1.25;
        this.color = ['#22c55e', '#db2777', '#ffffff', '#6b21a8'][Math.floor(Math.random() * 4)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.5) this.size -= 0.05;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
        if (particle.size <= 0.5) {
          particles.splice(particles.indexOf(particle), 1);
          particles.push(new Particle());
        }
      });
      requestAnimationFrame(drawParticles);
    }

    drawParticles();

    const handleResize = () => {
      canvas.width = 600; // Fixed width
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    setSignupError('');
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email || !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }
    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.user?.identities?.length === 0) {
        setSignupError('A user with this email already exists');
        return;
      }

      router.push({
        pathname: '/email-verification',
        query: { email },
      });
    } catch (error) {
      console.error('Signup error:', error);
      setSignupError(error.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up • Exchangezo</title>
        <meta name="description" content="Join Exchangezo to buy and sell used items with fellow students" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen flex bg-gray-50">
        {/* Left Side - Gradient with Particles */}
        <div className="hidden lg:flex w-[600px] relative overflow-hidden bg-gradient-to-br from-purple-800 to-pink-600">
          <canvas id="particles" className="absolute inset-0" />
          <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
            <h1 className="text-6xl font-extrabold font-space-grotesk tracking-wide mb-8 text-shadow-lg">Exchangezo</h1>
            <h2 className="text-4xl font-bold font-space-grotesk mb-6 tracking-tight">Buy & Sell with Students</h2>
            <p className="text-gray-100 mb-8 max-w-md text-center font-inter text-lg font-medium">
              Trade textbooks, gadgets, and more with your university community.
            </p>
            <div className="space-y-6">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-400 mr-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-inter font-semibold text-lg">Trusted Student Network</span>
              </div>
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-400 mr-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-inter font-semibold text-lg">Affordable Deals</span>
              </div>
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-400 mr-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-inter font-semibold text-lg">Campus Convenience</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg border border-gray-300/50 rounded-3xl p-10 shadow-xl">
            <div className="lg:hidden flex justify-center mb-8">
              <h1 className="text-5xl font-extrabold font-space-grotesk text-gray-900 tracking-wide text-shadow-sm">Exchangezo</h1>
            </div>

            <h2 className="text-center text-3xl font-extrabold font-space-grotesk text-gray-900 mb-4 tracking-wide">
              Join the Campus Marketplace
            </h2>
            <p className="text-center text-lg font-inter font-medium text-gray-600 mb-8">
              Sign up to buy and sell with students
            </p>

            {signupError && (
              <div className="mb-6 p-4 bg-red-100/50 text-red-600 rounded-xl text-sm flex items-start font-inter">
                <svg className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{signupError}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <input
                  id="email"
                  type="email"
                  className={`w-full px-5 py-3.5 rounded-xl border ${emailError ? 'border-red-500' : 'border-gray-400'} bg-white/20 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 focus:outline-none text-base font-inter font-medium transition-all duration-300 ${focusedInput === 'email' ? 'ring-2 ring-green-500/30' : ''}`}
                  placeholder="Your university email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setSignupError('');
                  }}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyDown={(e) => e.key === 'Enter' && passwordRef.current.focus()}
                  disabled={loading}
                />
                {emailError && <p className="mt-2 text-sm text-red-600 font-inter">{emailError}</p>}
              </div>

              <div>
                <input
                  id="password"
                  ref={passwordRef}
                  type="password"
                  className={`w-full px-5 py-3.5 rounded-xl border ${passwordError ? 'border-red-500' : 'border-gray-400'} bg-white/20 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 focus:outline-none text-base font-inter font-medium transition-all duration-300 ${focusedInput === 'password' ? 'ring-2 ring-green-500/30' : ''}`}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setSignupError('');
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  disabled={loading}
                />
                {passwordError && <p className="mt-2 text-sm text-red-600 font-inter">{passwordError}</p>}
                <p className="mt-2 text-xs text-gray-500 font-inter">
                  Use 8+ characters with letters, numbers & symbols
                </p>
              </div>

              <button
                onClick={handleSignUp}
                disabled={loading}
                className={`w-full py-3.5 px-6 rounded-xl bg-green-500 text-white font-inter font-semibold text-base hover:bg-green-600 transition-all duration-300 relative ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    Joining Exchangezo...
                  </span>
                ) : (
                  <span className="relative z-10">Join Now</span>
                )}
              </button>
            </div>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-400"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white/10 text-gray-500 font-inter font-medium">OR</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center py-3.5 px-6 rounded-xl border border-gray-400 text-base font-inter font-semibold text-gray-900 hover:bg-gray-100 transition-all duration-300"
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                  </svg>
                  Sign up with GitHub
                </button>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600 font-inter font-medium">
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-green-500 font-semibold hover:text-green-400 transition-all duration-300"
                >
                  Log in
                </button>
              </p>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500 font-inter">
              <p>
                By signing up, you agree to our{' '}
                <a href="#" className="text-green-500 hover:text-green-400 transition-all duration-300 font-inter">Terms</a> and{' '}
                <a href="#" className="text-green-500 hover:text-green-400 transition-all duration-300 font-inter">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }

        .text-shadow-sm {
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .text-shadow-lg {
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </>
  );
}