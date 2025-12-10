'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, User } from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                // If setup is required, redirect to setup page
                if (data.setupRequired) {
                    router.push('/setup');
                    return;
                }
                setError(data.error || 'Login failed');
                setLoading(false);
                return;
            }

            // Store token in localStorage (simple approach)
            localStorage.setItem('admin_token', data.token);
            router.push('/admin/dashboard');
        } catch (err) {
            setError('Network error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neo-grid flex items-center justify-center p-4 text-black">
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-black">
                        Admin Access
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Log in to manage your vehicle fleet
                    </p>
                </div>

                {/* Card */}
                <div className="neo-card bg-white p-8 text-black">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-600 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold uppercase mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold uppercase mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "w-full py-4 text-black font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center",
                                loading ? "bg-gray-100 cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-500"
                            )}
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
