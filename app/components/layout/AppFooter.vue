<template>
  <footer class="mt-16 border-t border-default">
    <div class="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
      <div>
        <p class="mb-4 font-semibold">Толкучка</p>
        <p class="text-sm text-muted">
          Мультивендорная площадка: покупайте и продавайте без посредников.
        </p>
      </div>
      <div>
        <p class="mb-4 text-xs uppercase tracking-wide text-muted">Покупателям</p>
        <ul class="space-y-2 text-sm">
          <li><ULink to="/products">Каталог</ULink></li>
          <li><ULink to="/cart">Корзина</ULink></li>
        </ul>
      </div>
      <div>
        <p class="mb-4 text-xs uppercase tracking-wide text-muted">Компания</p>
        <ul class="space-y-2 text-sm">
          <li><ULink to="/about">О нас</ULink></li>
          <li><ULink to="/contact">Контакты</ULink></li>
          <li><ULink to="/privacy">Политика конфиденциальности</ULink></li>
          <li><ULink to="/terms">Условия</ULink></li>
        </ul>
      </div>
    </div>
  </footer>
</template>
