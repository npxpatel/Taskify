const { z } = require('zod');

// Auth
const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name:     z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email:       z.string().email(),
  otp:         z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Jobs
const createJobSchema = z.object({
  company:     z.string().min(1),
  role:        z.string().min(1),
  date:        z.string().min(1),
  applied:     z.enum(['yes', 'no']).optional(),
  openingType: z.enum(['public', 'referral', 'internal']).optional(),
  referral:    z.enum(['available', 'not_available']).optional(),
  shortlisted: z.enum(['yes', 'no', 'waiting']).optional(),
  interviews:  z.enum(['yes', 'no', 'waiting']).optional(),
  selected:    z.enum(['yes', 'no', 'waiting']).optional(),
});

const updateJobSchema = createJobSchema.partial().extend({
  companyLogo:   z.string().nullable().optional(),
  companyDomain: z.string().nullable().optional(),
});

const logoSchema = z.object({
  companyLogo:   z.string().url().nullable(),
  companyDomain: z.string().nullable().optional(),
});

// Tasks
const createTaskSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional(),
  priority:    z.enum(['low', 'medium', 'high']).optional(),
  tags:        z.array(z.string()).optional(),
  date:        z.string().min(1),
  completed:   z.boolean().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

// Templates
const templateSchema = z.object({
  category:     z.enum(['cover_letter', 'resume', 'cold_email', 'follow_up', 'other']),
  templateType: z.enum(['technical', 'behavioral', 'general']),
  title:        z.string().min(1),
  content:      z.string().min(1),
});

const updateTemplateSchema = templateSchema.partial();

module.exports = {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  createJobSchema,
  updateJobSchema,
  logoSchema,
  createTaskSchema,
  updateTaskSchema,
  templateSchema,
  updateTemplateSchema,
};
