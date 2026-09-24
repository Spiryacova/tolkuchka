<template>
  <div>
    <div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800/60">
      <img
        v-if="currentImage"
        :src="currentImage"
        :alt="alt"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <UIcon
        v-else
        name="i-heroicons-photo"
        class="absolute inset-0 m-auto h-10 w-10 text-primary/30"
      />
    </div>

    <div class="relative mt-3">
      <div
        ref="scrollEl"
        class="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :class="isOverflow ? '' : 'justify-center'"
      >
        <button
          v-for="(img, index) in images"
          :key="index"
          type="button"
          class="relative aspect-[3/4] w-10 shrink-0 overflow-hidden rounded-md border-2 bg-gray-100 transition sm:w-14 md:w-20 dark:bg-gray-800/60"
          :class="index === active ? 'border-primary' : 'border-transparent'"
          @click="active = index"
        >
          <img :src="img" :alt="`${alt} — фото ${index + 1}`" class="absolute inset-0 h-full w-full object-cover" />
        </button>
      </div>

      <template v-if="isOverflow">
        <UButton
          v-if="hasStartFade"
          icon="i-heroicons-chevron-left"
          size="sm"
          color="neutral"
          variant="ghost"
          class="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-white/90 shadow-sm hover:bg-white dark:bg-gray-800/70 dark:hover:bg-gray-800/90"
          @click="scrollThumbnails(-1)"
        />
        <UButton
          v-if="hasEndFade"
          icon="i-heroicons-chevron-right"
          size="sm"
          color="neutral"
          variant="ghost"
          class="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white/90 shadow-sm hover:bg-white dark:bg-gray-800/70 dark:hover:bg-gray-800/90"
          @click="scrollThumbnails(1)"
        />
      </template>

      <div
        v-if="hasStartFade"
        class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900"
      />
      <div
        v-if="hasEndFade"
        class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{ images: string[]; alt: string }>();

  const active = ref(0);

  const currentImage = computed(() => props.images[active.value] || undefined);

  const scrollEl = ref<HTMLElement | null>(null);
  const hasStartFade = ref(false);
  const hasEndFade = ref(false);
  const isOverflow = ref(false);
  let resizeObserver: ResizeObserver | null = null;

  function updateGallery() {
    const el = scrollEl.value;
    if (!el) return;
    isOverflow.value = el.scrollWidth > el.clientWidth + 1;
    hasStartFade.value = el.scrollLeft > 1;
    hasEndFade.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
  }

  onMounted(() => {
    const el = scrollEl.value;
    if (!el) return;
    el.addEventListener('scroll', updateGallery, { passive: true });
    nextTick(updateGallery);
    resizeObserver = new ResizeObserver(updateGallery);
    resizeObserver.observe(el);
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
  });

  function scrollThumbnails(positions: number) {
    const el = scrollEl.value;
    if (!el) return;
    el.scrollBy({ left: positions * 176, behavior: 'smooth' });
  }
</script>