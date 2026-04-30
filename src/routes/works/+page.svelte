<script lang="ts">
  import {ExternalLink} from '@lucide/svelte'
  import {Badge} from '$lib/components/ui/badge'
  import {Button} from '$lib/components/ui/button'
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
      description: '기업 웹사이트.',
      scope: '전체 홈페이지 리뉴얼 및 관리자 기능 추가.',
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
      scope: '앱 전체의 한국어 번역 및 일부 국제화 개선.',
      type: '웹',
      stack: ['TypeScript', 'React', 'React Native'],
    },
  ]
</script>

<svelte:head>
  <title>Works</title>
  <meta name="description" content="내 작업물." />
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet workCard(work: Work)}
  <a href={work.url} target={work.url.startsWith('http') ? '_blank' : '_self'} class="group block h-full outline-none">
    <Card.Root
      class="flex h-full flex-col transition-colors group-hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-ring"
    >
      <Card.Header>
        <Card.Title class="flex items-center gap-2 text-xl group-hover:underline">
          {work.title}
          {#if work.url.startsWith('http')}
            <ExternalLink class="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
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
  </a>
{/snippet}

<h1 class="page-title mb-8 text-3xl font-bold tracking-tight">Works</h1>

<section class="container-x">
  <div class="mb-12">
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each works as work}
        {@render workCard(work)}
      {/each}
    </div>
  </div>

  <h2 class="mb-6 text-2xl font-bold tracking-tight">Contributions</h2>

  <div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each contributions as work}
        {@render workCard(work)}
      {/each}
    </div>
  </div>
</section>
