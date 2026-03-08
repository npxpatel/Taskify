const { v4: uuidv4 } = require('uuid');
const { Template }   = require('../models/Template');
const { AppError }   = require('../utils/AppError');
const { setCache, getCache, deleteCache, CacheKeys } = require('../services/redis');
const { templateSchema, updateTemplateSchema } = require('../types');

async function getTemplates(req, res, next) {
  try {
    const cacheKey = CacheKeys.userTemplates(req.userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      if (req.query.category) {
        return res.json({ success: true, data: cached.filter((t) => t.category === req.query.category) });
      }
      return res.json({ success: true, data: cached });
    }

    const filter = { userId: req.userId };
    if (req.query.category) filter.category = req.query.category;

    const templates = await Template.find(filter).sort({ updatedAt: -1 }).lean();

    const allTemplates = filter.category
      ? await Template.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean()
      : templates;

    await setCache(cacheKey, allTemplates, 300);
    return res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
}

async function getTemplate(req, res, next) {
  try {
    const { templateId } = req.params;
    const template = await Template.findOne({ templateId, userId: req.userId }).lean();
    if (!template) throw AppError.notFound('Template not found');
    return res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

async function createTemplate(req, res, next) {
  try {
    const body = templateSchema.parse(req.body);
    const template = await Template.create({ templateId: uuidv4(), userId: req.userId, ...body });

    await deleteCache(CacheKeys.userTemplates(req.userId));
    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

async function updateTemplate(req, res, next) {
  try {
    const { templateId } = req.params;
    const body = updateTemplateSchema.parse(req.body);

    const template = await Template.findOneAndUpdate(
      { templateId, userId: req.userId },
      body,
      { new: true, runValidators: true }
    );

    if (!template) throw AppError.notFound('Template not found');

    await deleteCache(CacheKeys.userTemplates(req.userId));
    return res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

async function deleteTemplate(req, res, next) {
  try {
    const { templateId } = req.params;
    const template = await Template.findOneAndDelete({ templateId, userId: req.userId });

    if (!template) throw AppError.notFound('Template not found');

    await deleteCache(CacheKeys.userTemplates(req.userId));
    return res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
}

const DEFAULT_TEMPLATES = [
  {
    category: 'cold_email',
    templateType: 'general',
    title: 'LinkedIn Referral Request',
    content: `Hi [Name],

I hope you're doing well! I came across your profile on LinkedIn and noticed you work at [Company]. I'm really interested in the [Role] position there and would love to learn more about your experience on the team.

Would you be open to a quick 15-minute chat? I'd really appreciate any insights you can share, and if you feel it's a good fit, I'd be grateful for a referral.

Thanks so much for your time!

Best,
[Your Name]`,
  },
  {
    category: 'cold_email',
    templateType: 'general',
    title: 'Direct HR Outreach',
    content: `Hi [Recruiter Name],

I'm reaching out regarding the [Role] opening at [Company]. With [X] years of experience in [relevant field], I'm confident I'd be a strong fit for the team.

I've attached my resume for your review and would love the opportunity to connect. Please feel free to reach out at your convenience.

Best regards,
[Your Name]
[LinkedIn URL]`,
  },
  {
    category: 'cover_letter',
    templateType: 'general',
    title: 'Standard Cover Letter',
    content: `Dear Hiring Manager,

I am excited to apply for the [Role] position at [Company]. With a background in [Your Field] and a passion for [relevant area], I believe I can make a meaningful contribution to your team.

In my previous role at [Previous Company], I [key achievement]. I am particularly drawn to [Company] because of [specific reason — product, mission, culture].

I'd love the opportunity to discuss how my skills align with your team's goals. Thank you for considering my application.

Sincerely,
[Your Name]`,
  },
  {
    category: 'cover_letter',
    templateType: 'technical',
    title: 'Technical Role Cover Letter',
    content: `Dear Hiring Manager,

I'm applying for the [Role] position at [Company]. I have [X] years of experience building [relevant technology/systems], and I'm excited about the technical challenges your team is solving.

At [Previous Company], I [specific technical achievement, e.g., "reduced API latency by 40% by redesigning the caching layer"]. I'm proficient in [Tech Stack] and have a strong foundation in [relevant concepts].

I'm particularly excited about [Company]'s work on [specific product/technology] and would love to contribute to that mission.

Thank you for your time and consideration.

Best,
[Your Name]`,
  },
  {
    category: 'follow_up',
    templateType: 'general',
    title: 'Post-Interview Follow Up',
    content: `Hi [Interviewer Name],

Thank you so much for taking the time to speak with me about the [Role] position at [Company] on [Date]. I really enjoyed our conversation, especially discussing [specific topic from the interview].

I'm very excited about the opportunity and remain confident that my experience in [relevant skill] would allow me to make a strong contribution to the team.

Please don't hesitate to reach out if you need any additional information. I look forward to hearing from you!

Best regards,
[Your Name]`,
  },
  {
    category: 'follow_up',
    templateType: 'general',
    title: 'Application Status Follow Up',
    content: `Hi [Recruiter Name],

I hope you're well! I wanted to follow up on my application for the [Role] position at [Company] that I submitted on [Date]. I remain very enthusiastic about this opportunity and would love to know if there are any updates on the hiring timeline.

Please let me know if you need any additional information from my end.

Thank you!

Best,
[Your Name]`,
  },
  {
    category: 'resume',
    templateType: 'general',
    title: 'Summary Statement',
    content: `Results-driven [Your Title] with [X]+ years of experience in [industry/domain]. Proven track record of [key achievement type, e.g., "delivering scalable software solutions" or "driving revenue growth"]. Passionate about [area of interest] and committed to continuous learning. Seeking to leverage expertise in [Key Skills] to contribute to [type of company/team].`,
  },
  {
    category: 'other',
    templateType: 'general',
    title: 'Thank You Note',
    content: `Hi [Name],

Just wanted to drop a quick note to say thank you for [referring me / chatting with me / the introduction]. I really appreciate you taking the time — it means a lot.

I'll keep you posted on how things progress!

Best,
[Your Name]`,
  },
];

async function seedDefaultTemplates(req, res, next) {
  try {
    const existing = await Template.countDocuments({ userId: req.userId });
    if (existing > 0) {
      return res.json({ success: true, message: 'Templates already exist', seeded: 0 });
    }

    const docs = DEFAULT_TEMPLATES.map((t) => ({
      templateId: uuidv4(),
      userId: req.userId,
      ...t,
    }));

    await Template.insertMany(docs);
    await deleteCache(CacheKeys.userTemplates(req.userId));

    return res.status(201).json({ success: true, message: 'Default templates seeded', seeded: docs.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, seedDefaultTemplates };
