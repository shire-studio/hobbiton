@php
    $form = old('form');
@endphp

{{--
    The create team modal on every app page also posts a `name` field, so this form posts a hidden `form` marker and shows
    its old values and errors only when `old('form')` matches it, the same way the team pages do.
--}}
<x-layouts::app :title="__('Profile settings')">
    <section class="w-full">
        @include('partials.settings-heading')

        <flux:heading level="2" class="sr-only">{{ __('Profile settings') }}</flux:heading>

        <x-pages::settings.layout :heading="__('Profile')" :subheading="__('Update your name and email address')">
            <form method="POST" action="{{ route('user-profile.update') }}" class="my-6 w-full space-y-6">
                @csrf
                @method('PATCH')
                <input type="hidden" name="form" value="profile" />

                <flux:field>
                    <flux:label>{{ __('Name') }}</flux:label>
                    <flux:input
                        input:name="name"
                        :invalid="$form === 'profile' && $errors->has('name')"
                        :value="$form === 'profile' ? old('name') : auth()->user()->name"
                        type="text"
                        required
                        autofocus
                        autocomplete="name"
                        :placeholder="__('Full name')"
                    />
                    @if ($form === 'profile')
                        <flux:error name="name" />
                    @endif
                </flux:field>

                <div>
                    <flux:field>
                        <flux:label>{{ __('Email address') }}</flux:label>
                        <flux:input
                            input:name="email"
                            :invalid="$form === 'profile' && $errors->has('email')"
                            :value="$form === 'profile' ? old('email') : auth()->user()->email"
                            type="email"
                            required
                            autocomplete="username"
                            :placeholder="__('Email address')"
                        />
                        @if ($form === 'profile')
                            <flux:error name="email" />
                        @endif
                    </flux:field>

                    @unless (auth()->user()->hasVerifiedEmail())
                        <flux:text class="mt-4">
                            {{ __('Your email address is unverified.') }}

                            <flux:link
                                as="button"
                                type="submit"
                                form="send-verification"
                                class="cursor-pointer text-sm"
                            >
                                {{ __('Click here to re-send the verification email.') }}
                            </flux:link>
                        </flux:text>

                        @if ($status === App\Enums\SessionStatus::VerificationLinkSent->value)
                            <flux:text class="!dark:text-green-400 mt-2 font-medium !text-green-600">
                                {{ __('A new verification link has been sent to your email address.') }}
                            </flux:text>
                        @endif
                    @endunless
                </div>

                <div class="flex items-center gap-4">
                    <flux:button variant="primary" type="submit" data-test="update-profile-button">
                        {{ __('Save') }}
                    </flux:button>
                </div>
            </form>

            <form id="send-verification" method="POST" action="{{ route('verification.send') }}">
                @csrf
            </form>

            <x-pages::settings.delete-user />
        </x-pages::settings.layout>
    </section>
</x-layouts::app>
