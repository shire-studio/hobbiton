<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Http\Middleware\EnsureTeamMembership;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

function teamWithMember(User $user, TeamRole $role): Team
{
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => $role->value]);

    return $team;
}

function runMembership(?User $user, string $parameter, ?Team $team, ?string $minimumRole = null): Response
{
    $request = Request::create('/probe');
    $route = new Route('GET', "{{$parameter}}/probe", []);
    $route->bind($request);

    if ($team instanceof Team) {
        $route->setParameter($parameter, $team);
    }

    $request->setRouteResolver(fn (): Route => $route);
    $request->setUserResolver(fn (): ?User => $user);

    return resolve(EnsureTeamMembership::class)->handle(
        $request,
        fn (): Response => response('ok'),
        $minimumRole,
    );
}

it('rejects non members', function (): void {
    runMembership(User::factory()->create(), 'current_team', Team::factory()->create());
})->throws(NotFoundHttpException::class);

it('rejects guests', function (): void {
    runMembership(null, 'current_team', Team::factory()->create());
})->throws(NotFoundHttpException::class);

it('rejects routes without a team', function (): void {
    runMembership(User::factory()->create(), 'current_team', null);
})->throws(NotFoundHttpException::class);

it('rejects members below the minimum role', function (): void {
    $user = User::factory()->create();

    runMembership($user, 'team', teamWithMember($user, TeamRole::Member), 'admin');
})->throws(NotFoundHttpException::class);

it('allows members at the minimum role', function (): void {
    $user = User::factory()->create();

    $response = runMembership($user, 'team', teamWithMember($user, TeamRole::Admin), 'admin');

    expect($response->getContent())->toBe('ok');
});

it('switches to the team in the url', function (): void {
    $user = User::factory()->create();
    $team = teamWithMember($user, TeamRole::Member);

    runMembership($user, 'current_team', $team);

    expect($user->refresh()->current_team_id)->toBe($team->id);
});

it('leaves the current team alone when it matches', function (): void {
    $user = User::factory()->create();
    $team = teamWithMember($user, TeamRole::Member);
    $user->forceFill(['current_team_id' => $team->id])->save();

    $saves = 0;
    User::saving(function () use (&$saves): void {
        $saves++;
    });

    runMembership($user, 'current_team', $team);

    expect($saves)->toBe(0);
});

it('does not switch teams for team routes', function (): void {
    $user = User::factory()->create();
    $before = $user->current_team_id;

    runMembership($user, 'team', teamWithMember($user, TeamRole::Admin));

    expect($user->refresh()->current_team_id)->toBe($before);
});
