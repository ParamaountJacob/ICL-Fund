import { supabase } from './supabase';

interface GoHighLevelContact {
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    source?: string;
    tags?: string[];
    customFields?: Record<string, any>;
}

interface GoHighLevelResponse {
    success: boolean;
    contact?: any;
    error?: string;
}

class GoHighLevelService {
    private apiKey: string | null = null;
    private baseUrl = 'https://services.leadconnectorhq.com/contacts/';

    constructor() {
        this.loadApiKey();
    }

    private async loadApiKey(): Promise<void> {
        try {
            // Get the API key from Supabase secrets
            const { data, error } = await supabase.rpc('get_secret', {
                secret_name: 'GHL_API_KEY'
            });

            if (error) {
                console.error('Error loading GoHighLevel API key:', error);
                return;
            }

            this.apiKey = data;
        } catch (error) {
            console.error('Failed to load GoHighLevel API key:', error);
        }
    }

    private async ensureApiKey(): Promise<boolean> {
        if (!this.apiKey) {
            await this.loadApiKey();
        }
        return !!this.apiKey;
    }

    /**
     * Create or update a contact in GoHighLevel
     */
    async syncContact(userData: {
        email: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        source?: string;
    }): Promise<GoHighLevelResponse> {
        try {
            const hasApiKey = await this.ensureApiKey();
            if (!hasApiKey) {
                console.error('GoHighLevel API key not available');
                return { success: false, error: 'API key not configured' };
            }

            const contactData: GoHighLevelContact = {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                name: userData.firstName && userData.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData.firstName || userData.email,
                phone: userData.phone,
                source: userData.source || 'ICL Website',
                tags: ['ICL User', 'Website Signup'],
                customFields: {
                    'signup_date': new Date().toISOString(),
                    'signup_source': 'ICL Website'
                }
            };

            console.log('Syncing contact to GoHighLevel:', contactData);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('GoHighLevel API error:', responseData);
                return {
                    success: false,
                    error: responseData.message || `HTTP ${response.status}`
                };
            }

            console.log('Successfully synced contact to GoHighLevel:', responseData);
            return { success: true, contact: responseData };

        } catch (error) {
            console.error('Error syncing contact to GoHighLevel:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Update an existing contact in GoHighLevel
     */
    async updateContact(contactId: string, updates: Partial<GoHighLevelContact>): Promise<GoHighLevelResponse> {
        try {
            const hasApiKey = await this.ensureApiKey();
            if (!hasApiKey) {
                return { success: false, error: 'API key not configured' };
            }

            const response = await fetch(`${this.baseUrl}${contactId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('GoHighLevel update error:', responseData);
                return {
                    success: false,
                    error: responseData.message || `HTTP ${response.status}`
                };
            }

            return { success: true, contact: responseData };

        } catch (error) {
            console.error('Error updating GoHighLevel contact:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Find a contact by email in GoHighLevel
     */
    async findContactByEmail(email: string): Promise<GoHighLevelResponse> {
        try {
            const hasApiKey = await this.ensureApiKey();
            if (!hasApiKey) {
                return { success: false, error: 'API key not configured' };
            }

            const response = await fetch(`${this.baseUrl}search?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                }
            });

            const responseData = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: responseData.message || `HTTP ${response.status}`
                };
            }

            return { success: true, contact: responseData };

        } catch (error) {
            console.error('Error finding GoHighLevel contact:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

export const goHighLevelService = new GoHighLevelService();
export default goHighLevelService;
