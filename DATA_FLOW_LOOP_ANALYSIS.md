# 🔄 DATA FLOW & LOOP INTEGRITY MAP

**Hajri Construction Management System**  
**Generated:** February 6, 2026

---

## 📊 MASTER DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTIONS                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dashboard.tsx ◄──────────┐                                     │
│  Workers.tsx              │                                      │
│  DailyEntry.tsx           │  Real-time Sync                     │
│  WorkerProfile.tsx        │                                      │
│  Estimates.tsx            │                                      │
│  Expenses.tsx             │                                      │
│  ClientLedger.tsx         │                                      │
│                           │                                      │
└───────────┬───────────────┴──────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ProjectContext  ──→  selectedProjectId                         │
│  AuthContext     ──→  user, session                             │
│  ThemeContext    ──→  branding, appearance                      │
│                                                                  │
│  Local State (useState):                                         │
│  ├─ workers[]                                                    │
│  ├─ attendanceMap{}                                              │
│  ├─ financialData{}                                              │
│  └─ monthlyStats[]                                               │
│                                                                  │
└───────────┬──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLIENT                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  supabase.from('workers').select()                              │
│  supabase.from('attendance').insert()                           │
│  supabase.from('estimates').select()                            │
│  supabase.rpc('get_monthly_labor_stats')  ◄── DB Function       │
│                                                                  │
└───────────┬──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────────┐     ┌───────────┐           │
│  │ workers  │────▶│  attendance  │────▶│ payments  │           │
│  └──────────┘     └──────────────┘     └───────────┘           │
│       │                   │                                      │
│       │                   │                                      │
│  ┌────▼─────┐     ┌──────▼──────┐     ┌───────────┐           │
│  │ projects │     │  expenses   │     │ estimates │           │
│  └──────────┘     └─────────────┘     └─────┬─────┘           │
│                                              │                  │
│                                     ┌────────▼────────┐         │
│                                     │ estimate_items  │         │
│                                     └─────────────────┘         │
│                                                                  │
│  Functions:                                                      │
│  └─ get_monthly_labor_stats() ──→ Aggregated data              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔁 CRITICAL LOOPS ANALYSIS

### **Loop 1: Dashboard Financial Synergy** ✅
```
User Opens Dashboard
    │
    ▼
fetchData() triggered (useEffect)
    │
    ├─→ Fetch workers (active)
    ├─→ Fetch attendance (selected date)
    ├─→ Fetch estimates (all)
    ├─→ Fetch all attendance (for labor cost)
    ├─→ Fetch expenses (all)
    └─→ Fetch client_ledger (all)
    │
    ▼
Parallel Promise.all() ──→ 6 queries in parallel
    │
    ▼
Process Results:
    ├─→ wageMap = new Map(workers)
    ├─→ attendanceMap = {}
    ├─→ totalBudget = reduce(estimates)
    ├─→ laborCost = forEach(attendance)  ⚠️ Could optimize
    ├─→ materialCost = reduce(expenses)
    └─→ totalBilled/Received = forEach(ledger)
    │
    ▼
setFinancialData() ──→ State update
    │
    ▼
useMemo(stats) recalculates ──→ UI renders
    │
    ▼
User sees updated dashboard ✅
```

**Status:** ✅ Healthy  
**Optimization:** ⚠️ Replace forEach with reduce (lines 158-169)

---

### **Loop 2: Workers Page Real-time Update** ✅
```
User changes Hajri count
    │
    ▼
handleUpdate(workerId, 'hajri_count', newValue)
    │
    ├─→ Calculate old cost = oldHajri * wage
    ├─→ Calculate new cost = newHajri * wage
    └─→ costDifference = newCost - oldCost
    │
    ▼
Optimistic Update (immediate UI feedback)
    ├─→ setAttendanceMap(updated record)
    └─→ setSavingMap(workerId: true)
    │
    ▼
Database Update (async)
    ├─→ Check if record exists
    ├─→ UPDATE or INSERT attendance
    └─→ Get real ID from database
    │
    ▼
Real-time Monthly Stats Sync
    ├─→ Find current month in monthlyStats[]
    ├─→ Update amount += costDifference  ✅ Fixed index access
    └─→ setMonthlyStats(updated array)
    │
    ▼
UI reflects changes ✅
```

**Status:** ✅ Healthy  
**Recent Fix:** ✅ Added null check for array index access

---

### **Loop 3: Monthly Labor Stats (Database-side)** ✅
```
Workers Page Loads
    │
    ▼
fetchData() called
    │
    ▼
supabase.rpc('get_monthly_labor_stats')
    │
    ▼
PostgreSQL Function Executes:
    SELECT 
        TO_CHAR(DATE_TRUNC('month', a.date), 'FMMonth YYYY'),
        SUM(a.hajri_count * w.daily_wage)
    FROM attendance a
    INNER JOIN workers w ON a.worker_id = w.id
    GROUP BY DATE_TRUNC('month', a.date)
    ORDER BY DATE_TRUNC('month', a.date) DESC
    │
    ▼
Aggregated data returned ──→ setMonthlyStats()
    │
    ▼
UI renders monthly cards ✅
```

**Status:** ✅ **EXCELLENT** - Scalable to millions of records  
**Performance:** Database aggregation >> Client-side

---

### **Loop 4: WorkerProfile Attendance Grid** ✅
```
User navigates to /workers/:id
    │
    ▼
fetchData() triggered
    │
    ├─→ Fetch worker details (single)
    └─→ Fetch attendance (current month)
    │
    ▼
useMemo(summary) calculates:
    ├─→ totalHajris = reduce(attendance)  ✅ Typed
    ├─→ totalKharchi = reduce(attendance)  ✅ Typed
    └─→ netPayable = (hajris * wage) - kharchi
    │
    ▼
useMemo(attendanceGrid) generates:
    ├─→ eachDayOfInterval(month)
    └─→ map(date => {
            find attendance record
            calculate daily earning
            format hajri display
        })
    │
    ▼
Render 30-31 day grid ✅
```

