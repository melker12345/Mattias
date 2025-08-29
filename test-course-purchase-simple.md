# 🧪 Simple Course Purchase Test

## 🎯 **Quick Test Steps**

### **1. Test the Application**
1. **Start the server**: `npm run dev`
2. **Open browser**: Go to `http://localhost:3000`
3. **Register a company**: Go to `/register/company`
4. **Login as company admin**: Use the credentials you created
5. **Go to company dashboard**: `/dashboard/company`

### **2. Test Course Purchase**
1. **Click "Köp kurser för alla"** button
2. **Select a course** from the modal
3. **Choose "Köp för alla anställda"**
4. **Verify 15% discount** is applied
5. **Complete purchase**
6. **Check that employees** now have enrolled courses

### **3. Test Individual Purchase**
1. **Click "Visa detaljer"** for an employee
2. **Click "Köp kurser för [Name]"**
3. **Select individual purchase**
4. **Choose a course**
5. **Complete purchase**
6. **Verify only that employee** gets the course

## 🔧 **Expected Results**

### **✅ Success Indicators**
- Modal opens without errors
- Course selection works
- Price calculation is correct
- Purchase completes successfully
- Employees get enrolled in courses
- Dashboard updates after purchase

### **❌ Common Issues**
- Modal doesn't open → Check component import
- Course selection fails → Check API endpoint
- Purchase fails → Check database schema
- No enrollments created → Check API logic

## 🚀 **Ready to Test!**

The course purchase system should now be working. Try the steps above and let me know if you encounter any issues!



