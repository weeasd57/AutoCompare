'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Database, User, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface SetupStatus {
    tablesExist: boolean;
    hasAdmins: boolean;
    setupCompleted: boolean;
    needsSetup: boolean;
}

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [status, setStatus] = useState<SetupStatus | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        checkSetupStatus();
    }, []);

    const checkSetupStatus = async () => {
        try {
            const res = await fetch('/api/setup');
            const data = await res.json();
            setStatus(data);

            if (data.setupCompleted && data.hasAdmins) {
                // Already set up, redirect to login
                router.push('/admin/login');
                return;
            }

            if (data.tablesExist) {
                setStep(2); // Skip to admin creation
            }
        } catch (err) {
            setError('Failed to check setup status');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Setup failed');
                setSubmitting(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/login');
            }, 2000);

        } catch (err) {
            setError('Network error. Please try again.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-black">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-500" />
                    <p className="font-bold">Checking setup status...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-black">
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 border-4 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-black mb-2">Setup Complete!</h1>
                    <p className="text-gray-500 mb-4">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-black">
            <div className="max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-yellow-400 border-4 border-black flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Database className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                        AutoCompare Setup
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Welcome! Let's set up your admin account.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-black' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold ${step >= 1 ? 'bg-yellow-400' : 'bg-gray-100'}`}>
                            1
                        </div>
                        <span className="font-bold text-sm hidden sm:inline">Database</span>
                    </div>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-black' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold ${step >= 2 ? 'bg-yellow-400' : 'bg-gray-100'}`}>
                            2
                        </div>
                        <span className="font-bold text-sm hidden sm:inline">Admin Account</span>
                    </div>
                </div>

                {/* Card */}
                <div className="neo-card bg-white p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-900 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-black mb-4">Database Connection</h2>
                            
                            {status?.tablesExist ? (
                                <div className="p-4 bg-green-50 border-2 border-green-500 mb-6">
                                    <div className="flex items-center gap-2 text-green-700 font-bold">
                                        <CheckCircle className="w-5 h-5" />
                                        Database connected successfully!
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-50 border-2 border-yellow-500 mb-6">
                                    <p className="text-yellow-800 font-medium text-sm">
                                        Please import the <code className="bg-yellow-100 px-1">database.sql</code> file into your MySQL database, then refresh this page.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3 text-sm">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={status?.tablesExist || false}
                                        onChange={() => {}}
                                        disabled
                                        className="w-5 h-5 accent-green-500"
                                    />
                                    <span>Database tables created</span>
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            const res = await fetch('/api/setup/init-db', { method: 'POST' });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                setError(data.error || 'Failed to create tables');
                                            } else {
                                                await checkSetupStatus();
                                            }
                                        } catch (err) {
                                            setError('Failed to initialize database');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={status?.tablesExist}
                                    className="flex-1 px-6 py-3 bg-blue-500 text-white font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Tables
                                </button>
                                <button
                                    onClick={() => status?.tablesExist ? setStep(2) : checkSetupStatus()}
                                    className="flex-1 px-6 py-3 bg-yellow-400 text-black font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                                >
                                    {status?.tablesExist ? (
                                        <>Continue <ArrowRight className="w-5 h-5" /></>
                                    ) : (
                                        'Refresh Status'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-xl font-black mb-4">Create Admin Account</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                This will be your main administrator account.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">Name</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        placeholder="admin@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">Password *</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            minLength={6}
                                            className="w-full pl-12 pr-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            placeholder="Min 6 characters"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">Confirm Password *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-6 w-full px-6 py-3 bg-green-500 text-white font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                                ) : (
                                    <>Create Admin Account <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-6">
                    AutoCompare v1.0.0
                </p>
            </div>
        </div>
    );
}