**Status:** ✅ Healthy  
**Optimization:** ✅ Memoized, no unnecessary recalculations

---

## ⚠️ LOOPS NEEDING ATTENTION

### **Issue 1: Dashboard Budget Calculation**
```typescript
// Line 123-129 in Dashboard.tsx
totalBudget = allEstimates.reduce((acc, est) => {
    const items = est.estimate_items
    if (!Array.isArray(items)) return acc
    
    const estTotal = items.reduce((sum: number, item: any) => 
        sum + (item.amount || 0), 0)  // ⚠️ any type
    return acc + estTotal
}, 0)
```

**Problem:** Nested reduce with `any` type  
**Fix:**
```typescript
interface EstimateWithItems {
    estimate_items: { amount: number }[]
}

totalBudget = allEstimates.reduce((acc, est: EstimateWithItems) => {
    const estTotal = est.estimate_items.reduce(
        (sum, item) => sum + item.amount, 0
    )
    return acc + estTotal
}, 0)
```

---

### **Issue 2: Dashboard Labor Cost Calculation**
```typescript
// Line 158-169 in Dashboard.tsx
allAttendanceRes.data.forEach((rec: any) => {  // ⚠️ any type
    const wWage = wageMap.get(rec.worker_id) || 0
    const cost = (rec.hajri_count || 0) * wWage
    
    laborCost += cost
    
    if (rec.date >= currentMonthStart && rec.date < currentMonthEnd) {
        monthlyLaborCost += cost
    }
})
```

**Problem:** Using forEach with mutation, `any` type  
**Fix:**
```typescript
interface AttendanceWithCost {
    worker_id: string
    hajri_count: number
    date: string
}

const { laborCost, monthlyLaborCost } = 
    allAttendanceRes.data.reduce((acc, rec: AttendanceWithCost) => {
        const wage = wageMap.get(rec.worker_id) || 0
        const cost = rec.hajri_count * wage
        
        return {
            laborCost: acc.laborCost + cost,
            monthlyLaborCost: acc.monthlyLaborCost + 
                (rec.date >= currentMonthStart ? cost : 0)
        }
    }, { laborCost: 0, monthlyLaborCost: 0 })
```

---

## 🎯 LOOP HEALTH SUMMARY

| Loop | Location | Status | Priority |
|------|----------|--------|----------|
| Financial Synergy | Dashboard.tsx:62-200 | ✅ Good | - |
| Real-time Stats | Workers.tsx:81-160 | ✅ Excellent | - |
| Monthly Aggregation | Database Function | ✅ Excellent | - |
| Attendance Grid | WorkerProfile.tsx:60-107 | ✅ Good | - |
| Budget Calculation | Dashboard.tsx:123-129 | ⚠️ Needs typing | 🟡 Medium |
| Labor Cost Calc | Dashboard.tsx:158-169 | ⚠️ Needs refactor | 🟡 Medium |
| Expense Breakdown | Reports.tsx:56-62 | ⚠️ Needs typing | 🟢 Low |
| Ledger Totals | ClientLedger.tsx:118-119 | ⚠️ Could combine | 🟢 Low |

---

## 📈 PERFORMANCE METRICS

### **Database Queries per Page Load:**

| Page | Queries | Parallel | Status |
|------|---------|----------|--------|
| Dashboard | 6 | ✅ Yes | ✅ Optimized |
| Workers | 2 + 1 RPC | ✅ Yes | ✅ Optimized |
| WorkerProfile | 2 | ✅ Yes | ✅ Good |
| Estimates | 2 | ✅ Yes | ✅ Good |
| ClientLedger | 1 | N/A | ✅ Good |

### **Re-render Optimization:**

| Component | useMemo | useCallback | Status |
|-----------|---------|-------------|--------|
| Dashboard | 2 | 1 | ✅ Optimized |
| Workers | 1 | 1 | ✅ Optimized |
| WorkerProfile | 2 | 1 | ✅ Optimized |
| ClientLedger | 2 | 0 | ✅ Good |

---

## 🔐 DATA INTEGRITY CHECKS

### **Referential Integrity:**
```
workers.id ←── attendance.worker_id  ✅ ON DELETE CASCADE
workers.id ←── payments.worker_id    ✅ ON DELETE CASCADE
estimates.id ←── estimate_items.estimate_id  ✅ CASCADE
projects.id ←── workers.project_id   ✅ SET NULL
```

### **Data Validation:**
- ✅ hajri_count: 0, 0.5, 1, 1.5, 2
- ✅ status: 'Present' | 'Absent'
- ✅ daily_wage: >= 0
- ⚠️ No Zod schemas (recommended)

---

## 🎯 RECOMMENDATIONS

### **Immediate (This Week):**
1. ✅ Fix nested reduce types in Dashboard
2. ✅ Replace forEach with reduce for labor cost
3. ✅ Add type guards for API responses

### **Short-term (This Month):**
4. Add Zod validation schemas
5. Implement virtual scrolling for large lists
6. Add database indexes for common queries

### **Long-term (Next Quarter):**
7. Consider GraphQL for complex queries
8. Implement caching layer (Redis)
9. Add real-time subscriptions (Supabase Realtime)

---

**Conclusion:** Your data flow architecture is solid! Just a few type safety improvements and you'll have a production-grade system. 🚀
