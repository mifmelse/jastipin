<script setup lang="ts">
const { can } = useCan()
const { profile, update } = useCompanyProfile()
const toast = useToast()

const form = reactive({
  name: '',
  logo_url: '',
  address: '',
  phone: '',
  email: '',
  bank_name: '',
  bank_account: '',
  bank_holder: '',
  qris_url: '',
  invoice_note: '',
})

watchEffect(() => {
  if (!profile.value) return
  Object.assign(form, {
    name: profile.value.name ?? '',
    logo_url: profile.value.logo_url ?? '',
    address: profile.value.address ?? '',
    phone: profile.value.phone ?? '',
    email: profile.value.email ?? '',
    bank_name: profile.value.bank_name ?? '',
    bank_account: profile.value.bank_account ?? '',
    bank_holder: profile.value.bank_holder ?? '',
    qris_url: profile.value.qris_url ?? '',
    invoice_note: profile.value.invoice_note ?? '',
  })
})

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await update({
      name: form.name.trim() || 'Bagasian',
      logo_url: form.logo_url || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      bank_name: form.bank_name.trim() || null,
      bank_account: form.bank_account.trim() || null,
      bank_holder: form.bank_holder.trim() || null,
      qris_url: form.qris_url || null,
      invoice_note: form.invoice_note.trim() || null,
    })
    toast.add({ title: 'Tersimpan', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Gagal menyimpan', description: (e as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Company Profile" subtitle="Identitas usaha — dipakai di header/footer invoice." icon="i-lucide-building" />

    <div class="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 space-y-5 max-w-3xl">
      <div class="grid gap-5 sm:grid-cols-2">
        <UFormField label="Nama usaha" required>
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField label="Logo">
          <div class="flex items-center gap-3">
            <MediaThumb :url="form.logo_url" size="size-12" rounded="rounded-lg" icon="i-lucide-building" />
            <FileUpload v-model="form.logo_url" folder="company" accept="image/*" />
          </div>
        </UFormField>
        <UFormField label="Telepon">
          <UInput v-model="form.phone" class="w-full" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="form.email" type="email" class="w-full" />
        </UFormField>
      </div>

      <UFormField label="Alamat">
        <UTextarea v-model="form.address" :rows="2" class="w-full" />
      </UFormField>

      <div class="border-t border-stone-100 dark:border-stone-800 pt-4">
        <p class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Pembayaran</p>
        <div class="grid gap-5 sm:grid-cols-3">
          <UFormField label="Bank">
            <UInput v-model="form.bank_name" class="w-full" placeholder="mis. BCA" />
          </UFormField>
          <UFormField label="No. rekening">
            <UInput v-model="form.bank_account" class="w-full" />
          </UFormField>
          <UFormField label="Atas nama">
            <UInput v-model="form.bank_holder" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="QRIS" class="mt-3">
          <div class="flex items-center gap-3">
            <MediaThumb :url="form.qris_url" size="size-16" rounded="rounded-lg" icon="i-lucide-qr-code" />
            <FileUpload v-model="form.qris_url" folder="company" accept="image/*" />
          </div>
        </UFormField>
      </div>

      <UFormField label="Catatan invoice" help="Muncul di footer invoice (mis. syarat pembayaran).">
        <UTextarea v-model="form.invoice_note" :rows="2" class="w-full" />
      </UFormField>

      <UButton v-if="can('company_profile.write')" :loading="saving" @click="save">Simpan</UButton>
    </div>
  </div>
</template>
