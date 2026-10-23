const express = require('express');
const router = express.Router();
const {
  query,
  execute,
  syncRelationships,
  REQUIRED_TABLES,
  TABLE_TO_LABEL,
  TABLE_METADATA
} = require('../database');

// Middleware to validate table name
function validateTableName(req, res, next) {
  const rawName = req.params.tableName;
  const upperName = (rawName || '').toUpperCase();
  if (!REQUIRED_TABLES.includes(upperName)) {
    return res.status(404).json({
      success: false,
      message: `Table '${rawName}' is not one of the 18 application database tables.`
    });
  }
  req.tableName = upperName;
  req.label = TABLE_TO_LABEL[upperName];
  req.meta = TABLE_METADATA[upperName];
  next();
}

// GET all 18 table summaries
router.get('/', async (req, res) => {
  try {
    const list = [];
    for (const table of REQUIRED_TABLES) {
      const label = TABLE_TO_LABEL[table];
      const countRes = await query(`MATCH (n:${label}) RETURN count(n) as count`);
      const meta = TABLE_METADATA[table];
      list.push({
        name: table,
        rowCount: Number(countRes[0]?.count || 0),
        columnCount: meta ? meta.columns.length : 0,
        hasCompositeKey: meta ? meta.pk.length > 1 : false
      });
    }
    res.json({ success: true, count: list.length, tables: list });
  } catch (err) {
    console.error('Error fetching table list:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET specific table schema and all records
router.get('/:tableName', validateTableName, async (req, res) => {
  try {
    const table = req.tableName;
    const label = req.label;
    const meta = req.meta;
    const { search } = req.query;

    const columns = meta.columns.map(c => {
      const fkMatch = meta.fks.find(f => f.from === c.name);
      const isPk = c.isPk;
      const isFk = Boolean(fkMatch);

      let keyBadge = null;
      if (isPk && isFk) {
        keyBadge = 'PK, FK';
      } else if (isPk) {
        keyBadge = 'PK';
      } else if (isFk) {
        keyBadge = 'FK';
      }

      return {
        name: c.name,
        type: c.type,
        notnull: c.notnull,
        dflt_value: null,
        pkOrder: isPk ? 1 : 0,
        isPk,
        isFk,
        keyBadge,
        fkRef: fkMatch ? { table: fkMatch.table, to: fkMatch.to } : null
      };
    });

    let cypher = `MATCH (n:${label})`;
    const params = {};

    if (search && search.trim()) {
      const stringCols = meta.columns.filter(c => c.type.includes('CHAR') || c.type.includes('TEXT'));
      if (stringCols.length > 0) {
        const conditions = stringCols.map(c => `toLower(coalesce(toString(n.${c.name}), '')) CONTAINS toLower($search)`);
        cypher += ` WHERE ${conditions.join(' OR ')}`;
        params.search = search.trim();
      }
    }

    const orderKeys = meta.pk.map(k => `n.${k} ASC`).join(', ');
    cypher += ` RETURN n ORDER BY ${orderKeys}`;

    const rawRows = await query(cypher, params);
    const rows = rawRows.map(r => r.n || r);

    const countRes = await query(`MATCH (n:${label}) RETURN count(n) as count`);
    const totalCount = Number(countRes[0]?.count || 0);

    res.json({
      success: true,
      tableName: table,
      columns,
      primaryKeys: meta.pk,
      foreignKeys: meta.fks,
      totalRows: totalCount,
      filteredRows: rows.length,
      data: rows
    });
  } catch (err) {
    console.error(`Error querying table '${req.params.tableName}':`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST insert new record into table
router.post('/:tableName', validateTableName, async (req, res) => {
  try {
    const table = req.tableName;
    const label = req.label;
    const meta = req.meta;
    const body = req.body || {};

    const nodeProps = {};
    for (const col of meta.columns) {
      if (body[col.name] !== undefined && body[col.name] !== '') {
        nodeProps[col.name] = col.type.includes('INT')
          ? parseInt(body[col.name], 10)
          : col.type.includes('DECIMAL')
          ? parseFloat(body[col.name])
          : body[col.name];
      }
    }

    if (Object.keys(nodeProps).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid column values provided' });
    }

    const matchWhere = meta.pk.map(pk => `row.${pk} = $props.${pk}`).join(' AND ');
    await execute(`
      MERGE (n:${label} {${meta.pk.map(pk => `${pk}: $props.${pk}`).join(', ')}})
      SET n += $props
    `, { props: nodeProps });

    await syncRelationships(label, nodeProps);

    res.status(201).json({
      success: true,
      message: `Record added to ${table} successfully`,
      lastInsertRowid: nodeProps[meta.pk[0]]
    });
  } catch (err) {
    console.error(`Error inserting into ${req.params.tableName}:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update record in table
router.put('/:tableName', validateTableName, async (req, res) => {
  try {
    const table = req.tableName;
    const label = req.label;
    const meta = req.meta;
    const { keyCriteria, values } = req.body;

    if (!keyCriteria || !values || typeof keyCriteria !== 'object' || typeof values !== 'object') {
      return res.status(400).json({ success: false, message: 'keyCriteria and values objects are required' });
    }

    const whereClauses = meta.pk.map(pk => `n.${pk} = $keys.${pk}`);
    const checkRes = await query(`MATCH (n:${label}) WHERE ${whereClauses.join(' AND ')} RETURN n`, { keys: keyCriteria });

    if (checkRes.length === 0) {
      return res.status(404).json({ success: false, message: 'No record matched the key criteria' });
    }

    const nodeProps = {};
    for (const [col, val] of Object.entries(values)) {
      const colMeta = meta.columns.find(c => c.name === col);
      if (colMeta) {
        nodeProps[col] = colMeta.type.includes('INT')
          ? parseInt(val, 10)
          : colMeta.type.includes('DECIMAL')
          ? parseFloat(val)
          : val;
      } else {
        nodeProps[col] = val;
      }
    }

    await execute(`
      MATCH (n:${label})
      WHERE ${whereClauses.join(' AND ')}
      SET n += $props
    `, { keys: keyCriteria, props: nodeProps });

    await syncRelationships(label, { ...keyCriteria, ...nodeProps });

    res.json({ success: true, message: `Record in ${table} updated successfully` });
  } catch (err) {
    console.error(`Error updating record in ${req.params.tableName}:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE record from table
router.delete('/:tableName', validateTableName, async (req, res) => {
  try {
    const table = req.tableName;
    const label = req.label;
    const meta = req.meta;
    const keyCriteria = req.query;

    for (const pk of meta.pk) {
      if (keyCriteria[pk] === undefined) {
        return res.status(400).json({
          success: false,
          message: `Missing primary key parameter '${pk}' for deleting from ${table}`
        });
      }
    }

    // Foreign key reference protection
    if (table === 'STUDENT') {
      const paymentCheck = await query(`
        MATCH (s:Student {StudentID: $id})-[:MADE_PAYMENT]->(p:Payment)
        RETURN count(p) as count
      `, { id: keyCriteria.StudentID });
      if (paymentCheck && Number(paymentCheck[0]?.count || 0) > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete record: Other tables reference this record via Foreign Key constraint.`
        });
      }
    }

    if (table === 'HOSTEL') {
      const roomCheck = await query(`
        MATCH (r:Room)-[:LOCATED_IN]->(h:Hostel {HostelID: $id})
        RETURN count(r) as count
      `, { id: keyCriteria.HostelID });
      if (roomCheck && Number(roomCheck[0]?.count || 0) > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete record: Other tables reference this record via Foreign Key constraint.`
        });
      }
    }

    const whereClauses = meta.pk.map(pk => `n.${pk} = $keys.${pk}`);
    const checkRes = await query(`MATCH (n:${label}) WHERE ${whereClauses.join(' AND ')} RETURN n`, { keys: keyCriteria });

    if (checkRes.length === 0) {
      return res.status(404).json({ success: false, message: 'No record matched the primary key' });
    }

    await execute(`
      MATCH (n:${label})
      WHERE ${whereClauses.join(' AND ')}
      DETACH DELETE n
    `, { keys: keyCriteria });

    res.json({ success: true, message: `Record deleted from ${table} successfully` });
  } catch (err) {
    console.error(`Error deleting from ${req.params.tableName}:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
