const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const PROFILE_ID = 'main_profile'; // Fixed ID for the single sender profile

exports.getSenderProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM sender_profile WHERE profile_id = ?', [PROFILE_ID]);
    if (rows.length === 0) {
      // Return a default structure or null if no profile is set up yet
      // This helps the frontend to have a consistent object shape.
      return res.json(null); 
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateSenderProfile = async (req, res, next) => {
  try {
    const { name, nit, type, logoUrl, address, phone, email, bankAccountInfo, signatureName, signatureCC, signatureImageUrl } = req.body;

    if (!name || !nit) {
        return res.status(400).json({ message: "Nombre y NIT del remitente son requeridos." });
    }

    const profileData = {
      name, nit, type, logoUrl, address, phone, email,
      bankAccountInfo, signatureName, signatureCC, signatureImageUrl,
      updatedAt: new Date()
    };

    // Check if profile exists
    const [existingProfile] = await db.query('SELECT profile_id FROM sender_profile WHERE profile_id = ?', [PROFILE_ID]);

    if (existingProfile.length > 0) {
      // Update existing profile
      await db.query('UPDATE sender_profile SET ? WHERE profile_id = ?', [profileData, PROFILE_ID]);
    } else {
      // Insert new profile with the fixed ID
      await db.query('INSERT INTO sender_profile SET ?', { profile_id: PROFILE_ID, ...profileData });
    }
    
    res.json({ profile_id: PROFILE_ID, ...profileData });
  } catch (err) {
    next(err);
  }
};
