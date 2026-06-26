'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { getSSOBypassStatus } from '@/app/actions/bypass';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSAMLSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const ssoDomain = process.env.NEXT_PUBLIC_SAML_DOMAIN || 'ogrupothebest.com.br';

    try {
      const bypassStatus = await getSSOBypassStatus();
      if (bypassStatus.bypassSSO) {
        console.log(`SSO Bypass is active. Logging in with hardcoded account: ${bypassStatus.bypassEmail}`);
        localStorage.setItem('sso_bypass_user', bypassStatus.bypassEmail);
        window.location.href = '/';
        return;
      }

      // Trigger Supabase corporate Auth via SAML 2.0 Identity Provider
      const { data, error } = await supabase.auth.signInWithSSO({
        domain: ssoDomain,
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect user to Corporate SAML / Entra ID Identity Provider
        window.location.href = data.url;
      } else {
        throw new Error('Não foi possível obter a URL de redirecionamento SSO.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao conectar ao provedor SAML.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 font-sans">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 to-orange-600 p-1 shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#151718] text-base font-black text-orange-500">
              TB
            </div>
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Acesso Corporativo</h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mt-1">O Grupo The Best</p>
          <p className="text-xs text-gray-400 mt-2">Login unificado via Microsoft Entra ID (SAML 2.0)</p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSAMLSignIn} className="space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#151718] px-4 py-3 text-sm font-bold text-white hover:bg-black transition-all shadow-md shadow-black/10 disabled:bg-gray-300"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                Entrar com SSO
                <ArrowRight className="h-4 w-4 text-orange-500" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[11px] text-gray-400 font-medium">
            Seu domínio corporativo configurado: <strong className="text-gray-600">{process.env.NEXT_PUBLIC_SAML_DOMAIN || 'ogrupothebest.com.br'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
