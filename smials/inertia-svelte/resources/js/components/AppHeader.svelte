<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import { Menu, Search } from '@lucide/svelte'
  import AppLogo from '@/components/AppLogo.svelte'
  import AppLogoIcon from '@/components/AppLogoIcon.svelte'
  import Breadcrumbs from '@/components/Breadcrumbs.svelte'
  import UserMenuContent from '@/components/UserMenuContent.svelte'
  import { Avatar, AvatarFallback } from '@/components/ui/avatar'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
  } from '@/components/ui/navigation-menu'
  import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from '@/components/ui/sheet'
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from '@/components/ui/tooltip'
  import { extraNavItems, mainNavItems } from '@/lib/navigation'
  import { cn, toUrl } from '@/lib/utils'
  import { dashboard } from '@/routes'
  import type { BreadcrumbItem } from '@/types'

  let { breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] } = $props()

  const user = $derived(page.props.auth.user!)
  const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl()

  const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
</script>

<div>
  <div class="border-b border-sidebar-border/80">
    <div class="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
      <!-- Mobile Menu -->
      <div class="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            {#snippet children(props)}
              <Button
                variant="ghost"
                size="icon"
                class="mr-2 h-9 w-9"
                onclick={props.onclick}
                aria-expanded={props['aria-expanded']}
              >
                <Menu class="h-5 w-5" />
              </Button>
            {/snippet}
          </SheetTrigger>
          <SheetContent side="left" class="w-[300px] p-6">
            <SheetTitle class="sr-only">Navigation menu</SheetTitle>
            <SheetHeader class="flex justify-start text-left">
              <AppLogoIcon
                class="size-6 fill-current text-black dark:text-white"
              />
            </SheetHeader>
            <div
              class="flex h-full flex-1 flex-col justify-between space-y-4 py-6"
            >
              <nav class="-mx-3 space-y-1">
                {#each mainNavItems as item (item.title)}
                  <Link
                    href={item.href}
                    class={cn(
                      'flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent',
                      whenCurrentUrl(item.href, activeItemStyles),
                    )}
                  >
                    {#if item.icon}
                      <item.icon class="h-5 w-5" />
                    {/if}
                    {item.title}
                  </Link>
                {/each}
              </nav>
              <div class="flex flex-col space-y-4">
                {#each extraNavItems as item (item.title)}
                  <a
                    href={toUrl(item.href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center space-x-2 text-sm font-medium"
                  >
                    {#if item.icon}
                      <item.icon class="h-5 w-5" />
                    {/if}
                    <span>{item.title}</span>
                  </a>
                {/each}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Link href={dashboard()} class="flex items-center gap-x-2">
        <AppLogo />
      </Link>

      <!-- Desktop Menu -->
      <div class="hidden h-full lg:flex lg:flex-1">
        <NavigationMenu class="ml-10 flex h-full items-stretch">
          <NavigationMenuList class="flex h-full items-stretch space-x-2">
            {#each mainNavItems as item, index (index)}
              <NavigationMenuItem class="relative flex h-full items-center">
                <Link
                  class={cn(
                    navigationMenuTriggerStyle(),
                    whenCurrentUrl(item.href, activeItemStyles),
                    'h-9 cursor-pointer px-3',
                  )}
                  href={item.href}
                >
                  {#if item.icon}
                    <item.icon class="mr-2 h-4 w-4" />
                  {/if}
                  {item.title}
                </Link>
                {#if isCurrentUrl(item.href)}
                  <div
                    class="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"
                  ></div>
                {/if}
              </NavigationMenuItem>
            {/each}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div class="ml-auto flex items-center space-x-2">
        <div class="relative flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            class="group h-9 w-9 cursor-pointer"
          >
            <Search class="size-5 opacity-80 group-hover:opacity-100" />
          </Button>

          <div class="hidden space-x-1 lg:flex">
            {#each extraNavItems as item (item.title)}
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    {#snippet child({ props })}
                      <a
                        href={toUrl(item.href)}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                        class="group inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span class="sr-only">{item.title}</span>
                        {#if item.icon}
                          <item.icon
                            class="size-5 opacity-80 group-hover:opacity-100"
                          />
                        {/if}
                      </a>
                    {/snippet}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            {/each}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {#snippet children(props)}
              <Button
                variant="ghost"
                size="icon"
                class="relative size-10 w-auto rounded-full p-1 focus-within:ring-2 focus-within:ring-primary"
                onclick={props.onclick}
                aria-expanded={props['aria-expanded']}
                data-state={props['data-state']}
              >
                <Avatar class="size-8 overflow-hidden rounded-full">
                  <AvatarFallback
                    class="rounded-lg bg-neutral-200 font-semibold text-black dark:bg-neutral-700 dark:text-white"
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <UserMenuContent {user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>

  {#if breadcrumbs.length > 1}
    <div class="flex w-full border-b border-sidebar-border/70">
      <div
        class="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl"
      >
        <Breadcrumbs {breadcrumbs} />
      </div>
    </div>
  {/if}
</div>
