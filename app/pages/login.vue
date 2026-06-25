<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

// Already signed in → leave the login page.
watchEffect(() => {
  if (user.value) router.replace('/')
})

async function onSubmit() {
  loading.value = true
  errorMessage.value = ''
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  loading.value = false
  if (error) errorMessage.value = error.message
  // On success the redirect is handled by the watchEffect above.
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center justify-center size-9 rounded-xl bg-primary text-white font-bold">J</span>
          <div>
            <h1 class="text-lg font-semibold leading-tight">Jastipin</h1>
            <p class="text-sm text-stone-500">Masuk buat lanjut, ya 👋</p>
          </div>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Email">
          <UInput v-model="email" type="email" autocomplete="email" required class="w-full" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" />
        </UFormField>

        <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>

        <UButton type="submit" block :loading="loading">Masuk</UButton>
      </form>
    </UCard>
  </div>
</template>
