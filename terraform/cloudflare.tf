terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "cloudflare_api_token" {
  description = "CloudFlare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "CloudFlare Zone ID"
  type        = string
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_zone_settings_override" "futinvest" {
  zone_id = var.cloudflare_zone_id
  settings {
    ssl                              = "strict"
    always_use_https                 = "on"
    min_tls_version                  = "1.2"
    tls_1_3                          = "on"
    security_level                   = "high"
    browser_check                    = "on"
    challenge_ttl                    = 1800
    email_obfuscation                = "on"
    server_side_exclude              = "on"
    hotlink_protection               = "off"
    automatic_https_rewrites         = "on"
    opportunistic_encryption         = "on"
    ip_geolocation                   = "on"
    brotli                           = "on"
    http3                            = "on"
    websocket                        = "on"
    pseudo_ipv4                      = "off"
    always_online                    = "off"
    development_mode                 = "off"
    waf                              = "on"
  }
}

# WAF Custom Rules
resource "cloudflare_ruleset" "futinvest_waf" {
  zone_id     = var.cloudflare_zone_id
  name        = "futinvest WAF Rules"
  description = "WAF custom rules for fut.invest"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action = "block"
    expression = "(ip.geoip.country in {'RU' 'CN' 'KP' 'IR' 'SY' 'CU' 'VE'})"
    description = "Bloquear países sancionados"
    enabled = true
  }

  rules {
    action = "block"
    expression = "(http.user_agent contains 'bot' and not http.user_agent contains 'Googlebot' and not http.user_agent contains 'BingPreview')"
    description = "Bloquear bots maliciosos"
    enabled = true
  }

  rules {
    action = "block"
    expression = "(cf.threat_score > 5)"
    description = "Bloquear amenazas basadas en threat score"
    enabled = true
  }

  rules {
    action = "managed_challenge"
    expression = "(http.request.uri.path contains \"/api/auth/login\" and ip.geoip.country ne \"US\" and ip.geoip.country ne \"PA\")"
    description = "Challenge en login desde fuera de US/PA"
    enabled = true
  }
}

# Rate Limiting
resource "cloudflare_ruleset" "futinvest_rate_limit" {
  zone_id     = var.cloudflare_zone_id
  name        = "futinvest Rate Limiting"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    action = "block"
    characteristics = ["cf.unique_visitor_id"]
    description = "Rate limit: 100 req/min por visitante"
    enabled = true
    ratelimit {
      characteristics = ["cf.unique_visitor_id"]
      period = 60
      requests_per_period = 100
      mitigation_timeout = 300
    }
  }
}

# DNS Records
resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  type    = "A"
  value   = "192.0.2.1"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = "app"
  type    = "A"
  value   = "192.0.2.2"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "CNAME"
  value   = "app.futinvest.io"
  proxied = true
  ttl     = 1
}
