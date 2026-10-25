<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateCurrentTeamRequest extends FormRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        $user = $this->user();

        assert($user instanceof User);

        return [
            'team_id' => [
                'required',
                'string',
                'uuid',
                Rule::exists(Membership::class, 'team_id')->where('user_id', $user->id),
            ],
        ];
    }
}
