# 📧 Multi-Domain Email Verification Guide

## ✅ **Complete Domain Portfolio** (12 Domains)
1. **prompt.fail** → claube@prompt.fail (AI prompt engineering)
2. **4site.pro** → projects@4site.pro (Professional web development)  
3. **aegntic.com** → info@aegntic.com (Main Aegntic platform)
4. **aegntic.ai** → human@aegntic.ai (AI platform communications)
5. **ae.ltd** → human@ae.ltd (Corporate communications)
6. **ultraplan.pro** → vibe@ultraplan.pro (Strategic planning tools)
7. **aegnt27.xyz** → auth@aegnt27.xyz (Human authenticity protocols)
8. **dailydoco.com** → docs@dailydoco.com (Documentation platform)
9. **credability.pro** → verify@credability.pro (Credibility verification)
10. **mattaecooper.org** → human@mattaecooper.org (Personal brand)
11. **skool.food** → chef@skool.food (Food education platform)
12. **1minskool.com** → learn@1minskool.com (Quick learning platform)

---

## 🔧 **Step 1: Domain Email Forwarding Setup**

For **EACH domain**, set up email forwarding to **aegntic@gmail.com**:

### **Porkbun DNS Method** (Recommended - You have API access)
```bash
# Use your existing Porkbun MCP tools to set up email forwarding
# For each domain, create email forwarding rules:

# Example for prompt.fail:
claube@prompt.fail → aegntic@gmail.com
contact@prompt.fail → aegntic@gmail.com
info@prompt.fail → aegntic@gmail.com
```

### **Manual DNS Setup** (Alternative)
**MX Records** (Priority 10):
- `mx1.forwardemail.net`
- `mx2.forwardemail.net`

**TXT Record**:
```
forward-email=aegntic@gmail.com
```

---

## 📨 **Step 2: Gmail Send As Verification Process**

### **Automatic Setup Process:**
1. **Navigate**: Gmail Settings → Accounts and Import
2. **Add Each Address**: Click "Add another email address"
3. **Fill Details**:
   - **Name**: See display names in config
   - **Email**: Use domain-specific emails
   - **Reply-to**: Same as email address

### **SMTP Configuration** (For Each Domain):
```
SMTP Server: smtp.gmail.com
Port: 587
Username: aegntic@gmail.com  
Password: AEp@ssWrd11:11
Security: TLS/STARTTLS
```

### **Verification Steps**:
1. **Add Address** → Gmail sends verification email
2. **Check Forwarded Email** → Verification arrives in aegntic@gmail.com
3. **Click Verification Link** → Address becomes active
4. **Repeat for All 12 Domains**

---

## 🏷️ **Step 3: Gmail Filter Creation**

### **Automated Filter Setup**:
For each domain, create filters that:

**Filter Criteria**: `to:email@domain.com`  
**Actions**: 
- Apply label: `Domain-[domain.com]`
- Never send to spam
- Mark as important

### **Example Filters**:
```
to:claube@prompt.fail → Label: Domain-prompt.fail
to:projects@4site.pro → Label: Domain-4site.pro
to:info@aegntic.com → Label: Domain-aegntic.com
to:human@aegntic.ai → Label: Domain-aegntic.ai  
to:human@ae.ltd → Label: Domain-ae.ltd
to:vibe@ultraplan.pro → Label: Domain-ultraplan.pro
to:auth@aegnt27.xyz → Label: Domain-aegnt27.xyz
to:docs@dailydoco.com → Label: Domain-dailydoco.com
to:verify@credability.pro → Label: Domain-credability.pro
to:human@mattaecooper.org → Label: Domain-mattaecooper.org
to:chef@skool.food → Label: Domain-skool.food
to:learn@1minskool.com → Label: Domain-1minskool.com
```

---

## 🚀 **Step 4: Automated Testing Process**

### **Verification Test Script**:
```bash
# Test each domain by sending emails
for domain in prompt.fail 4site.pro aegntic.com aegntic.ai ae.ltd ultraplan.pro aegnt27.xyz dailydoco.com credability.pro mattaecooper.org skool.food 1minskool.com; do
  echo "Testing $domain..."
  # Send test email from Gmail using Send As
  # Verify it arrives with correct label
done
```

---

## ⚡ **Quick Verification Checklist**

### **Domain Forwarding** ✅
- [ ] prompt.fail forwarding active
- [ ] 4site.pro forwarding active  
- [ ] aegntic.com forwarding active
- [ ] aegntic.ai forwarding active
- [ ] ae.ltd forwarding active
- [ ] ultraplan.pro forwarding active
- [ ] aegnt27.xyz forwarding active
- [ ] dailydoco.com forwarding active
- [ ] credability.pro forwarding active
- [ ] mattaecooper.org forwarding active
- [ ] skool.food forwarding active
- [ ] 1minskool.com forwarding active

### **Gmail Send As** ✅
- [ ] All 12 addresses added to Gmail
- [ ] All 12 addresses verified via email
- [ ] SMTP configuration working
- [ ] Test emails sent successfully

### **Gmail Filters** ✅  
- [ ] 12 domain filters created
- [ ] 12 domain labels active
- [ ] Automatic sorting working
- [ ] No emails going to spam

---

## 🎯 **Final Result**

Once complete, you'll have:
- **12 verified Send As addresses** in Gmail
- **Automatic domain-based inbox organization**
- **Professional email signatures** for each brand
- **Seamless multi-domain email management**
- **All within Gmail's 99 Send As limit** (12/99 = 12% used)

Each domain email will automatically forward to your Gmail, be labeled appropriately, and you can send from any domain with the correct branding and reply-to address.