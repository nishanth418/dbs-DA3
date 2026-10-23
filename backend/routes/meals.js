const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET meals with optional filtering by mess
router.get('/', async (req, res) => {
  try {
    const { mess_id, search } = req.query;

    const cypher = `
      MATCH (m:Meal)
      OPTIONAL MATCH (m)-[:SERVED_AT]->(ms:Mess)
      WHERE ($messId IS NULL OR m.MessID = $messId)
        AND ($search IS NULL OR toLower(m.MealName) CONTAINS toLower($search) 
              OR toLower(coalesce(m.Description, '')) CONTAINS toLower($search))
      RETURN 
        m.MealID AS meal_id,
        m.MealID AS MealID,
        m.MealName AS meal_name,
        m.MealName AS name,
        m.MealName AS MealName,
        m.Description AS description,
        m.Description AS Description,
        m.Cost AS cost,
        m.Cost AS Cost,
        m.MessID AS mess_id,
        m.MessID AS MessID,
        coalesce(ms.MessName, 'Unassigned') AS mess_name,
        coalesce(ms.MessType, 'Standard') AS mess_type
      ORDER BY m.MessID ASC, m.MealID ASC
    `;

    const rows = await query(cypher, {
      messId: mess_id && mess_id.trim() ? mess_id.trim() : null,
      search: search && search.trim() ? search.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single meal
router.get('/:id', async (req, res) => {
  try {
    const mealId = req.params.id;
    const cypher = `
      MATCH (m:Meal {MealID: $mealId})
      OPTIONAL MATCH (m)-[:SERVED_AT]->(ms:Mess)
      RETURN 
        m.MealID AS meal_id,
        m.MealID AS MealID,
        m.MealName AS meal_name,
        m.MealName AS name,
        m.MealName AS MealName,
        m.Description AS description,
        m.Description AS Description,
        m.Cost AS cost,
        m.Cost AS Cost,
        m.MessID AS mess_id,
        m.MessID AS MessID,
        coalesce(ms.MessName, 'Unassigned') AS mess_name
    `;
    const rows = await query(cypher, { mealId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching meal by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create meal
router.post('/', async (req, res) => {
  try {
    const { MealID, meal_id, MealName, meal_name, name, Description, description, Cost, cost, MessID, mess_id } = req.body;
    const finalId = MealID || meal_id || ('ML' + (Math.floor(Math.random() * 90) + 10));
    const finalName = MealName || meal_name || name;
    const finalMessId = MessID || mess_id;

    if (!finalName || !finalMessId) {
      return res.status(400).json({ success: false, message: 'Meal name and Mess ID are required' });
    }

    const mealProps = {
      MealID: finalId,
      MealName: finalName,
      Description: Description || description || '',
      Cost: Number(Cost !== undefined ? Cost : (cost || 100)),
      MessID: finalMessId
    };

    await execute(`
      MERGE (m:Meal {MealID: $mealId})
      SET m += $props
    `, { mealId: finalId, props: mealProps });

    await syncRelationships('Meal', mealProps);

    res.status(201).json({ success: true, message: 'Meal created successfully', mealId: finalId });
  } catch (error) {
    console.error('Error creating meal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update meal
router.put('/:id', async (req, res) => {
  try {
    const mealId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (m:Meal {MealID: $mealId}) RETURN m`, { mealId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      MealName: body.MealName || body.meal_name || body.name || existing.MealName,
      Description: body.Description !== undefined ? (body.Description || body.description) : existing.Description,
      Cost: body.Cost !== undefined ? Number(body.Cost) : (body.cost !== undefined ? Number(body.cost) : existing.Cost),
      MessID: body.MessID || body.mess_id || existing.MessID
    };

    await execute(`
      MATCH (m:Meal {MealID: $mealId})
      SET m += $props
    `, { mealId, props: updatedProps });

    await syncRelationships('Meal', { MealID: mealId, ...updatedProps });

    res.json({ success: true, message: 'Meal updated successfully' });
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE meal
router.delete('/:id', async (req, res) => {
  try {
    const mealId = req.params.id;
    await execute(`MATCH (m:Meal {MealID: $mealId}) DETACH DELETE m`, { mealId });
    res.json({ success: true, message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
