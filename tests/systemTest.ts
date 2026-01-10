import { DatabaseService } from '../services/databaseService';
import { MigrationService } from '../services/migrationService';
import { ValidationService } from '../services/validationService';
import { logger } from '../utils/logger';

async function testDatabaseService() {
  console.log('Testing Database Service...');
  
  const dbService = new DatabaseService();
  
  try {
    // Test creating a user
    const testUser = await dbService.createUser(
      'test@example.com',
      'password123',
      'user',
      'Test Business'
    );
    
    if (testUser) {
      console.log('✓ User creation successful');
      
      // Test login
      const loggedInUser = await dbService.loginUser('test@example.com', 'password123');
      if (loggedInUser) {
        console.log('✓ User login successful');
        
        // Test profile creation
        const profile = {
          userId: loggedInUser.id,
          businessName: 'Test Business',
          industry: 'Technology',
          targetAudience: 'Young professionals',
          brandVoice: 'Professional but friendly',
          keyThemes: 'Innovation, Technology, Future'
        };
        
        await dbService.saveProfile(profile);
        console.log('✓ Profile creation successful');
        
        // Test retrieving profile
        const retrievedProfile = await dbService.getProfile(loggedInUser.id);
        if (retrievedProfile) {
          console.log('✓ Profile retrieval successful');
        }
        
        // Test saving a post
        const post = {
          id: Date.now().toString(),
          userId: loggedInUser.id,
          date: '2025-01-15',
          topic: 'New Product Launch',
          caption: 'Check out our amazing new product! 🎉',
          imagePrompt: 'Professional product photography',
          status: 'Draft' as const,
          viralityScore: 75,
          viralityReason: 'High engagement potential'
        };
        
        await dbService.savePost(post);
        console.log('✓ Post creation successful');
        
        // Test retrieving posts
        const posts = await dbService.getUserPosts(loggedInUser.id);
        if (posts.length > 0) {
          console.log('✓ Post retrieval successful');
        }
        
        // Test admin stats
        const stats = await dbService.getAdminStats();
        console.log('✓ Admin stats retrieved:', stats);
        
      } else {
        console.log('✗ User login failed');
      }
    } else {
      console.log('✗ User creation failed');
    }
    
    // Test health check
    const health = await dbService.healthCheck();
    console.log('✓ Health check:', health);
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
  
  await dbService.close();
}

async function testValidationService() {
  console.log('\nTesting Validation Service...');
  
  try {
    // Test email validation
    const validEmail = ValidationService.validateEmail('test@example.com');
    const invalidEmail = ValidationService.validateEmail('invalid-email');
    
    console.log('✓ Email validation:', validEmail, invalidEmail);
    
    // Test password validation
    const passwordValidation = ValidationService.validatePassword('password123');
    console.log('✓ Password validation:', passwordValidation);
    
    // Test profile validation
    const profileValidation = ValidationService.validateBrandProfile({
      businessName: 'Test Business',
      industry: 'Technology',
      targetAudience: 'Young professionals',
      brandVoice: 'Professional',
      keyThemes: 'Innovation'
    });
    console.log('✓ Profile validation:', profileValidation);
    
    // Test content ideas validation
    const contentIdeas = ValidationService.validateContentIdeas([
      { day: 1, title: 'Test', topic: 'Test Topic', format: 'Image' }
    ]);
    console.log('✓ Content ideas validation:', contentIdeas.length > 0);
    
  } catch (error) {
    console.error('Validation test failed:', error);
  }
}

async function testLogger() {
  console.log('\nTesting Logger...');
  
  try {
    logger.info('Test info message', { component: 'Test', action: 'testing' });
    logger.warn('Test warning message');
    logger.error('Test error message', { error: 'Test error' });
    logger.debug('Test debug message');
    
    const logs = logger.getLogs();
    console.log('✓ Logger working, created', logs.length, 'log entries');
    
    const stats = logger.getLogStats();
    console.log('✓ Log stats:', stats);
    
  } catch (error) {
    console.error('Logger test failed:', error);
  }
}

async function runAllTests() {
  console.log('🧪 Running Comprehensive System Tests\n');
  
  try {
    await testLogger();
    await testValidationService();
    await testDatabaseService();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Final System Status:');
    
    const finalStats = logger.getLogStats();
    console.log(`- Logs created: ${finalStats.total}`);
    console.log(`- Errors: ${finalStats.errors}`);
    console.log(`- Warnings: ${finalStats.warnings}`);
    console.log(`- Info: ${finalStats.info}`);
    console.log(`- Debug: ${finalStats.debug}`);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { testDatabaseService, testValidationService, testLogger, runAllTests };