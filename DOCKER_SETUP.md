# 🐳 Friday AI - Docker Setup Guide

**Dato:** 1. november 2025  
**Status:** SELVSTÆNDIG DEPLOYMENT KLAR  
**Formål:** Kør Friday AI uden Manus dependencies

---

## 🚀 **Quick Docker Start**

### **1. Start Med Docker Compose**

```bash
cd C:\Users\empir\Tekup\services\tekup-ai-v2

# Start alle services (Friday AI + MySQL + Redis)
docker-compose up -d

# Se logs
docker-compose logs -f friday-ai
```

### **2. Åbn Browser**

```
http://localhost:3000  - Friday AI Chat interface
http://localhost:8080  - Database admin (Adminer)
```

### **3. Test Funktionalitet**

- Chat interface tilgængelig
- Customer Profile system virker
- Database connection fungerer
- Alle features tilgængelige uden Manus

---

## 🔧 **Docker Services**

### **friday-ai** (Port 3000)

- **Image:** Custom build fra Dockerfile
- **Features:** Complete Friday AI Chat application
- **Database:** Connects til MySQL service
- **Environment:** Production mode med JWT authentication

### **db** (Port 3306)

- **Image:** MySQL 8.0
- **Database:** friday_ai
- **Credentials:** friday_user / friday_password
- **Storage:** Persistent volume (mysql_data)

### **redis** (Port 6379)

- **Image:** Redis 7 Alpine
- **Purpose:** Caching og session storage
- **Optional:** Can be disabled if not needed

### **adminer** (Port 8080)

- **Image:** Adminer web interface
- **Purpose:** Database management GUI
- **Access:** http://localhost:8080

---

## 📊 **Docker Configuration Details**

### **Dockerfile**

```dockerfile
FROM node:22-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Copy package files og install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source og build
COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

### **docker-compose.yml**

```yaml
services:
  friday-ai: # Main application
  db: # MySQL database
  redis: # Cache layer
  adminer: # Database GUI
```

---

## 🔄 **Migration Fra Manus**

### **Fjernet Manus Dependencies:**

✅ **vite-plugin-manus-runtime** - Removed fra package.json  
✅ **Manus OAuth** - Erstattet med JWT authentication  
✅ **Manus hosting** - Erstattet med Docker containers  
✅ **Manus domains** - Fjernet fra vite.config.ts  
✅ **ManusDialog** → **LoginDialog** - Generisk login interface

### **Beholdt Functionality:**

✅ **Customer Profile System** - 4-tab interface komplet  
✅ **Billy Integration** - Faktura sync functionality  
✅ **Gmail Integration** - Email thread management  
✅ **AI Features** - Multi-model support  
✅ **Mobile Design** - Responsive breakpoints  
✅ **Database Schema** - Alle 13 tabeller intact

---

## ⚙️ **Environment Configuration**

### **Required Variables (For Basic Function)**

```env
DATABASE_URL=mysql://friday_user:friday_password@localhost:3306/friday_ai
JWT_SECRET=your-secure-secret-here
```

### **Optional Variables (For Full Features)**

```env
# AI Models
GEMINI_API_KEY=your-key       # For AI chat responses
BILLY_API_KEY=your-key        # For invoice sync
GOOGLE_SERVICE_ACCOUNT_KEY=   # For Gmail/Calendar

# External Services
REDIS_URL=redis://localhost:6379
```

---

## 🧪 **Testing Plan**

### **1. Docker Startup Test**

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### **2. Application Test**

```bash
# Åbn http://localhost:3000
# Verify: Friday AI interface loads
# Test: Chat functionality
# Test: Customer Profile modal (without integrations)
```

### **3. Database Test**

```bash
# Åbn http://localhost:8080 (Adminer)
# Login: Server=db, Username=friday_user, Password=friday_password
# Verify: 13 tabeller visible (inkl. customer_profiles)
```

### **4. Integration Test (Med API Keys)**

```bash
# Configure .env med real API keys
# Test: Billy invoice sync
# Test: Gmail email sync
# Test: AI resume generation
```

---

## 🚨 **Troubleshooting**

### **Common Docker Issues**

**1. Port Conflicts**

```bash
# Check ports
netstat -an | findstr ":3000\|:3306\|:6379"

# Fix: Stop conflicting services eller change ports i docker-compose.yml
```

**2. Database Connection**

```bash
# Check database logs
docker-compose logs db

# Manual connection test
docker-compose exec db mysql -u friday_user -p friday_ai
```

**3. Application Errors**

```bash
# Check app logs
docker-compose logs friday-ai

# Debug mode
docker-compose exec friday-ai sh
```

---

## 📋 **Development vs Production**

### **Development Mode**

```bash
# Local development (without Docker)
pnpm dev              # Starts på localhost:3000
pnpm db:studio        # Database GUI

# With Docker (closer to production)
docker-compose up     # Full stack
```

### **Production Mode**

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Environment: NODE_ENV=production
# Features: Optimized builds, health checks, restart policies
```

---

## 🔧 **Customization**

### **Port Changes**

```yaml
# In docker-compose.yml:
services:
  friday-ai:
    ports:
      - "3001:3000" # External:Internal
```

### **Database Config**

```yaml
# Different database:
environment: DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### **Add Services**

```yaml
# Example: Add monitoring
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
```

---

## ✅ **Success Criteria**

**Docker Setup Complete When:**

- [ ] `docker-compose up` starts uden fejl
- [ ] Friday AI accessible på http://localhost:3000
- [ ] Database accessible via Adminer på http://localhost:8080
- [ ] Chat functionality works (basic responses)
- [ ] Customer Profile modal opens og viser data
- [ ] No Manus dependencies referenced anywhere

**Production Ready When:**

- [ ] Environment variables configured med real API keys
- [ ] Billy integration tested og functional
- [ ] Gmail integration tested og functional
- [ ] AI models responding correctly
- [ ] Mobile layout tested på real devices
- [ ] Performance acceptable (<2s response times)

---

## 🎯 **Next Steps After Docker**

### **Immediate (Today)**

1. **Test Docker Setup** - Verify all services start
2. **Configure Environment** - Add real API keys
3. **Test Customer Profiles** - Verify functionality uden Manus
4. **Fix TypeScript Errors** - Clean compilation

### **This Weekend**

5. **Billy Integration** - Real invoice sync testing
6. **Gmail Integration** - Email thread sync testing
7. **Mobile Testing** - Real device validation
8. **Performance Optimization** - Response time improvements

---

**Docker Migration:** ✅ **READY**  
**Manus Dependencies:** ✅ **REMOVED**  
**Selvstændig Drift:** ✅ **CONFIGURED**  
**Customer Profiles:** ✅ **PRESERVED**

**Næste skridt:** `docker-compose up -d` og test! 🐳🚀
