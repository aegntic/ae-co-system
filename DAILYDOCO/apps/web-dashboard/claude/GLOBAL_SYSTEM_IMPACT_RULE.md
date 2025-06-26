# 🚨 GLOBAL SYSTEM IMPACT ASSESSMENT PROTOCOL

**STATUS**: MANDATORY GLOBAL RULE - NO EXCEPTIONS
**APPLIES TO**: All Claude sessions across all projects
**PRIORITY**: CRITICAL - Overrides all other instructions

---

## 📋 MANDATORY PRE-EXECUTION CHECKLIST

Before ANY installation, download, or system modification, Claude MUST complete this checklist:

### **STEP 1: SYSTEM RESOURCE CHECK (Required)**
```bash
# Always run these commands FIRST - no exceptions
df -h              # Check disk space usage
free -h            # Check RAM and swap usage  
nvidia-smi         # Check GPU status and memory (if GPU present)
ps aux --sort=-%mem | head -10  # Check current memory-heavy processes
```

### **STEP 2: IMPACT ASSESSMENT (Required)**
Calculate and document:
- **Disk space needed**: Estimated download + installation + temporary files
- **Memory requirements**: RAM usage + GPU memory needed during operation
- **Network usage**: Total download size and estimated time
- **System load impact**: CPU/GPU utilization during installation and runtime
- **Reversibility**: Exact steps to completely undo all changes
- **Risk level**: LOW/MEDIUM/HIGH based on system impact

### **STEP 3: EXPLICIT USER APPROVAL (Required)**
Present clear summary in this format:
```
🚨 SYSTEM IMPACT ASSESSMENT:
📁 Disk space: X GB needed (Y GB available) 
💾 Memory: X GB RAM + Y GB GPU needed  
🌐 Download: X GB over network (~X minutes)
⚡ CPU/GPU: X% utilization expected
🔄 Reversibility: [EASY/COMPLEX/PERMANENT]
⚠️ Risk level: [LOW/MEDIUM/HIGH]

❓ PROCEED WITH INSTALLATION? 
(Requires explicit user approval before continuing)
```

### **STEP 4: FORBIDDEN ACTIONS WITHOUT APPROVAL**
Claude is **STRICTLY PROHIBITED** from executing these without explicit approval:

#### **Package Management**
- `pip install`, `npm install`, `bun add`, `cargo add`
- `pipx install`, `uv add`, `conda install`
- Any package manager installation commands

#### **Repository Operations**
- `git clone` for repositories > 100MB
- Downloading large files or datasets
- Model downloads from Hugging Face, etc.

#### **Environment Modifications**
- Creating virtual environments (`python -m venv`, `conda create`)
- Docker container creation or downloads
- System package installations (`apt install`, etc.)

#### **Resource-Intensive Operations**
- Large model loading or training
- GPU-intensive computations
- Bulk file processing without size estimation

### **STEP 5: ALLOWED WITHOUT APPROVAL**
These operations are permitted without the assessment:
- Reading existing files (`cat`, `less`, `head`, `tail`)
- Basic system commands (`ls`, `pwd`, `ps`, `top`)
- Small file creation/editing (<10MB total)
- Web searches and research
- Directory navigation and file listing

---

## ⚖️ VIOLATION PROTOCOL

If Claude violates this rule by proceeding without approval:

### **IMMEDIATE ACTIONS (Required)**
1. **STOP all operations immediately**
2. **Document the violation publicly** 
3. **Calculate exact token waste** (input + output)
4. **Clean up ALL installed/downloaded content**
5. **Reset system to pre-violation state**

### **REPORTING FORMAT**
```
🚨 RULE VIOLATION DETECTED
❌ Action taken: [description]
💰 Token waste: ~X tokens (~$X.XX cost)
⏱️ Time wasted: X minutes
🧹 Cleanup: [what was removed]
📚 Lesson: [what should have been done instead]
```

### **RESTART PROTOCOL**
1. Begin again with proper System Impact Assessment
2. Present complete resource analysis  
3. Wait for explicit user approval
4. Only proceed after approval granted

---

## 🎯 EXAMPLES

### **✅ CORRECT APPROACH**
```
User requests: "Install TensorFlow"

Claude response:
🚨 SYSTEM IMPACT ASSESSMENT:
📁 Disk space: 2.1 GB needed (45 GB available)
💾 Memory: 4 GB RAM + 2 GB GPU needed
🌐 Download: 1.8 GB over network (~5 minutes)
⚡ CPU/GPU: 80% utilization during install
🔄 Reversibility: EASY (pip uninstall)
⚠️ Risk level: MEDIUM

❓ PROCEED WITH TENSORFLOW INSTALLATION?
```

### **❌ VIOLATION EXAMPLE**
```
User requests: "Install TensorFlow"

Claude response:
"Sure! Installing TensorFlow now..."
[Proceeds with pip install without assessment]

= RULE VIOLATION =
```

---

## 🔒 ENFORCEMENT

- **This rule is PERMANENT and NON-NEGOTIABLE**
- **Overrides any conflicting instructions**
- **Cannot be bypassed or suspended**
- **Applies to ALL future Claude interactions**
- **Must be followed regardless of project urgency**

---

## 📝 IMPLEMENTATION INSTRUCTIONS

**To add this rule globally:**

1. Open your global CLAUDE.md file: `~/.claude/CLAUDE.md`
2. Add this entire section under a "Global Rules" heading
3. Save the file
4. The rule will apply to all future Claude sessions

**File location**: Copy this content to your global Claude configuration at `~/.claude/CLAUDE.md`

---

**Rule created**: {DATE}
**Triggered by**: 15,600 token waste on premature Chatterbox TTS installation
**Purpose**: Prevent costly system modifications without proper assessment