<script setup lang="ts">
const props = defineProps<{ tripId: string }>()
const { trip, update } = useTrip(props.tripId)
const toast = useToast()

const saving = ref(false)
const form = reactive({
  name: '',
  type: 'single',
  traveler_count: 1,
  total_capacity_kg: '' as number | '',
  status: 'draft',
})

watchEffect(() => {
  if (!trip.value) return
  Object.assign(form, {
    name: trip.value.name,
    type: trip.value.type,
    traveler_count: trip.value.traveler_count,
    total_capacity_kg: trip.value.total_capacity_kg ?? '',
    status: trip.value.status,
  })
})

async function save() {
  // Changing type wipes the trip's legs (DB trigger) — confirm first.
  if (trip.value && form.type !== trip.value.type) {
    const ok = await useConfirm().confirm({
      title: 'Ganti type trip',
      description: 'Mengganti type akan menghapus semua leg/route trip ini. Lanjut?',
      confirmLabel: 'Ganti & reset',
    })
    if (!ok) return
  }
  saving.value = true
  try {
    await update({
      name: form.name.trim(),
      type: form.type,
      traveler_count: Number(form.traveler_count) || 1,
      total_capacity_kg: form.total_capacity_kg === '' ? null : Number(form.total_capacity_kg),
      status: form.status,
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
  <div class="max-w-lg space-y-4">
    <UFormField label="Name" required>
      <UInput v-model="form.name" class="w-full" />
    </UFormField>
    <div class="grid grid-cols-2 gap-3">
      <UFormField label="Type" required>
        <USelect v-model="form.type" :items="TRIP_TYPE_OPTIONS" class="w-full" />
      </UFormField>
      <UFormField label="Status">
        <USelect v-model="form.status" :items="TRIP_STATUS_OPTIONS" class="w-full" />
      </UFormField>
      <UFormField label="Traveler count">
        <UInput v-model.number="form.traveler_count" type="number" class="w-full" />
      </UFormField>
      <UFormField label="Total capacity (kg)">
        <UInput v-model.number="form.total_capacity_kg" type="number" class="w-full" />
      </UFormField>
    </div>
    <UButton :loading="saving" :disabled="!form.name.trim()" @click="save">Simpan</UButton>
  </div>
</template>
