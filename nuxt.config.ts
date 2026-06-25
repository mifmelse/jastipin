// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-06-24',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  supabase: {
    // Unauthenticated users are redirected to /login; everything else is guarded.
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login'],
    },
  },
})
