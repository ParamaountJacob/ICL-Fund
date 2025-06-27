// IMPROVED FORM VALIDATION - Fixes inconsistent validation across forms

import { useState, useCallback } from 'react';

export type ValidationRule<T = any> = {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    phone?: boolean;
    custom?: (value: T) => string | null;
};

export type ValidationRules<T> = {
    [K in keyof T]?: ValidationRule<T[K]>;
};

export type ValidationErrors<T> = {
    [K in keyof T]?: string;
};

export const useFormValidation = <T extends Record<string, any>>(
    initialValues: T,
    validationRules: ValidationRules<T>
) => {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<ValidationErrors<T>>({});
    const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

    const validateField = useCallback((field: keyof T, value: any): string | null => {
        const rules = validationRules[field];
        if (!rules) return null;

        // Required validation
        if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            return `${String(field)} is required`;
        }

        // Skip other validations if field is empty and not required
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return null;
        }

        // String validations
        if (typeof value === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
                return `${String(field)} must be at least ${rules.minLength} characters`;
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                return `${String(field)} must not exceed ${rules.maxLength} characters`;
            }

            if (rules.pattern && !rules.pattern.test(value)) {
                return `${String(field)} format is invalid`;
            }

            if (rules.email && !isValidEmail(value)) {
                return 'Please enter a valid email address';
            }

            if (rules.phone && !isValidPhone(value)) {
                return 'Please enter a valid phone number';
            }
        }

        // Custom validation
        if (rules.custom) {
            return rules.custom(value);
        }

        return null;
    }, [validationRules]);

    const validateAllFields = useCallback((): boolean => {
        const newErrors: ValidationErrors<T> = {};
        let isValid = true;

        Object.keys(values).forEach((field) => {
            const error = validateField(field as keyof T, values[field as keyof T]);
            if (error) {
                newErrors[field as keyof T] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [values, validateField]);

    const setValue = useCallback((field: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [field]: value }));

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    }, [errors]);

    const setFieldTouched = useCallback((field: keyof T) => {
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate field when it loses focus
        const error = validateField(field, values[field]);
        setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }, [validateField, values]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    const hasErrors = Object.values(errors).some(error => error);
    const isFormTouched = Object.values(touched).some(Boolean);

    return {
        values,
        errors,
        touched,
        setValue,
        setFieldTouched,
        validateAllFields,
        resetForm,
        hasErrors,
        isFormTouched,
        isValid: !hasErrors
    };
};

// Validation utilities
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanedPhone);
};

// Form component helpers
export const FormField: React.FC<{
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}> = ({ label, error, required, children }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export const Input: React.FC<{
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'tel';
    error?: string;
    className?: string;
}> = ({ value, onChange, onBlur, placeholder, type = 'text', error, className = '' }) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold";
    const errorClasses = error ? "border-red-500" : "border-gray-300";

    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className={`${baseClasses} ${errorClasses} ${className}`}
        />
    );
};
