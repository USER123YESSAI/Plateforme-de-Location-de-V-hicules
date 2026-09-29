<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CHARIOW = 'chariow';
    case CARD = 'card';
    case CASH = 'cash';
    case MOBILE_MONEY = 'mobile_money';
    case BANK_TRANSFER = 'bank_transfer';

    public function label(): string
    {
        return match ($this) {
            self::CHARIOW => 'Chariow Pay (Mobile Money & Carte)',
            self::CARD => 'Carte Bancaire',
            self::CASH => 'Espèces',
            self::MOBILE_MONEY => 'Mobile Money (Wave / OM)',
            self::BANK_TRANSFER => 'Virement bancaire',
        };
    }
}
