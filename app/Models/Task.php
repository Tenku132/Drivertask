<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'driver_id',
        'title',
        'description',
        'status',
        'due_at',
    ];
}