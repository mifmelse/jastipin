<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const { customer, status } = useCustomer(id)
</script>

<template>
  <div class="space-y-4">
    <NuxtLink
      to="/operations/crm"
      class="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-primary"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4" /> CRM
    </NuxtLink>

    <div v-if="status === 'pending'" class="text-sm text-stone-400">Memuat…</div>
    <div v-else-if="!customer" class="text-sm text-stone-400">Customer tidak ditemukan.</div>
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-xl font-semibold">{{ customer.name }}</h1>
        <span v-if="customer.phone" class="text-sm text-stone-500">{{ customer.phone }}</span>
      </div>

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
