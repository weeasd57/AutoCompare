'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    CheckCircle,
    Database,
    User,
    ArrowRight,
    Loader2,
    Download,
    Terminal,
} from 'lucide-react';

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(0); // 0: Config DB, 1: Create Admin, 2: Download Env
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Database Configuration State
    const [dbConfig, setDbConfig] = useState({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'autocompare',
        port: '3306',
    });

    // Admin Account State
    const [adminData, setAdminData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // Check existing setup on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/setup');
                const data = await res.json();
                if (data.setupCompleted && data.hasAdmins) {
                    router.push('/admin/login');
                }
            } catch {
                // Ignore error, assume fresh start
            }
        };
        checkStatus();
    }, [router]);

    const handleCreateDatabase = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Test connection first
            const testRes = await fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    dbConfig,
                    databaseName: dbConfig.database,
                }),
            });

            const data = await testRes.json();

            if (!testRes.ok) {
                throw new Error(data.error || 'Failed to connect/create database');
            }

            setStep(1); // Move to Admin creation
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (adminData.password !== adminData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...adminData,
                    dbConfig, // Pass config so it can connect to the new DB!
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setStep(2); // Move to Download Env
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadEnv = () => {
        const envContent = `# Database Configuration
DB_HOST=${dbConfig.host}
DB_USER=${dbConfig.user}
DB_PASSWORD=${dbConfig.password}
DB_NAME=${dbConfig.database}
DB_PORT=${dbConfig.port}
DB_SSL=false

# Google Custom Search JSON API (vehicle images)
# 1) GOOGLE_API_KEY: API key from Google Cloud Console (Custom Search API enabled)
# 2) GOOGLE_CSE_ID: Custom Search Engine ID (CX)
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=11dfdf0330183431a`;

        const blob = new Blob([envContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '.env';
        a.click();
    };

    return (
        <div className="min-h-screen bg-neo-grid flex items-center justify-center p-4 text-black font-sans">
            <div className="max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-yellow-400 border-4 border-black flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Database className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
                        Installation
                    </h1>
                </div>

                {/* Steps Bar */}
                <div className="flex items-center justify-center gap-2 mb-8 bg-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-fit mx-auto">
                    {[
                        { label: 'Database', icon: Database },
                        { label: 'Admin', icon: User },
                        { label: 'Finish', icon: CheckCircle },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center">
                            <div
                                className={`flex items-center gap-2 px-3 py-1 rounded-full ${step === i ? 'bg-yellow-400 border-2 border-black font-bold' : 'text-gray-400'}`}
                            >
                                <span className="text-sm">{s.label}</span>
                            </div>
                            {i < 2 && <div className="w-4 h-0.5 bg-gray-300 mx-2" />}
                        </div>
                    ))}
                </div>

                <div className="neo-card bg-white p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-red-900 font-bold">{error}</p>
                        </div>
                    )}

                    {/* Step 0: Database Configuration */}
                    {step === 0 && (
                        <form onSubmit={handleCreateDatabase} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="dbHost"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Host
                                    </label>
                                    <input
                                        id="dbHost"
                                        type="text"
                                        value={dbConfig.host}
                                        onChange={(e) =>
                                            setDbConfig({ ...dbConfig, host: e.target.value })
                                        }
                                        className="w-full p-3 border-2 border-black bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="dbPort"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Port
                                    </label>
                                    <input
                                        id="dbPort"
                                        type="text"
                                        value={dbConfig.port}
                                        onChange={(e) =>
                                            setDbConfig({ ...dbConfig, port: e.target.value })
                                        }
                                        className="w-full p-3 border-2 border-black bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="dbName"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Database Name{' '}
                                    <span className="text-gray-400 text-xs">(Will be created)</span>
                                </label>
                                <input
                                    id="dbName"
                                    type="text"
                                    value={dbConfig.database}
                                    onChange={(e) =>
                                        setDbConfig({ ...dbConfig, database: e.target.value })
                                    }
                                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-yellow-50"
                                    placeholder="autocompare"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="dbUser"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        User
                                    </label>
                                    <input
                                        id="dbUser"
                                        type="text"
                                        value={dbConfig.user}
                                        onChange={(e) =>
                                            setDbConfig({ ...dbConfig, user: e.target.value })
                                        }
                                        className="w-full p-3 border-2 border-black bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="dbPass"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="dbPass"
                                        type="password"
                                        value={dbConfig.password}
                                        onChange={(e) =>
                                            setDbConfig({ ...dbConfig, password: e.target.value })
                                        }
                                        className="w-full p-3 border-2 border-black bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 font-black uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_#fbbf24] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                                Create Database
                            </button>
                        </form>
                    )}

                    {/* Step 1: Admin Creation */}
                    {step === 1 && (
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div className="bg-green-100 p-4 border-2 border-green-600 mb-4 flex items-center gap-2">
                                <CheckCircle className="text-green-600" />
                                <span className="font-bold text-green-800">
                                    Database & Tables Created!
                                </span>
                            </div>

                            <div>
                                <label
                                    htmlFor="adminName"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Admin Name
                                </label>
                                <input
                                    id="adminName"
                                    type="text"
                                    required
                                    value={adminData.name}
                                    onChange={(e) =>
                                        setAdminData({ ...adminData, name: e.target.value })
                                    }
                                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="adminEmail"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Email
                                </label>
                                <input
                                    id="adminEmail"
                                    type="email"
                                    required
                                    value={adminData.email}
                                    onChange={(e) =>
                                        setAdminData({ ...adminData, email: e.target.value })
                                    }
                                    className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="adminPass"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="adminPass"
                                        type="password"
                                        required
                                        value={adminData.password}
                                        onChange={(e) =>
                                            setAdminData({ ...adminData, password: e.target.value })
                                        }
                                        className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="adminConfirm"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Confirm
                                    </label>
                                    <input
                                        id="adminConfirm"
                                        type="password"
                                        required
                                        value={adminData.confirmPassword}
                                        onChange={(e) =>
                                            setAdminData({
                                                ...adminData,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-black py-4 font-black uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <User />}
                                Create Account
                            </button>
                        </form>
                    )}

                    {/* Step 2: Download Env */}
                    {step === 2 && (
                        <div className="space-y-6 text-center">
                            <div className="w-20 h-20 bg-green-100 border-4 border-green-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-black uppercase mb-2">
                                    Setup Complete!
                                </h2>
                                <p className="text-gray-600 font-medium">
                                    To finalize installation, you must save your configuration.
                                </p>
                            </div>

                            <div className="bg-gray-100 p-4 border-2 border-black text-left font-mono text-sm overflow-x-auto">
                                <p className="text-gray-500 mb-2"># .env</p>
                                <p>DB_HOST={dbConfig.host}</p>
                                <p>DB_USER={dbConfig.user}</p>
                                <p>DB_PASSWORD={dbConfig.password}</p>
                                <p>DB_NAME={dbConfig.database}</p>
                                <p>DB_PORT={dbConfig.port}</p>
                                <p className="mt-3 text-gray-500">
                                    # Google Custom Search (vehicle images)
                                </p>
                                <p>GOOGLE_API_KEY=your_google_api_key_here</p>
                                <p>GOOGLE_CSE_ID=11dfdf0330183431a</p>
                            </div>

                            <button
                                onClick={downloadEnv}
                                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-4 font-black uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <Download />
                                Download .env File
                            </button>

                            <div className="bg-yellow-100 p-4 border-l-4 border-yellow-500 text-left text-sm space-y-1">
                                <p className="font-bold text-neutral-900">
                                    ⚠️ IMPORTANT (.env FILE):
                                </p>
                                <p className="mt-1 text-neutral-900">1. Download the file above.</p>
                                <p className="text-neutral-900">
                                    2. Rename it to{' '}
                                    <code className="bg-yellow-200 px-1 text-black font-bold">
                                        .env
                                    </code>{' '}
                                    if needed.
                                </p>
                                <p className="text-neutral-900">
                                    3. Upload it to your server root directory.
                                </p>
                                <p className="text-neutral-900">
                                    4. <strong>Restart your Node.js application.</strong>
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 border-l-4 border-blue-500 text-left text-xs md:text-sm mt-3 space-y-1">
                                <p className="font-bold text-neutral-900">
                                    💡 Google Image Search (optional but recommended):
                                </p>
                                <p className="text-neutral-900">
                                    1. Open Google Cloud Console &gt; APIs &amp; Services &gt;
                                    Enable APIs, enable <strong>Custom Search API</strong>.
                                </p>
                                <p className="text-neutral-900">
                                    2. Create an API key and paste it into{' '}
                                    <code className="bg-yellow-200 px-1 text-black font-bold">
                                        GOOGLE_API_KEY
                                    </code>{' '}
                                    in your <code>.env</code>.
                                </p>
                                <p className="text-neutral-900">
                                    3. Go to <code>https://cse.google.com/cse/create</code>, create
                                    a Search Engine for the whole web, then copy the{' '}
                                    <strong>CX</strong> ID and use it as{' '}
                                    <code className="bg-yellow-200 px-1 text-black font-bold">
                                        GOOGLE_CSE_ID
                                    </code>{' '}
                                    (the default <code>11dfdf0330183431a</code> is only for
                                    testing).
                                </p>
                            </div>

                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 font-black uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <Terminal className="w-5 h-5" />
                                Go to Admin Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
