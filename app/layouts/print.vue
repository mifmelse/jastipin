<template>
  <!-- Minimal chrome-less layout so the invoice prints cleanly (Save as PDF). -->
  <div class="min-h-dvh bg-stone-100 dark:bg-stone-900 py-6 print:bg-white print:py-0">
    <slot />
  </div>
</template>
