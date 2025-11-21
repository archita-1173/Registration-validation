const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const db = require('./database');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function validateRegistrations() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not configured. Skipping validation.');
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      // First, try to get registrations from the last 1 minute (for efficiency)
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
      
      db.all(
        `SELECT * FROM drivers 
         WHERE created_at >= ? AND validation_status = 'pending'
         ORDER BY created_at DESC`,
        [oneMinuteAgo],
        async (err, rows) => {
          if (err) {
            console.error('Error fetching registrations:', err);
            reject(err);
            return;
          }

          // If no recent registrations, check for ALL pending registrations
          if (rows.length === 0) {
            console.log('No pending registrations found in the last minute, checking all pending...');
            db.all(
              `SELECT * FROM drivers 
               WHERE validation_status = 'pending'
               ORDER BY created_at DESC`,
              [],
              async (err, allRows) => {
                if (err) {
                  console.error('Error fetching all pending registrations:', err);
                  reject(err);
                  return;
                }
                
                if (allRows.length === 0) {
                  console.log('No pending registrations found');
                  resolve();
                  return;
                }
                
                console.log(`Found ${allRows.length} pending registration(s) to validate (from all time)`);
                await processValidations(allRows);
                resolve();
              }
            );
            return;
          }

          console.log(`Found ${rows.length} registration(s) to validate (from last minute)`);
          await processValidations(rows);
          resolve();

        }
      );
    } catch (error) {
      console.error('Error in validateRegistrations:', error);
      reject(error);
    }
  });
}

// Helper function to process validations
async function processValidations(rows) {
  const validationPromises = rows.map(registration => 
    validateRegistration(registration).catch(error => {
      console.error(`Error validating registration ${registration.id}:`, error);
      return null; // Continue with other validations even if one fails
    })
  );

  await Promise.all(validationPromises);
  console.log('Validation job completed');
}

async function validateRegistration(registration) {
  const validationResults = {
    isValid: true,
    notes: []
  };

  try {
    // Read license document
    const licenseBuffer = await fs.readFile(registration.license_doc_path);
    const licenseBase64 = licenseBuffer.toString('base64');
    const licenseMimeType = path.extname(registration.license_doc_path).toLowerCase() === '.pdf' 
      ? 'application/pdf' 
      : 'image/jpeg';

    // Read insurance document
    const insuranceBuffer = await fs.readFile(registration.insurance_doc_path);
    const insuranceBase64 = insuranceBuffer.toString('base64');
    const insuranceMimeType = path.extname(registration.insurance_doc_path).toLowerCase() === '.pdf'
      ? 'application/pdf'
      : 'image/jpeg';

    // Validate license document
    const licenseValidation = await validateDocument(
      licenseBase64,
      licenseMimeType,
      registration.first_name + ' ' + registration.last_name,
      registration.license_expiry_date,
      'driver license'
    );

    if (!licenseValidation.isValid) {
      validationResults.isValid = false;
      validationResults.notes.push(`License: ${licenseValidation.reason}`);
    }

    // Validate insurance document
    const insuranceValidation = await validateDocument(
      insuranceBase64,
      insuranceMimeType,
      registration.first_name + ' ' + registration.last_name,
      registration.insurance_expiry_date,
      'insurance document'
    );

    if (!insuranceValidation.isValid) {
      validationResults.isValid = false;
      validationResults.notes.push(`Insurance: ${insuranceValidation.reason}`);
    }

    // Update database
    const status = validationResults.isValid ? 'validated' : 'failed';
    const notes = validationResults.notes.join('; ');

    db.run(
      `UPDATE drivers 
       SET validation_status = ?, validation_notes = ?, validated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, notes, registration.id],
      (err) => {
        if (err) {
          console.error(`Error updating validation status for registration ${registration.id}:`, err);
        } else {
          console.log(`Registration ${registration.id} validation completed: ${status}`);
        }
      }
    );

  } catch (error) {
    console.error(`Error validating registration ${registration.id}:`, error);
    db.run(
      `UPDATE drivers 
       SET validation_status = 'failed', validation_notes = ?, validated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [`Validation error: ${error.message}`, registration.id]
    );
  }
}

async function validateDocument(base64Content, mimeType, expectedName, expiryDate, documentType) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a document validation assistant. Analyze the provided ${documentType} and check:
1. If the name "${expectedName}" appears in the document (check for variations, initials, etc.)
2. If the expiry date "${expiryDate}" matches or is close to the expiry date in the document
3. If the document appears to be a valid ${documentType}

Respond with a JSON object: {"isValid": true/false, "reason": "explanation"}
If the name doesn't match or expiry date doesn't match, set isValid to false and provide a clear reason.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please validate this ${documentType}. Expected name: "${expectedName}", Expected expiry: "${expiryDate}"`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Content}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isValid: result.isValid === true,
          reason: result.reason || 'Validation completed'
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, check if the response indicates validity
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('valid') && !lowerContent.includes('invalid')) {
        return { isValid: true, reason: 'Document appears valid' };
      }
      return { isValid: false, reason: 'Could not validate document format' };
    }

    return { isValid: false, reason: 'Unexpected validation response format' };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return { isValid: false, reason: `API error: ${error.message}` };
  }
}

module.exports = { validateRegistrations };

