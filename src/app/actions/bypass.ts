'use server';

export async function getSSOBypassStatus() {
  return {
    bypassSSO: process.env.BYPASS_SSO === 'true',
    bypassEmail: 'joshuaigor@ogrupothebest.com'
  };
}
