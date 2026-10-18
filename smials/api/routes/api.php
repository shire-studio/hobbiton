<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['name' => config('app.name')]))->name('home');

Route::middleware('guest')->group(function (): void {
    Route::post('register', [RegisterController::class, 'store'])->name('register.store');
    Route::post('login', [LoginController::class, 'store'])->name('login.store');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('logout', LogoutController::class)->name('logout');

    Route::get('user', [ProfileController::class, 'show'])->name('user.show');
    Route::patch('user', [ProfileController::class, 'update'])->name('user.update');
    Route::delete('user', [ProfileController::class, 'destroy'])
        ->middleware('throttle:6,1')
        ->name('user.destroy');

    Route::put('user/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::post('email/verification-notification', EmailVerificationNotificationController::class)
        ->middleware('throttle:6,1')
        ->name('verification.send');
    Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'update'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
});
