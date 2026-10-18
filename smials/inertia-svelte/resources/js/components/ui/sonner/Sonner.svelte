<script lang="ts">
    import { useAppearance } from '@/composables/useAppearance.svelte';
    import { Toaster as SonnerPrimitive, type ToasterProps } from 'svelte-sonner';

    let { ...restProps }: ToasterProps = $props();

    const { appearance } = useAppearance();
</script>

<SonnerPrimitive
    theme={appearance.value}
    class="toaster group"
    position="bottom-right"
    style="--normal-bg: var(--popover); --normal-text: var(--popover-foreground); --normal-border: var(--border);"
    {...restProps}
/>
