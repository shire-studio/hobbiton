<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Settings\CurrentTeamController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Teams\AcceptInvitationController;
use App\Http\Controllers\Teams\DeclineInvitationController;
use App\Http\Controllers\Teams\InvitationController;
use App\Http\Controllers\Teams\LeaveTeamController;
use App\Http\Controllers\Teams\TeamController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\Teams\TeamMemberController;
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

    Route::put('user/current-team', CurrentTeamController::class)->name('user.current-team.update');

    Route::put('user/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::post('email/verification-notification', EmailVerificationNotificationController::class)
        ->middleware('throttle:6,1')
        ->name('verification.send');
    Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'update'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::get('teams', [TeamController::class, 'index'])->name('teams.index');
    Route::post('teams', [TeamController::class, 'store'])->name('teams.store');
    Route::get('teams/{team}', [TeamController::class, 'show'])->can('view', 'team')
        ->name('teams.show');
    Route::patch('teams/{team}', [TeamController::class, 'update'])->can('update', 'team')
        ->name('teams.update');
    Route::delete('teams/{team}', [TeamController::class, 'destroy'])->can('delete', 'team')
        ->name('teams.destroy');
    Route::delete('teams/{team}/leave', LeaveTeamController::class)->can('leave', 'team')
        ->name('teams.leave');

    Route::patch('teams/{team}/members/{user}', [TeamMemberController::class, 'update'])->can('updateMember', 'team')
        ->name('teams.members.update');
    Route::delete('teams/{team}/members/{user}', [TeamMemberController::class, 'destroy'])->can('removeMember', 'team')
        ->name('teams.members.destroy');

    Route::post('teams/{team}/invitations', [TeamInvitationController::class, 'store'])->can('inviteMember', 'team')
        ->name('teams.invitations.store');
    Route::delete('teams/{team}/invitations/{invitation:code}', [TeamInvitationController::class, 'destroy'])->can('cancelInvitation', 'team')
        ->name('teams.invitations.destroy');

    Route::get('invitations', [InvitationController::class, 'index'])->name('invitations.index');
    Route::post('invitations/{invitation:code}/accept', AcceptInvitationController::class)->name('invitations.accept');
    Route::delete('invitations/{invitation:code}', DeclineInvitationController::class)->name('invitations.decline');
});
