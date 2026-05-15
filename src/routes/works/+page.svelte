<script lang="ts">
  import {ExternalLink} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import {Badge} from '$lib/components/ui/badge'
  import * as Card from '$lib/components/ui/card'

  type WorkType = '웹' | '폰트'

  interface Work {
    title: string
    url: string
    description: string
    type: WorkType
    scope?: string
    stack?: string[]
  }

  const works: Work[] = [
    {
      title: 'BitHangul',
      url: 'https://bithangul.quiple.dev',
      description: '비트맵 한글 폰트 제작 도구.',
      type: '웹',
      stack: ['TypeScript', 'Svelte', 'SvelteKit', 'Sass', 'Tailwind CSS', 'Cloudflare'],
    },
    {
      title: 'unicode.quiple.dev',
      url: 'https://unicode.quiple.dev',
      description: '유니코드 블록 및 문자 정보.',
      type: '웹',
      stack: ['TypeScript', 'Svelte', 'SvelteKit', 'Sass', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Cloudflare'],
    },
    {
      title: 'ChuHoody',
      url: 'https://chuhoody.com',
      description: '개인 포트폴리오 블로그.',
      type: '웹',
      stack: ['TypeScript', 'Astro', 'React', 'Sass', 'Tailwind CSS', 'Keystatic', 'Cloudflare'],
    },
    {
      title: 'Arcana of Trickcal',
      url: 'https://trickcaltarot.com',
      description: '게임 2차 창작 프로젝트 랜딩 페이지.',
      type: '웹',
      stack: ['TypeScript', 'Svelte', 'SvelteKit', 'Sass', 'Tailwind CSS', 'Cloudflare'],
    },
    {
      title: 'FitVac',
      url: 'https://fit-vac.com',
      description: '기업 홈페이지.',
      scope: '전체 홈페이지 리뉴얼 및 일부 관리자 기능 추가.',
      type: '웹',
      stack: ['PHP', 'Laravel', 'MySQL', 'JavaScript'],
    },
    {
      title: 'Galmuri',
      url: '/font/galmuri',
      description: '비트맵 한글 폰트 9종.',
      type: '폰트',
    },
    {
      title: 'x12y12pxMaruMinyaHangul',
      url: '/font/maruminya-hangul',
      description: '비트맵 한글 폰트.',
      type: '폰트',
    },
    {
      title: 'HBIOS-SYS',
      url: 'https://hbios.quiple.dev',
      description: '비트맵 한글 폰트.',
      type: '폰트',
    },
  ]

  const contributions: Work[] = [
    {
      title: 'Bluesky',
      url: 'https://bsky.app',
      description: '소셜 네트워크 서비스.',
      scope: '앱 전체의 한국어 번역 및 일부 국제화 기능 개선.',
      type: '웹',
      stack: ['TypeScript', 'React', 'React Native'],
    },
  ]

  function tilt(node: HTMLElement) {
    let frameId: number

    const handleMouseMove = (e: MouseEvent) => {
      if (frameId) cancelAnimationFrame(frameId)

      frameId = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const rotateX = (y - centerY) / 20
        const rotateY = (centerX - x) / 20

        node.style.setProperty('--rx', `${rotateX}deg`)
        node.style.setProperty('--ry', `${rotateY}deg`)
        node.style.setProperty('--mx', `${(x / rect.width) * 100}%`)
        node.style.setProperty('--my', `${(y / rect.height) * 100}%`)
      })
    }

    const handleMouseLeave = () => {
      if (frameId) cancelAnimationFrame(frameId)
      node.style.setProperty('--rx', '0deg')
      node.style.setProperty('--ry', '0deg')
    }

    node.addEventListener('mousemove', handleMouseMove)
    node.addEventListener('mouseleave', handleMouseLeave)

    return {
      destroy() {
        if (frameId) cancelAnimationFrame(frameId)
        node.removeEventListener('mousemove', handleMouseMove)
        node.removeEventListener('mouseleave', handleMouseLeave)
      },
    }
  }
</script>

