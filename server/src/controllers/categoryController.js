const slugify = require('slugify');
const categoryModel = require('../models/categoryModel');

async function list(req, res, next) {
  try {
    const categories = await categoryModel.list();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });
    const slug = slugify(name, { lower: true, strict: true });
    const id = await categoryModel.create(name, slug);
    res.status(201).json({ id, name, slug });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoryModel.remove(req.params.id);
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove };
