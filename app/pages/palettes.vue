<script setup lang="ts">
  import { palettes, type PaletteOption } from '~/data/palettes';

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  const lightNeutral = {
    content: '#18181b',
    muted: '#71717a',
    dimmed: '#a1a1aa',
  };

  function darkBgOf(p: PaletteOption) {
    return p.neutral.scale[900];
  }
</script>

<template>
  <div class="py-10 sm:py-14">
    <div class="mx-auto max-w-6xl">
      <header class="mb-10 text-center">
        <UBadge color="warning" variant="subtle" class="mb-4"
          >Временная страница — не входит в дизайн-систему</UBadge
        >
        <h1 class="text-2xl font-bold sm:text-3xl">Варианты палитры</h1>
        <p class="mx-auto mt-3 max-w-xl text-sm text-muted">
          Четыре варианта из <code>palette-options.md</code>. У каждого: шкалы
          primary/accent/neutral (50–950), кнопка с проверенным контрастом и тёмная тема. Переключи
          тему кнопкой в шапке, чтобы сравнить в обеих.
        </p>
      </header>

      <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <UCard v-for="p in palettes" :key="p.id" class="p-0">
          <template #default>
            <div class="p-6">
              <div class="mb-2 flex items-center gap-3">
                <UBadge color="neutral" variant="soft" class="text-sm">{{ p.id }}</UBadge>
                <h2 class="text-lg font-semibold">{{ p.name }}</h2>
              </div>
              <p class="text-xs font-medium uppercase tracking-wide text-muted">
                {{ p.char }}
              </p>
              <p class="mt-2 text-sm text-muted">{{ p.desc }}</p>
            </div>

            <div class="border-t border-line-muted p-6">
              <div
                v-for="group in [
                  {
                    label: 'Primary · ' + p.primary.key,
                    scale: p.primary.scale,
                  },
                  { label: 'Accent · ' + p.accent.key, scale: p.accent.scale },
                  {
                    label: 'Neutral · ' + p.neutral.key,
                    scale: p.neutral.scale,
                  },
                ]"
                :key="group.label"
                class="mb-5 last:mb-0"
              >
                <p class="mb-2 text-xs text-muted">{{ group.label }}</p>
                <div class="flex overflow-hidden rounded-lg ring-1 ring-line-muted">
                  <div
                    v-for="shade in shades"
                    :key="shade"
                    class="flex h-14 flex-1 items-end justify-center pb-1"
                    :class="shade >= 600 ? 'text-white' : 'text-black'"
                    :style="{ backgroundColor: group.scale[shade] }"
                    :title="`${shade} · ${group.scale[shade]}`"
                  >
                    <span class="text-[10px] opacity-70">{{ shade }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="border-t border-line-muted p-6">
              <p class="mb-3 text-xs text-muted">Кнопка (action) · контраст {{ p.contrast }}</p>
              <div class="flex flex-wrap items-center gap-3">
                <span
                  class="rounded-md px-4 py-2 text-sm font-medium"
                  :style="{ backgroundColor: p.action, color: p.actionText }"
                  >Primary</span
                >
                <span
                  class="rounded-md px-4 py-2 text-sm font-medium"
                  :style="{ backgroundColor: p.hover, color: p.actionText }"
                  >Hover</span
                >
                <span
                  class="rounded-md border px-4 py-2 text-sm font-medium"
                  :style="{ borderColor: p.action, color: p.action }"
                  >Outline</span
                >
              </div>
            </div>

            <div class="border-t border-line-muted p-6">
              <p class="mb-3 text-xs text-muted">Текст на поверхности (neutral)</p>
              <div
                class="rounded-lg p-4"
                :style="{
                  backgroundColor: p.neutral.scale[50],
                  color: lightNeutral.content,
                }"
              >
                <p class="text-sm font-semibold">Заголовок — основной текст</p>
                <p class="text-sm" :style="{ color: lightNeutral.content }">
                  Обычный текст статьи.
                </p>
                <p class="text-sm" :style="{ color: lightNeutral.muted }">
                  Вторичный текст, подписи.
                </p>
                <p class="text-xs" :style="{ color: lightNeutral.dimmed }">Капишены и хинты.</p>
              </div>

              <div
                class="mt-3 rounded-lg p-4"
                :style="{ backgroundColor: darkBgOf(p), color: '#fafafa' }"
              >
                <p class="text-sm font-semibold">Тёмная тема (фон {{ p.neutral.scale[900] }})</p>
                <p class="text-sm" style="color: #fafafa">Основной текст в тёмной теме.</p>
                <p class="text-sm" style="color: #a1a1aa">Вторичный текст в тёмной теме.</p>
              </div>
            </div>
          </template>
        </UCard>
      </div>

      <p class="mt-10 text-center text-sm text-dimmed">
        После выбора: шкалы в <code>@theme static</code> → <code>ui.colors</code> в
        <code>app.config.ts</code> → обновление <code>DESIGN-SYSTEM.md</code> §2. Эту страницу
        удалить.
      </p>
    </div>
  </div>
</template>
