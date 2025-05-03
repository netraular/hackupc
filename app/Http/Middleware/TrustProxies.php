<?php
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Fideloper\Proxy\TrustProxies as Middleware;

class TrustProxies extends Middleware
{
    protected $proxies = '*'; // Confía en todos los proxies (ideal para túneles en desarrollo)

    protected $headers = Request::HEADER_X_FORWARDED_ALL;
}