<svelte:head>
  <title>Works</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet workCard(work: Work)}
  <a
    href={work.url}
    target={work.url.startsWith('http') ? '_blank' : '_self'}
    onclick={(e) => {
      if (!work.url.startsWith('http')) {
        e.preventDefault()
        goto(work.url)
      }
    }}
    class="group block h-full outline-none"
    style="perspective: 1000px;"
  >
    <div use:tilt class="card-dynamic h-full rounded-xl border bg-card">
      <Card.Root
        class="flex h-full flex-col border-none bg-transparent shadow-none group-focus-visible:ring-2 group-focus-visible:ring-ring"
      >
        <Card.Header>
          <Card.Title class="flex items-center gap-2 text-xl">
            {work.title}
            {#if work.url.startsWith('http')}
              <ExternalLink class="h-4 w-4 text-muted-foreground" />
            {/if}
          </Card.Title>
          <Card.Description class="mt-2">
            <Badge variant="secondary">{work.type}</Badge>
          </Card.Description>
        </Card.Header>
        <Card.Content class="grow">
          <p class="mb-2 text-sm text-foreground/90">{work.description}</p>
          {#if work.scope}
            <p class="text-sm text-muted-foreground"><span class="font-semibold">담당:</span> {work.scope}</p>
          {/if}
        </Card.Content>
        {#if work.stack && work.stack.length > 0}
          <Card.Footer>
            <div class="mt-auto flex flex-wrap gap-1.5">
              {#each work.stack as tech}
                <Badge variant="outline" class="text-xs font-normal">{tech}</Badge>
              {/each}
            </div>
          </Card.Footer>
        {/if}
      </Card.Root>
    </div>
  </a>
{/snippet}

<h1 class="page-title mb-8 text-3xl font-bold tracking-tight">Works</h1>

<section class="container-x mb-4">
  <div class="mb-12">
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each works as work, i}
        <div class="grid-item">
          {@render workCard(work)}
        </div>
      {/each}
    </div>
  </div>

  <h2 class="mb-6 text-2xl font-bold tracking-tight">Contributions</h2>

  <div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each contributions as work, i}
        <div class="grid-item">
          {@render workCard(work)}
        </div>
      {/each}
    </div>
  </div>
</section>

<style lang="sass">
  .grid-item
    opacity: 0
    animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards

    @for $i from 1 through 20
      &:nth-child(#{$i})
        animation-delay: #{$i * 0.05}s

  @keyframes fade-in-up
    from
      opacity: 0
      transform: translateY(30px)
    to
      opacity: 1
      transform: translateY(0)

  :global(.card-dynamic)
    position: relative
    overflow: hidden
    will-change: transform, box-shadow
    transform-style: preserve-3d
    -webkit-font-smoothing: antialiased
    backface-visibility: hidden
    transition: transform 0.15s ease-out, box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease
    transform: translateZ(0) translateY(0) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))

    &::before
      content: ''
      position: absolute
      inset: 0
      background: radial-gradient(circle at var(--mx, 0%) var(--my, 0%), rgba(255, 255, 255, 0.15), transparent 80%)
      opacity: 0
      transition: opacity 0.4s ease
      pointer-events: none
      z-index: 1

    &::after
      content: ''
      position: absolute
      top: 0
      left: -150%
      width: 150%
      height: 100%
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1) 30%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.1) 70%, transparent)
      transform: skewX(-25deg)
      pointer-events: none
      z-index: 10

  :global(.dark .card-dynamic)
    &::before
      background: radial-gradient(circle at var(--mx, 0%) var(--my, 0%), rgba(255, 255, 255, 0.1), transparent 80%)
    &::after
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.02) 30%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.02) 70%, transparent)

  :global(a.group)
    position: relative
    z-index: 1

  :global(a.group:hover)
    z-index: 50

  :global(a.group:hover .card-dynamic)
    transform: translateZ(0) translateY(-8px) scale(1.02) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.15), 0 18px 36px -18px rgba(0, 0, 0, 0.2)

    &::before
      opacity: 1

  :global(.dark a.group:hover .card-dynamic)
    box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.5), 0 0 30px -5px rgba(255, 255, 255, 0.04)
    border-color: rgba(255, 255, 255, 0.1)
</style>
