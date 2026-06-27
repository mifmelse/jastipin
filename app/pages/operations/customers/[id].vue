<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const { customer, status } = useCustomer(id)
</script>

<template>
  <div class="space-y-4">
    <div v-if="status === 'pending'" class="text-sm text-stone-400">Memuat…</div>
    <div v-else-if="!customer" class="text-sm text-stone-400">Customer tidak ditemukan.</div>
    <template v-else>
      <DetailHeader
        back="/operations/crm"
        back-label="CRM"
        :title="customer.name"
        :subtitle="customer.phone ?? customer.email ?? undefined"
        :avatar-url="customer.image_url"
        icon="i-lucide-user"
        rounded="rounded-full"
      >
        <template #meta>
          <span class="text-stone-500">{{ customer.countries?.name ?? '—' }}</span>
        </template>
      </DetailHeader>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="space-y-3">
          <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Info</h2>
          <CustomerInfo :customer-id="id" />
        </section>
        <section class="space-y-3">
          <h2 class="text-sm font-semibold text-stone-500 uppercase tracking-wide">Alamat penerima</h2>
          <CustomerAddressesPanel :customer-id="id" />
        </section>
      </div>
    </template>
  </div>
</template>
