# Manual DNS Setup Commands

Since the Porkbun API is returning 403 errors, here are the manual DNS records you can add through the Porkbun web interface:

## Go to: https://porkbun.com/account/domainsSpeedy

For each domain, add these DNS records:

---

## 1. prompt.fail
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)  
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=claube:aegntic@gmail.com

---

## 2. 4site.pro
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX  
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=projects:aegntic@gmail.com

---

## 3. aegntic.ai
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=human:aegntic@gmail.com

---

## 4. ae.ltd
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=human:aegntic@gmail.com

---

## 5. ultraplan.pro
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=vibe:aegntic@gmail.com

---

## 6. aegnt27.xyz
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=auth:aegntic@gmail.com

---

## 7. dailydoco.com
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=docs:aegntic@gmail.com

---

## 8. credability.pro
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=verify:aegntic@gmail.com

---

## 9. mattaecooper.org
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=human:aegntic@gmail.com

---

## 10. skool.food
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=chef:aegntic@gmail.com

---

## 11. 1minskool.com
**MX Records:**
- Name: (blank/root)
- Type: MX
- Content: mx1.forwardemail.net
- Priority: 10

- Name: (blank/root)
- Type: MX
- Content: mx2.forwardemail.net
- Priority: 20

**TXT Record:**
- Name: (blank/root)
- Type: TXT
- Content: forward-email=learn:aegntic@gmail.com

---

## Notes:
- Leave "Name" field blank or use "@" for root domain
- TTL can be left as default (usually 300 or 600)
- DNS propagation takes 5-10 minutes
- Test by sending emails to the custom addresses after propagation