<footer>
  <section>
    <div class="detail">
      <span>© 2025 Lee Minseo</span>
      <a href="https://github.com/quiple/blog" class="text-sm hover:underline">소스 코드 · AGPL-3.0</a>
    </div>
    <div class="sns"></div>
  </section>
</footer>

<style>
  @reference '#app.css';
  footer {
    @apply py-6;
  }
  footer section {
    @apply container-x flex items-start justify-between gap-8;
  }
  footer section .detail {
    @apply flex flex-col py-1 text-muted-foreground;
  }
  footer section .sns {
    @apply flex items-center;
  }
  footer section .sns :global(a) {
    @apply size-8 fill-current;
  }
</style>
