# 🧪 Course Purchase System Test Guide

## 🎯 **Test Scenarios**

### **1. Individual Course Purchase**
1. **Login as Company Admin**
   - Go to `/dashboard/company`
   - Verify you can see the employee list

2. **Purchase Courses for Specific Employee**
   - Click "Visa detaljer" for an employee with no courses
   - Click "Köp kurser för [Employee Name]"
   - Select individual purchase type
   - Choose 1-2 courses
   - Verify price calculation
   - Complete purchase
   - Verify employee now has enrolled courses

### **2. Bulk Course Purchase**
1. **Purchase for All Employees**
   - Click "Köp kurser för alla" button
   - Select bulk purchase type
   - Choose 1-2 courses
   - Verify 15% bulk discount is applied
   - Complete purchase
   - Verify all employees now have enrolled courses

### **3. Price Calculation**
1. **Individual Purchase**
   - Select 2 courses: 995 SEK + 1,295 SEK = 2,290 SEK
   - Verify total shows 2,290 SEK

2. **Bulk Purchase**
   - Select same 2 courses: 2,290 SEK
   - Verify 15% discount: 2,290 * 0.15 = 343.5 SEK
   - Verify final price: 2,290 - 343.5 = 1,946.5 SEK

### **4. Invoice Generation**
1. **Check Invoice Creation**
   - After purchase, verify invoice is created
   - Check invoice number format: `INV-COURSE-[timestamp]-[random]`
   - Verify invoice amount matches final price
   - Verify invoice items are correct

### **5. Enrollment Verification**
1. **Check Employee Dashboard**
   - Login as employee
   - Go to `/dashboard`
   - Verify enrolled courses appear
   - Verify course progress is tracked

## 🔧 **Technical Verification**

### **Database Checks**
```sql
-- Check course purchases
SELECT * FROM CoursePurchase ORDER BY purchasedAt DESC LIMIT 5;

-- Check enrollments
SELECT * FROM Enrollment ORDER BY enrolledAt DESC LIMIT 10;

-- Check invoices
SELECT * FROM Invoice WHERE invoiceNumber LIKE 'INV-COURSE-%' ORDER BY createdAt DESC LIMIT 5;

-- Check invoice items
SELECT * FROM InvoiceItem WHERE invoiceId IN (
  SELECT id FROM Invoice WHERE invoiceNumber LIKE 'INV-COURSE-%'
);
```

### **API Endpoint Tests**
```bash
# Test course purchase API
curl -X POST http://localhost:3000/api/companies/course-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company_id_here",
    "courseIds": ["course_id_1", "course_id_2"],
    "purchaseType": "individual",
    "employeeId": "employee_id_here"
  }'

# Test bulk purchase
curl -X POST http://localhost:3000/api/companies/course-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company_id_here",
    "courseIds": ["course_id_1", "course_id_2"],
    "purchaseType": "bulk"
  }'
```

## 🐛 **Common Issues & Solutions**

### **1. Modal Not Opening**
- Check if `CoursePurchaseModal` component is imported
- Verify `coursePurchaseModal` state is properly managed
- Check browser console for errors

### **2. Course Selection Not Working**
- Verify courses are being fetched from `/api/courses`
- Check if course IDs are being passed correctly
- Verify checkbox state management

### **3. Purchase Failing**
- Check if company ID is being passed correctly
- Verify employee exists and belongs to company
- Check database constraints and relationships

### **4. Price Calculation Errors**
- Verify course prices are stored as numbers (not strings)
- Check bulk discount calculation logic
- Verify currency formatting

### **5. Enrollment Not Creating**
- Check if `CoursePurchase` record is created first
- Verify `Enrollment` records reference correct `coursePurchaseId`
- Check database foreign key constraints

## 📊 **Expected Results**

### **Individual Purchase**
- ✅ Modal opens with employee name
- ✅ Individual purchase type selected by default
- ✅ Course selection works
- ✅ Price calculation correct
- ✅ Purchase creates enrollment for specific employee
- ✅ Invoice generated with correct amount

### **Bulk Purchase**
- ✅ Modal opens without employee name
- ✅ Bulk purchase type available
- ✅ 15% discount applied
- ✅ Purchase creates enrollments for all employees
- ✅ Invoice generated with discounted amount

### **Database Records**
- ✅ `CoursePurchase` record created
- ✅ `Enrollment` records created for each employee/course
- ✅ `Invoice` record created
- ✅ `InvoiceItem` records created for each course

## 🚀 **Next Steps After Testing**

1. **Payment Integration**
   - Connect to Stripe for actual payment processing
   - Add payment status tracking
   - Implement payment webhooks

2. **Email Notifications**
   - Send confirmation emails to company admin
   - Notify employees of new course enrollments
   - Send invoice emails

3. **Advanced Features**
   - Course expiration dates
   - Progress tracking
   - Certificate generation
   - Reporting and analytics



