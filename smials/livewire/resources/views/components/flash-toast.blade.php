{{-- Shows the toast a controller flashed with ->with('toast', [...]), like lib/flashToast.ts in the Inertia kits. --}}
@if (session('toast'))
    <div
        x-data
        x-init="$nextTick(() => $dispatch('toast-show', {
            duration: 5000,
            slots: { text: @js(session('toast.message')) },
            dataset: { variant: @js(session('toast.type')) },
        }))"
    ></div>
@endif
