<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'amount',
        'payment_method',
        'transaction_id',
        'chariow_sale_id',
        'chariow_checkout_url',
        'status',
        'paid_at'
    ];

    /**
     * Relation avec la location
     */
    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }
}