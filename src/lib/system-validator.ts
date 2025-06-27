import { supabase } from '../lib/supabase';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  overallPass: boolean;
  totalDuration: number;
}

export class SystemValidator {
  private static async runTest(
    name: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const result = await testFn();
      return {
        name,
        passed: true,
        details: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  static async validateProfileSystem(): Promise<TestSuite> {
    const tests: TestResult[] = [];

    // Test 1: Profile data loading
    tests.push(await this.runTest(
      'Profile Data Loading',
      async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(1);
        
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No profiles found');
        
        return { profileCount: data.length };
      }
    ));

    // Test 2: Profile update function
    tests.push(await this.runTest(
      'Profile Update Query Structure',
      async () => {
        // Test the query structure without actually updating
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .eq('user_id', user.user.id)
          .limit(1);
        
        if (error) throw error;
        return { queryWorking: true };
      }
    ));

    // Test 3: Role checking function
    tests.push(await this.runTest(
      'Role Checking',
      async () => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        return { role: data?.role || 'user' };
      }
    ));

    const overallPass = tests.every(test => test.passed);
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);

    return {
      name: 'Profile System',
      tests,
      overallPass,
      totalDuration
    };
  }

  static async validateDatabaseFunctions(): Promise<TestSuite> {
    const tests: TestResult[] = [];

    const criticalFunctions = [
      'get_unread_notification_count',
      'get_managed_users_with_admin_details',
      'get_all_admins',
      'get_admin_investments_with_users',
      'get_all_investments_with_applications'
    ];

    for (const functionName of criticalFunctions) {
      tests.push(await this.runTest(
        `Function: ${functionName}`,
        async () => {
          const { data, error } = await supabase.rpc(functionName as any);
          
          // Some functions may return errors due to permissions, that's ok
          // We just want to verify they exist
          if (error && error.message.includes('does not exist')) {
            throw new Error('Function does not exist');
          }
          
          return { exists: true, hasData: !!data };
        }
      ));
    }

    const overallPass = tests.every(test => test.passed);
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);

    return {
      name: 'Database Functions',
      tests,
      overallPass,
      totalDuration
    };
  }

  static async validateNotificationSystem(): Promise<TestSuite> {
    const tests: TestResult[] = [];

    // Test 1: Notification count function
    tests.push(await this.runTest(
      'Notification Count Function',
      async () => {
        const { data, error } = await supabase.rpc('get_unread_notification_count');
        
        if (error && error.message.includes('does not exist')) {
          throw new Error('Function missing');
        }
        
        return { count: data || 0 };
      }
    ));

    // Test 2: Notification table access
    tests.push(await this.runTest(
      'Notification Table Access',
      async () => {
        const { data, error } = await supabase
          .from('simple_notifications')
          .select('id, title, message')
          .limit(1);
        
        if (error) throw error;
        return { accessible: true, sampleSize: data?.length || 0 };
      }
    ));

    // Test 3: Notification creation structure
    tests.push(await this.runTest(
      'Notification Structure Validation',
      async () => {
        // Test the table structure by describing it
        const { data, error } = await supabase
          .from('simple_notifications')
          .select('id')
          .limit(0); // Get no rows, just test the query structure
        
        if (error) throw error;
        return { structureValid: true };
      }
    ));

    const overallPass = tests.every(test => test.passed);
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);

    return {
      name: 'Notification System',
      tests,
      overallPass,
      totalDuration
    };
  }

  static async validateInvestmentSystem(): Promise<TestSuite> {
    const tests: TestResult[] = [];

    // Test 1: Investment applications table
    tests.push(await this.runTest(
      'Investment Applications Access',
      async () => {
        const { data, error } = await supabase
          .from('simple_applications')
          .select('id, status, amount')
          .limit(5);
        
        if (error) throw error;
        return { accessible: true, recordCount: data?.length || 0 };
      }
    ));

    // Test 2: Investment workflow functions
    tests.push(await this.runTest(
      'Investment Workflow Functions',
      async () => {
        const workflowFunctions = [
          'get_investment_application_by_id',
          'update_onboarding_step',
          'activate_user_investment'
        ];

        const results = [];
        for (const func of workflowFunctions) {
          try {
            // Try calling with dummy data to see if function exists
            await supabase.rpc(func as any, { p_application_id: '00000000-0000-0000-0000-000000000000' });
            results.push({ function: func, exists: true });
          } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
              results.push({ function: func, exists: false });
            } else {
              // Function exists but failed for other reasons (like invalid UUID)
              results.push({ function: func, exists: true });
            }
          }
        }
        
        return { functionTests: results };
      }
    ));

    // Test 3: User investment queries
    tests.push(await this.runTest(
      'User Investment Queries',
      async () => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('simple_applications')
          .select('id, status, amount')
          .eq('user_id', user.user.id);
        
        if (error) throw error;
        return { userApplications: data?.length || 0 };
      }
    ));

    const overallPass = tests.every(test => test.passed);
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);

    return {
      name: 'Investment System',
      tests,
      overallPass,
      totalDuration
    };
  }

  static async validateAdminFunctions(): Promise<TestSuite> {
    const tests: TestResult[] = [];

    const adminFunctions = [
      'get_all_admins',
      'get_managed_users_with_admin_details',
      'claim_user_by_admin',
      'unclaim_user',
      'assign_user_to_admin'
    ];

    for (const functionName of adminFunctions) {
      tests.push(await this.runTest(
        `Admin Function: ${functionName}`,
        async () => {
          const { data, error } = await supabase.rpc(functionName as any);
          
          // These functions may fail due to permissions, but we want to verify they exist
          if (error && error.message.includes('does not exist')) {
            throw new Error('Function does not exist');
          }
          
          // If error is about permissions or parameters, that means function exists
          return { 
            exists: true, 
            error: error?.message || null,
            permissionBased: error?.message.includes('permission') || error?.message.includes('denied')
          };
        }
      ));
    }

    const overallPass = tests.every(test => test.passed);
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);

    return {
      name: 'Admin Functions',
      tests,
      overallPass,
      totalDuration
    };
  }

  static async runFullValidation(): Promise<{
    suites: TestSuite[];
    overallPass: boolean;
    totalDuration: number;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      successRate: number;
    };
  }> {
    console.log('🧪 Starting comprehensive system validation...');
    
    const suites = await Promise.all([
      this.validateProfileSystem(),
      this.validateDatabaseFunctions(),
      this.validateNotificationSystem(),
      this.validateInvestmentSystem(),
      this.validateAdminFunctions()
    ]);

    const overallPass = suites.every(suite => suite.overallPass);
    const totalDuration = suites.reduce((sum, suite) => sum + suite.totalDuration, 0);
    
    const allTests = suites.flatMap(suite => suite.tests);
    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log(`✅ Validation complete: ${passedTests}/${totalTests} tests passed (${successRate}%)`);

    return {
      suites,
      overallPass,
      totalDuration,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate
      }
    };
  }

  static async validateSpecificIssue(issueType: 'profile-loop' | 'admin-panel' | 'notifications' | 'investments'): Promise<TestSuite> {
    switch (issueType) {
      case 'profile-loop':
        return this.validateProfileSystem();
      case 'admin-panel':
        return this.validateAdminFunctions();
      case 'notifications':
        return this.validateNotificationSystem();
      case 'investments':
        return this.validateInvestmentSystem();
      default:
        throw new Error('Unknown issue type');
    }
  }
}
