const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../models');
require('dotenv').config();

async function createOrUpdateAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Admin credentials (CHANGE THESE!)
    const adminEmail = 'admin@techhub.com';
    const adminPassword = 'Admin123!';
    
    console.log('\n🔍 Checking for existing admin...');
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email: adminEmail } });
    
    if (existingUser) {
      console.log('👤 User found:', adminEmail);
      console.log('Current role:', existingUser.role);
      
      // Update to admin role
      await existingUser.update({ 
        role: 'admin',
        is_active: true 
      });
      
      console.log('\n✅ User updated to admin role!');
      console.log('📧 Email:', adminEmail);
      console.log('🔐 Password: (unchanged)');
      console.log('\n💡 You can now login with your existing password');
      
    } else {
      console.log('👤 No user found. Creating new admin...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create admin user
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true
      });
      
      console.log('\n✅ Admin user created successfully!');
      console.log('📧 Email:', adminEmail);
      console.log('🔐 Password:', adminPassword);
      console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    }
    
    // Show all users
    console.log('\n📋 All users:');
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'role', 'first_name', 'last_name', 'is_active']
    });
    console.table(allUsers.map(u => u.toJSON()));
    
    console.log('\n🎉 Done! You can now:');
    console.log('1. Logout from admin dashboard');
    console.log('2. Login with admin credentials');
    console.log('3. Access media management');
    console.log('4. Upload images! 🚀\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit();
  }
}

// Run the script
createOrUpdateAdmin();
