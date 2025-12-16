<script lang="ts">
  import {Button} from '$lib/components/ui/button'
</script>

<footer>
  <section>
    <div class="detail">© 2025 Lee Minseo</div>
    <div class="sns"></div>
  </section>
</footer>

<style lang="sass">
  @reference '#app.css'

  footer
    @apply py-6
    section
      @apply container-x flex justify-between items-start gap-8
      .detail
        @apply flex flex-col py-1 text-muted-foreground
      .sns
        @apply flex items-center
        :global(a)
          @apply size-8 fill-current
</style>
