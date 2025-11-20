import { z } from 'zod';
import { AuthUtils } from './auth';

// Base validation schemas
export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((email) => AuthUtils.isValidEmail(email), 'Invalid email format');

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .refine(
        (password: string) => AuthUtils.validatePassword(password).isValid,
        {
            message: 'Password must meet security requirements',
        }
    );

export const nameSchema = z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const phoneSchema = z
    .string()
    .optional()
    .refine(
        (phone) => {
            if (!phone) return true; // Optional field
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
        },
        'Please enter a valid phone number'
    );

// Authentication schemas
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

export const registerSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string().min(1, 'Please confirm your password'),
        firstName: nameSchema,
        lastName: nameSchema,
        phone: phoneSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: passwordSchema,
        confirmPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: 'New password must be different from current password',
        path: ['newPassword'],
    });

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: passwordSchema,
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

// Profile schemas
export const updateProfileSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema,
});

export const updateEmailSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required to change email'),
});

// File validation schemas
export const fileUploadSchema = z.object({
    fileName: z
        .string()
        .min(1, 'File name is required')
        .max(255, 'File name is too long')
        .regex(/^[^<>:"/\\|?*]+$/, 'File name contains invalid characters'),
    fileType: z.string().min(1, 'File type is required'),
    category: z.enum(['image', 'document', 'video', 'other']).optional(),
});

// Generic form schemas
export const searchSchema = z.object({
    query: z
        .string()
        .min(1, 'Search query is required')
        .max(100, 'Search query is too long'),
});

export const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    limit: z
        .number()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
});

// Contact/Support schemas
export const contactSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    subject: z
        .string()
        .min(5, 'Subject must be at least 5 characters')
        .max(100, 'Subject is too long'),
    message: z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(1000, 'Message is too long'),
});

// Feedback schema
export const feedbackSchema = z.object({
    rating: z.number().min(1, 'Rating is required').max(5, 'Rating cannot exceed 5'),
    comment: z
        .string()
        .min(10, 'Comment must be at least 10 characters')
        .max(500, 'Comment is too long')
        .optional(),
    category: z.enum(['bug', 'feature', 'improvement', 'other']).optional(),
});

// Two-factor authentication schema
export const twoFactorSchema = z.object({
    code: z
        .string()
        .min(6, 'Code must be 6 digits')
        .max(6, 'Code must be 6 digits')
        .regex(/^\d{6}$/, 'Code must contain only numbers'),
});

// Export type definitions
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type UpdateEmailFormData = z.infer<typeof updateEmailSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type PaginationFormData = z.infer<typeof paginationSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type FeedbackFormData = z.infer<typeof feedbackSchema>;
export type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

// Validation helper functions
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
} => {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.issues.forEach((err) => {
                const path = err.path.join('.');
                errors[path] = err.message;
            });
            return { success: false, errors };
        }
        return { success: false, errors: { general: 'Validation failed' } };
    }
};

export const getFieldError = (errors: Record<string, string> | undefined, field: string): string | undefined => {
    return errors?.[field];
};