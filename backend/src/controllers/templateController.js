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

module.exports = { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate };
