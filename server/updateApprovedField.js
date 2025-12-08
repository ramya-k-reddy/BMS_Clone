const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookmyshow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateUsersWithApprovalField = async () => {
  try {
    console.log('Updating users without approved field...');
    
    // Update all users without the approved field
    const result = await User.updateMany(
      { approved: { $exists: false } },
      [
        {
          $set: {
            approved: {
              $cond: {
                if: { $eq: ["$role", "partner"] },
                then: false,
                else: true
              }
            }
          }
        }
      ]
    );
    
    console.log(`Updated ${result.modifiedCount} users with approved field`);
    
    // Show current partner users
    const partners = await User.find({ role: 'partner' }, 'name email role approved');
    console.log('Current partner users:', partners);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
};

updateUsersWithApprovalField();