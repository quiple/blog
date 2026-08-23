<script lang="ts">
  import {Button} from '$lib/components/ui/button'
</script>

<footer>
  <section>
    <div class="detail">© 2025 Lee Minseo</div>
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
