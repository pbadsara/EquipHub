import fs from 'fs';
import path from 'path';
import Equipment, { EQUIPMENT_STATUS, LISTING_TYPE } from '../models/Equipment.js';
import { getSettings } from '../models/Settings.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const EDITABLE_STATUSES = [EQUIPMENT_STATUS.PENDING, EQUIPMENT_STATUS.REJECTED];

function deleteUploadedFile(photoUrl) {
  if (!photoUrl) return;
  const filename = path.basename(photoUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to delete uploaded file:', filePath, err.message);
    }
  });
}

export async function createEquipment(req, res, next) {
  try {
    const { title, description, category, price, listingType } = req.body;

    if (!title || !description || price === undefined || !listingType) {
      return res.status(400).json({ message: 'title, description, price and listingType are required.' });
    }

    if (!Object.values(LISTING_TYPE).includes(listingType)) {
      return res.status(400).json({ message: `listingType must be one of: ${Object.values(LISTING_TYPE).join(', ')}` });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'price must be a non-negative number.' });
    }

    const settings = await getSettings();
    if (numericPrice > settings.maxListingPrice) {
      return res.status(403).json({
        message: `Price exceeds the current listing cap of $${settings.maxListingPrice}.`,
      });
    }

    const equipment = await Equipment.create({
      title,
      description,
      category: category || '',
      price: numericPrice,
      listingType,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      seller: req.user._id,
      status: EQUIPMENT_STATUS.PENDING,
    });

    return res.status(201).json({ equipment: equipment.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

export async function listMyEquipment(req, res, next) {
  try {
    const items = await Equipment.find({ seller: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ equipment: items.map((item) => item.toSafeObject()) });
  } catch (err) {
    return next(err);
  }
}

export async function updateEquipment(req, res, next) {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (equipment.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own listings.' });
    }

    if (!EDITABLE_STATUSES.includes(equipment.status)) {
      return res.status(409).json({
        message: `Listings that are "${equipment.status}" can't be edited.`,
      });
    }

    const { title, description, category, price, listingType } = req.body;

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: 'price must be a non-negative number.' });
      }
      const settings = await getSettings();
      if (numericPrice > settings.maxListingPrice) {
        return res.status(403).json({
          message: `Price exceeds the current listing cap of $${settings.maxListingPrice}.`,
        });
      }
      equipment.price = numericPrice;
    }

    if (title !== undefined) equipment.title = title;
    if (description !== undefined) equipment.description = description;
    if (category !== undefined) equipment.category = category;
    if (listingType !== undefined) {
      if (!Object.values(LISTING_TYPE).includes(listingType)) {
        return res.status(400).json({ message: `listingType must be one of: ${Object.values(LISTING_TYPE).join(', ')}` });
      }
      equipment.listingType = listingType;
    }

    if (req.file) {
      deleteUploadedFile(equipment.photoUrl);
      equipment.photoUrl = `/uploads/${req.file.filename}`;
    }

    // An edit to a previously-rejected listing puts it back in the review queue.
    if (equipment.status === EQUIPMENT_STATUS.REJECTED) {
      equipment.status = EQUIPMENT_STATUS.PENDING;
      equipment.rejectionReason = null;
    }

    await equipment.save();
    return res.status(200).json({ equipment: equipment.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

export async function deleteEquipment(req, res, next) {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (equipment.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own listings.' });
    }

    deleteUploadedFile(equipment.photoUrl);
    await equipment.deleteOne();

    return res.status(200).json({ message: 'Listing deleted.' });
  } catch (err) {
    return next(err);
  }
}

// ---- Public catalogue (Phase A2) ----

export async function listCatalogue(req, res, next) {
  try {
    const { category, search, minPrice, maxPrice, listingType } = req.query;
    const query = { status: EQUIPMENT_STATUS.APPROVED };

    if (category) query.category = category;
    if (listingType) query.listingType = listingType;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { category: regex }];
    }

    const items = await Equipment.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ equipment: items.map((item) => item.toSafeObject()) });
  } catch (err) {
    return next(err);
  }
}

export async function getEquipmentById(req, res, next) {
  try {
    // Public endpoint — only ever exposes approved listings. Sellers see their
    // own (any status) via /mine, admins see pending ones via /pending.
    const equipment = await Equipment.findOne({ _id: req.params.id, status: EQUIPMENT_STATUS.APPROVED });
    if (!equipment) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    return res.status(200).json({ equipment: equipment.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

// ---- Admin review queue (Phase A2) ----

export async function listPendingEquipment(req, res, next) {
  try {
    const items = await Equipment.find({ status: EQUIPMENT_STATUS.PENDING }).sort({ createdAt: 1 });
    return res.status(200).json({ equipment: items.map((item) => item.toSafeObject()) });
  } catch (err) {
    return next(err);
  }
}

export async function approveEquipment(req, res, next) {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    if (equipment.status !== EQUIPMENT_STATUS.PENDING) {
      return res.status(409).json({ message: `Only pending listings can be approved (this one is "${equipment.status}").` });
    }
    equipment.status = EQUIPMENT_STATUS.APPROVED;
    equipment.rejectionReason = null;
    await equipment.save();
    return res.status(200).json({ equipment: equipment.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

export async function rejectEquipment(req, res, next) {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    if (equipment.status !== EQUIPMENT_STATUS.PENDING) {
      return res.status(409).json({ message: `Only pending listings can be rejected (this one is "${equipment.status}").` });
    }
    const { reason } = req.body;
    equipment.status = EQUIPMENT_STATUS.REJECTED;
    equipment.rejectionReason = reason || 'No reason given.';
    await equipment.save();
    return res.status(200).json({ equipment: equipment.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}
