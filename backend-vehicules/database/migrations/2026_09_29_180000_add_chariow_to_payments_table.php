<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                // Change payment_method to string to allow extensible methods (chariow, etc.)
                $table->string('payment_method', 50)->change();
                
                if (!Schema::hasColumn('payments', 'chariow_sale_id')) {
                    $table->string('chariow_sale_id')->nullable()->after('transaction_id');
                }
                
                if (!Schema::hasColumn('payments', 'chariow_checkout_url')) {
                    $table->text('chariow_checkout_url')->nullable()->after('chariow_sale_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (Schema::hasColumn('payments', 'chariow_checkout_url')) {
                    $table->dropColumn('chariow_checkout_url');
                }
                if (Schema::hasColumn('payments', 'chariow_sale_id')) {
                    $table->dropColumn('chariow_sale_id');
                }
            });
        }
    }
};
