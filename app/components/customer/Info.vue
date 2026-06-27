<script setup lang="ts">
const props = defineProps<{ customerId: string }>()
const { customer, update } = useCustomer(props.customerId)
const { items: countries } = useCountries()
const toast = useToast()

const GENDER_OPTIONS = [
  { label: '— none —', value: NONE },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]
const countryOptions = computed(() => [
  { label: '— none —', value: NONE },
  ...(countries.value ?? []).map((c) => ({ label: c.name, value: c.id })),
])

const saving = ref(false)
const form = reactive({ name: '', phone: '', email: '', gender: NONE, country_id: NONE, notes: '', image_url: '' })

watchEffect(() => {
  if (!customer.value) return
  Object.assign(form, {
    name: customer.value.name,
    phone: customer.value.phone ?? '',
    email: customer.value.email ?? '',
    gender: fromNullable(customer.value.gender),
    country_id: fromNullable(customer.value.country_id),
    notes: customer.value.notes ?? '',
    image_url: customer.value.image_url ?? '',
  })
})

async function save() {
  saving.value = true
  try {
    await update({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      gender: toNullable(form.gender),
      country_id: toNullable(form.country_id),
      notes: form.notes.trim() || null,
      image_url: form.image_url || null,
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
    <div class="flex items-center gap-3">
      <MediaThumb :url="form.image_url" size="size-16" rounded="rounded-full" icon="i-lucide-user" />
      <FileUpload v-model="form.image_url" folder="customers" accept="image/*" />
    </div>
    <UFormField label="Name" required>
      <UInput v-model="form.name" class="w-full" />
    </UFormField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <UFormField label="Phone">
        <UInput v-model="form.phone" class="w-full" />
      </UFormField>
      <UFormField label="Email">
        <UInput v-model="form.email" type="email" class="w-full" />
      </UFormField>
      <UFormField label="Gender">
        <USelect v-model="form.gender" :items="GENDER_OPTIONS" class="w-full" />
      </UFormField>
      <UFormField label="Country">
        <USelect v-model="form.country_id" :items="countryOptions" class="w-full" />
      </UFormField>
    </div>
    <UFormField label="Notes">
      <UTextarea v-model="form.notes" class="w-full" :rows="2" />
    </UFormField>
    <UButton :loading="saving" :disabled="!form.name.trim()" @click="save">Simpan</UButton>
  </div>
</template>
