// Simple email service for sending notifications
export const sendApplicationEmail = async (applicationData: any) => {
    try {
        // In a real application, this would call your email service
        // For now, we'll just log the data and simulate an email send
        const emailContent = {
            to: 'applications@innercirclelending.com',
            subject: 'New Investment Application Submitted',
            body: `
        New investment application received:
        
        Name: ${applicationData.first_name} ${applicationData.last_name}
        Email: ${applicationData.email}
        Phone: ${applicationData.phone}
        Investment Amount: ${applicationData.investment_amount}
        Investment Goals: ${applicationData.investment_goals}
        Annual Income: ${applicationData.annual_income}
        Net Worth: ${applicationData.net_worth}
        
        Please review and follow up with the applicant.
      `
        };

        console.log('Email would be sent:', emailContent);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, message: 'Application email sent successfully' };
    } catch (error) {
        console.error('Failed to send application email:', error);
        return { success: false, message: 'Failed to send application email' };
    }
};

export const sendOnboardingEmail = async (onboardingData: any) => {
    try {
        const emailContent = {
            to: 'applications@innercirclelending.com',
            subject: 'New Investment Onboarding Application',
            body: `
        New investment onboarding application received:
        
        Investment Amount: $${onboardingData.investmentAmount?.toLocaleString()}
        Term: ${onboardingData.termYears} year(s)
        Payout Frequency: ${onboardingData.payoutFrequency}
        Funding Source: ${onboardingData.fundingSource}
        
        User ID: ${onboardingData.userId}
        Application ID: ${onboardingData.applicationId}
        
        Please review and process this application.
      `
        };

        console.log('Onboarding email would be sent:', emailContent);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, message: 'Onboarding email sent successfully' };
    } catch (error) {
        console.error('Failed to send onboarding email:', error);
        return { success: false, message: 'Failed to send onboarding email' };
    }
};
