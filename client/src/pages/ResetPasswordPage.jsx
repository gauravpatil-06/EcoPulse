import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const { data } = await axios.put(`/api/auth/reset-password/${token}`, { password });
            setMessage(data.message || 'Password reset successful!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired token.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#f0f9ff] dark:bg-[#020617] relative">
            {/* Background elements to match overall aesthetics */}
            <div className="absolute w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -top-20 -left-20 pointer-events-none" />
            <div className="absolute w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] -bottom-20 -right-20 pointer-events-none" />

            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-2xl shadow-xl relative z-10">
                <h2 className="text-[26px] font-black tracking-tight text-center mb-6 text-gray-900 dark:text-white">Reset Password</h2>
                
                {message && <p className="text-sm font-semibold text-emerald-600 mb-4 bg-emerald-100/50 p-3 rounded-xl border border-emerald-200">{message}</p>}
                {error && <p className="text-sm font-semibold text-red-600 mb-4 bg-red-100/50 p-3 rounded-xl border border-red-200">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 ml-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                            className="w-full px-4 py-2.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md outline-none focus:border-[#288379] focus:ring-1 focus:ring-[#288379] text-gray-900 dark:text-white transition-all placeholder-gray-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2.5 text-[14px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md outline-none focus:border-[#288379] focus:ring-1 focus:ring-[#288379] text-gray-900 dark:text-white transition-all placeholder-gray-400"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-[#288379] hover:bg-[#1d6b63] text-white font-bold rounded-xl shadow-lg shadow-[#288379]/20 transition-all active:scale-95 disabled:opacity-50 text-[15px] mt-2"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
