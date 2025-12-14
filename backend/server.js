/**
 * StitchFlow Backend Server
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const port = process.env.PORT || 5000;

const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Supabase Client (for cloud storage)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase Storage initialized');
} else {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_KEY missing. Image uploads will fail in production.');
}

// Multer Memory Storage (for cloud upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Session Config
app.use(session({
  secret: process.env.SESSION_SECRET || 'stitchflow_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport Config
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
// Database Connection
const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase/Render/Neon
  }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'stitchflow',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  };

const pool = new Pool(poolConfig);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "placeholder_id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "placeholder_secret";
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn("⚠️  WARNING: GOOGLE_CLIENT_ID is missing using placeholder to prevent crash.");
}

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${BACKEND_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [profile.id, profile.emails[0].value]);

    if (existingUser.rows.length > 0) {
      // Update google_id if matched by email but no google_id yet
      if (!existingUser.rows[0].google_id) {
        await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3',
          [profile.id, profile.photos[0].value, existingUser.rows[0].id]);
        return done(null, { ...existingUser.rows[0], google_id: profile.id, avatar_url: profile.photos[0].value });
      }
      return done(null, existingUser.rows[0]);
    }

    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, google_id, avatar_url, preferences) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [profile.displayName, profile.emails[0].value, profile.id, profile.photos[0].value, '{}']
    );
    return done(null, newUser.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));


// Auto-Migration Helper to ensure columns exist (User requested new features)
// Auto-Migration Helper to ensure columns exist (User requested new features)
const migrateSchema = async () => {
  const runQuery = async (query, label) => {
    try {
      await pool.query(query);
      console.log(`[Migration] Success: ${label}`);
    } catch (err) {
      console.warn(`[Migration] Failed: ${label} - ${err.message}`);
    }
  };

  // 1. Add User Columns
  await runQuery(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `, "User Columns (Nickname, Prefs, GoogleID)");

  // 2. Create Activity Logs Table
  await runQuery(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INT, -- Nullable for now
            action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE
            entity_type VARCHAR(50) NOT NULL, -- CLIENT, ORDER, FABRIC
            entity_id VARCHAR(50),
            details JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `, "Activity Logs Table");

  // 3. Add image_url to fabrics
  await runQuery(`
        ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS image_url TEXT;
    `, "Fabric Image Column");

  // 4. Create Events Table (Calendar)
  await runQuery(`
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date TIMESTAMP NOT NULL,
            type VARCHAR(50) DEFAULT 'reminder', -- reminder, deadline, meeting
            created_at TIMESTAMP DEFAULT NOW()
        );
    `, "Events Table");

  // 5. Catalog (Dress Types / Products)
  await runQuery(`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            default_fabric_id INTEGER REFERENCES fabrics(id),
            base_price NUMERIC(10, 2) DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `, "Products/Catalog Table");

  // 6. Order Items (Multi-Dress Support)
  await runQuery(`
        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id), -- Optional link to catalog
            dress_name VARCHAR(255), -- Snapshot name
            fabric_id INTEGER REFERENCES fabrics(id),
            quantity INTEGER DEFAULT 1,
            size_chart VARCHAR(10),
            fabric_required NUMERIC(10, 2) DEFAULT 0,
            fabric_cost NUMERIC(10, 2) DEFAULT 0,
            stitching_cost NUMERIC(10, 2) DEFAULT 0,
            selling_price NUMERIC(10, 2) DEFAULT 0,
            remarks TEXT
        );
    `, "Order Items Table");

  // 7. Make orders columns nullable for transition (if they aren't already)
  // We won't do this automatically to avoid risk, but new orders will fill dummy data 
  // or we update schema to allow nulls. For now, we will fill the "Main" order fields 
  // with the sums/first-item details to maintain backward compatibility.

  console.log("Schema migration check complete.");
};
migrateSchema();

// Helper to log activity
const logActivity = async (action, entityType, entityId, details) => {
  try {
    await pool.query(
      'INSERT INTO activity_logs (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)',
      [action, entityType, entityId, details]
    );
  } catch (err) {
    console.error("Failed to log activity:", err.message);
    // We don't throw here to avoid failing the main request if logging fails, 
    // but the user wants "every modification tracked", so ideally we should ensure it works.
    // Proceeding to allow request completion but logging error to server console.
  }
};

// --- Auth Routes ---
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=failed` }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect(`${FRONTEND_URL}/`);
  }
);

app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Logged out' });
  });
});

// --- Routes ---

// 0. File Upload Endpoint (Supabase Storage)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!supabase) {
      return res.status(500).json({ message: 'Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.' });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = uniqueSuffix + path.extname(req.file.originalname);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ message: 'Upload to storage failed', error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    res.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed');
  }
});

// 1. Dashboard Stats (Aggregated)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Current User (Mock Auth)
    const userQuery = await pool.query('SELECT * FROM users LIMIT 1');
    const user = userQuery.rows[0];

    // Aggregates
    const revenueQuery = await pool.query('SELECT SUM(selling_price) as total FROM orders');
    const profitQuery = await pool.query('SELECT SUM(profit) as total FROM orders');
    const ordersCount = await pool.query('SELECT COUNT(*) as total FROM orders WHERE status != \'Cancelled\'');

    // Revenue Trends (Last 7 days)
    // 0. Time Range Logic
    const { range = '7d' } = req.query;
    let interval = "'7 days'";
    let dateFormat = "'Mon DD'";

    if (range === '30d') {
      interval = "'30 days'";
      dateFormat = "'Mon DD'";
    } else if (range === '6m') {
      interval = "'6 months'";
      dateFormat = "'Mon YY'";
    } else if (range === '1y') {
      interval = "'1 year'";
      dateFormat = "'Mon YY'";
    }

    // 1. Chart Data (Dynamic)
    // We use a CTE to generate the series so we don't have gaps, but for simplicity in this iteration:
    // We just filter. (Gaps might exist if no sales on a day/month).
    // Improved: Group by the formatted date.
    const chartQuery = await pool.query(`
      SELECT 
        TO_CHAR(order_date, ${dateFormat}) as name,
        SUM(selling_price) as revenue,
        SUM(profit) as profit
      FROM orders 
      WHERE order_date > NOW() - INTERVAL ${interval}
        AND status != 'Cancelled'
      GROUP BY TO_CHAR(order_date, ${dateFormat}), 
               DATE_TRUNC(${range === '6m' || range === '1y' ? "'month'" : "'day'"}, order_date)
      ORDER BY DATE_TRUNC(${range === '6m' || range === '1y' ? "'month'" : "'day'"}, order_date)
    `);

    // Status Distribution
    const statusQuery = await pool.query(`
      SELECT status as name, COUNT(*) as value 
      FROM orders 
      GROUP BY status
    `);

    // Top Fabrics
    const fabricQuery = await pool.query(`
        SELECT f.name, SUM(o.quantity) as amount 
        FROM orders o
        JOIN fabrics f ON o.fabric_id = f.id
        WHERE o.order_date > NOW() - INTERVAL '30 days'
        GROUP BY f.name
        ORDER BY amount DESC
        LIMIT 5
    `);

    // Low Stock Alerts
    const lowStockQuery = await pool.query(`
        SELECT * FROM fabrics WHERE meters_available < 10
    `);

    // Recent Orders
    const recentOrdersQuery = await pool.query(`
      SELECT 
        o.id, 
        o.client_id as "clientId", c.name as "clientName",
        o.fabric_id as "fabricId", f.name as "fabricName",
        o.quantity, o.status,
        TO_CHAR(o.order_date, 'YYYY-MM-DD') as "orderDate",
        TO_CHAR(o.delivery_date, 'YYYY-MM-DD') as "deliveryDate",
        o.total_cost as "totalCost",
        o.selling_price as "sellingPrice",
        o.profit
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN fabrics f ON o.fabric_id = f.id
      ORDER BY o.order_date DESC
      LIMIT 10
    `);

    res.json({
      user,
      revenue: parseFloat(revenueQuery.rows[0].total || 0),
      profit: parseFloat(profitQuery.rows[0].total || 0),
      activeOrders: parseInt(ordersCount.rows[0].total || 0),
      chartData: chartQuery.rows,
      statusData: statusQuery.rows.map(r => ({ ...r, value: parseInt(r.value) })),
      fabricUsageData: fabricQuery.rows.map(r => ({ ...r, amount: parseInt(r.amount) })),
      lowStockFabrics: lowStockQuery.rows.map(r => ({
        ...r,
        metersAvailable: parseFloat(r.meters_available),
        pricePerMeter: parseFloat(r.price_per_meter)
      })),
      recentOrders: recentOrdersQuery.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. Activity Logs
app.get('/api/activity-logs', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                id, action, entity_type as "entityType", entity_id as "entityId", details,
                TO_CHAR(created_at, 'Mon DD, HH12:MI AM') as "timestamp",
                created_at
            FROM activity_logs
            ORDER BY created_at DESC
            LIMIT 50
        `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 3. Clients
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, email, phone, address, status, 
        TO_CHAR(member_since, 'Mon DD, YYYY') as "memberSince",
        TO_CHAR(last_order_date, 'Mon DD, YYYY') as "lastOrderDate",
        avatar_url as "avatarUrl"
      FROM clients
      ORDER BY last_order_date DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientResult = await pool.query(`
            SELECT 
                id, name, email, phone, address, status, 
                TO_CHAR(member_since, 'Mon DD, YYYY') as "memberSince",
                TO_CHAR(last_order_date, 'Mon DD, YYYY') as "lastOrderDate",
                avatar_url as "avatarUrl"
            FROM clients WHERE id = $1
        `, [id]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const ordersResult = await pool.query(`
            SELECT 
              o.id, 
              o.fabric_id as "fabricId", f.name as "fabricName",
              o.quantity, o.status,
              TO_CHAR(o.order_date, 'YYYY-MM-DD') as "orderDate",
              o.selling_price as "sellingPrice"
            FROM orders o
            JOIN fabrics f ON o.fabric_id = f.id
            WHERE o.client_id = $1
            ORDER BY o.order_date DESC
        `, [id]);

    res.json({ ...clientResult.rows[0], recentOrders: ordersResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, phone, address, status, avatarUrl } = req.body;
    const newClient = await pool.query(
      'INSERT INTO clients (name, email, phone, address, status, avatar_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, address, status, avatarUrl]
    );
    await logActivity('CREATE', 'CLIENT', newClient.rows[0].id, JSON.stringify({ name }));
    res.json(newClient.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, status, avatarUrl } = req.body;
    const updateClient = await pool.query(
      'UPDATE clients SET name = $1, email = $2, phone = $3, address = $4, status = $5, avatar_url = $6 WHERE id = $7 RETURNING *',
      [name, email, phone, address, status, avatarUrl, id]
    );

    if (updateClient.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await logActivity('UPDATE', 'CLIENT', id, JSON.stringify({ name, status }));
    res.json(updateClient.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 4. Fabrics
app.get('/api/fabrics', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, color, 
        meters_available as "metersAvailable",
        meters_per_outfit as "metersPerOutfit",
        price_per_meter as "pricePerMeter",
        TO_CHAR(updated_at, 'Mon DD') as "lastUpdated", -- Mocking simpler date
        status,
        image_url as "imageUrl"
      FROM fabrics
      ORDER BY meters_available ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/fabrics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
            SELECT 
                id, name, color, 
                meters_available as "metersAvailable",
                meters_per_outfit as "metersPerOutfit",
                price_per_meter as "pricePerMeter",
                status,
                image_url as "imageUrl"
            FROM fabrics WHERE id = $1
        `, [id]);
    if (result.rows.length === 0) return res.status(404).send('Fabric not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/fabrics', async (req, res) => {
  try {
    const { name, color, metersAvailable, metersPerOutfit, pricePerMeter, status, imageUrl } = req.body;
    const newFabric = await pool.query(
      'INSERT INTO fabrics (name, color, meters_available, meters_per_outfit, price_per_meter, status, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, color, metersAvailable, metersPerOutfit, pricePerMeter, status, imageUrl]
    );
    await logActivity('CREATE', 'FABRIC', newFabric.rows[0].id, JSON.stringify({ name, color }));
    res.json(newFabric.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/fabrics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, metersAvailable, metersPerOutfit, pricePerMeter, status, imageUrl } = req.body;
    const updateFabric = await pool.query(
      'UPDATE fabrics SET name = $1, color = $2, meters_available = $3, meters_per_outfit = $4, price_per_meter = $5, status = $6, image_url = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [name, color, metersAvailable, metersPerOutfit, pricePerMeter, status, imageUrl, id]
    );

    if (updateFabric.rows.length === 0) {
      return res.status(404).json({ message: 'Fabric not found' });
    }

    await logActivity('UPDATE', 'FABRIC', id, JSON.stringify({ name, color, metersAvailable }));
    res.json(updateFabric.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.patch('/api/fabrics/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { metersAvailable } = req.body;
    const result = await pool.query(
      'UPDATE fabrics SET meters_available = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [metersAvailable, id]
    );
    await logActivity('UPDATE', 'FABRIC', id, JSON.stringify({ metersAvailable }));
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 4.5 Events (Calendar)
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, eventDate, type } = req.body;
    const newEvent = await pool.query(
      'INSERT INTO events (title, description, event_date, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, eventDate, type]
    );
    res.json(newEvent.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, eventDate, type } = req.body;
    const updatedhuman = await pool.query(
      'UPDATE events SET title = $1, description = $2, event_date = $3, type = $4 WHERE id = $5 RETURNING *',
      [title, description, eventDate, type, id]
    );
    if (updatedhuman.rows.length === 0) return res.status(404).send('Event not found');
    res.json(updatedhuman.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 4.6 Catalog (Dress Types)
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, f.name as "defaultFabricName" 
      FROM products p 
      LEFT JOIN fabrics f ON p.default_fabric_id = f.id 
      ORDER BY p.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, defaultFabricId, basePrice, description } = req.body;
    const newProduct = await pool.query(
      'INSERT INTO products (name, default_fabric_id, base_price, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, defaultFabricId || null, basePrice || 0, description]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Product already exists' });
    }
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, defaultFabricId, basePrice, description } = req.body;
    const updated = await pool.query(
      'UPDATE products SET name = $1, default_fabric_id = $2, base_price = $3, description = $4 WHERE id = $5 RETURNING *',
      [name, defaultFabricId || null, basePrice || 0, description, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 5. Orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT
    o.id,
      o.client_id as "clientId", c.name as "clientName",
      o.fabric_id as "fabricId", f.name as "fabricName",
      o.dress_name as "dressName",
      o.quantity, o.status,
      TO_CHAR(o.order_date, 'YYYY-MM-DD') as "orderDate",
      TO_CHAR(o.delivery_date, 'YYYY-MM-DD') as "deliveryDate",
      o.total_cost as "totalCost",
      o.selling_price as "sellingPrice",
      o.profit
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN fabrics f ON o.fabric_id = f.id
      ORDER BY o.order_date DESC
      `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
    SELECT
    o.id,
      o.client_id as "clientId", c.name as "clientName", c.email as "clientEmail",
      o.fabric_id as "fabricId", f.name as "fabricName", f.color as "fabricColor",
      o.quantity, o.status,
      o.dress_name as "dressName",
      o.size_chart as "sizeChart",
      o.fabric_required as "fabricRequired",
      o.remarks,
      TO_CHAR(o.order_date, 'YYYY-MM-DD') as "orderDate",
      TO_CHAR(o.delivery_date, 'YYYY-MM-DD') as "deliveryDate",
      o.selling_price as "sellingPrice",
      o.stitching_cost as "stitchingCost",
      o.fabric_cost as "fabricCost",
      o.courier_cost_from_me as "courierCostFromMe",
      o.courier_cost_to_me as "courierCostToMe",
      o.total_cost as "totalCost",
      o.profit
            FROM orders o
            JOIN clients c ON o.client_id = c.id
            JOIN fabrics f ON o.fabric_id = f.id
            WHERE o.id = $1
      `, [id]);

    if (result.rows.length === 0) return res.status(404).send('Order not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      id, clientId, status,
      orderDate, deliveryDate,
      // Aggregates for main table (kept for backward compat & analytics)
      sellingPrice, stitchingCost, fabricCost, courierCostFromMe, courierCostToMe,
      remarks,
      // New Items Array
      items // Array of { dressName, fabricId, quantity, size, fabricRequired, fabricCost, stitchingCost, sellingPrice }
    } = req.body;

    // Start Transaction
    await pool.query('BEGIN');

    // 1. Create Order (Header)
    const newOrder = await pool.query(
      `INSERT INTO orders(
        id, client_id, order_date, delivery_date, status,
        selling_price, stitching_cost, fabric_cost, courier_cost_from_me, courier_cost_to_me,
        remarks,
        fabric_id, quantity, dress_name, size_chart, fabric_required
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING * `,
      [
        id, clientId, orderDate, deliveryDate, status,
        sellingPrice, stitchingCost, fabricCost, courierCostFromMe || 0, courierCostToMe || 0,
        remarks,
        // Legacy/Defaults
        items && items.length > 0 ? items[0].fabricId : null,
        items ? items.reduce((sum, i) => sum + i.quantity, 0) : 0,
        items && items.length > 0 ? items[0].dressName : 'Multi-Item Order',
        items && items.length > 0 ? items[0].sizeChart : 'M',
        items ? items.reduce((sum, i) => sum + (Number(i.fabricRequired) || 0), 0) : 0
      ]
    );

    // 2. Process Items
    if (items && items.length > 0) {
      for (const item of items) {
        // A. Insert Item
        await pool.query(
          `INSERT INTO order_items(
            order_id, dress_name, fabric_id, quantity, size_chart, fabric_required, 
            fabric_cost, stitching_cost, selling_price
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id, item.dressName, item.fabricId, item.quantity, item.sizeChart, item.fabricRequired,
            item.fabricCost, item.stitchingCost, item.sellingPrice
          ]
        );

        // B. Deduct Stock
        let deduction = 0;
        if (item.fabricRequired && item.fabricRequired > 0) {
          deduction = item.fabricRequired;
        } else {
          // Fallback lookup if needed, but for now rely on input
          deduction = 0;
        }

        if (deduction > 0 && item.fabricId) {
          await pool.query(
            'UPDATE fabrics SET meters_available = meters_available - $1, updated_at = NOW() WHERE id = $2',
            [deduction, item.fabricId]
          );
        }
      }
    }

    // Update Client's last_order_date
    await pool.query(
      `UPDATE clients SET last_order_date = NOW() WHERE id = $1`,
      [clientId]
    );


    await pool.query('COMMIT');
    res.json(newOrder.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Routes ---

// 1. Dashboard Stats (Aggregated)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Current User (Mock Auth)
    const userQuery = await pool.query('SELECT * FROM users LIMIT 1');
    const user = userQuery.rows[0];

    // Aggregates
    const revenueQuery = await pool.query('SELECT SUM(selling_price) as total FROM orders');
    const profitQuery = await pool.query('SELECT SUM(profit) as total FROM orders');
    const ordersCount = await pool.query("SELECT COUNT(*) as total FROM orders WHERE status != 'Cancelled'"); // Fixed escaped quote

    // ... (Rest of dashboard stats logic seems fine, truncating for brevity in this replace block if not changing) ...
    // Actually, I need to keep the content I'm not changing if it's within the block or avoid touching it.
    // The instructions say "Replace... TargetContent".
    // I will target the User Routes specifically.
  } catch (err) {
    //...
  }
});
// Wait, I shouldn't replace the whole file. I'll target the User Routes and the migration separately or usage safe blocks.
// Let's stick to adding migration at the top and updating the User routes at the bottom.

// ... (Skipping to User Routes) ...

// 6. User Profile
app.get('/api/users/me', async (req, res) => {
  try {
    // Use the first user found (Mock Auth)
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0) return res.status(404).send('User not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/users/me', async (req, res) => {
  try {
    const { name, email, avatarUrl, nickname, preferences } = req.body;

    // Check if user exists first to get ID
    const userCheck = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
    if (userCheck.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const userId = userCheck.rows[0].id;

    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, avatar_url = $3, nickname = $4, preferences = $5 WHERE id = $6 RETURNING *',
      [name, email, avatarUrl, nickname, preferences, userId]
    );
    await logActivity('UPDATE', 'USER', userId, JSON.stringify({ name, nickname }));
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      clientId, fabricId, quantity, orderDate, deliveryDate, status,
      sellingPrice, stitchingCost, fabricCost, courierCostFromMe, courierCostToMe,
      dressName, sizeChart, fabricRequired, remarks
    } = req.body;

    const updateOrder = await pool.query(
      `UPDATE orders 
       SET client_id = $1, fabric_id = $2, quantity = $3, order_date = $4, delivery_date = $5, status = $6,
      selling_price = $7, stitching_cost = $8, fabric_cost = $9, courier_cost_from_me = $10, courier_cost_to_me = $11,
      dress_name = $12, size_chart = $13, fabric_required = $14, remarks = $15
       WHERE id = $16 RETURNING * `,
      [
        clientId, fabricId, quantity, orderDate, deliveryDate, status,
        sellingPrice, stitchingCost, fabricCost, courierCostFromMe, courierCostToMe,
        dressName, sizeChart, fabricRequired, remarks,
        id
      ]
    );

    if (updateOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    await logActivity('UPDATE', 'ORDER', id, JSON.stringify({ status, quantity }));
    res.json(updateOrder.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    // Log before response to ensure it's captured
    await logActivity('DELETE', 'ORDER', id, JSON.stringify({}));
    res.json({ message: 'Order deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Note: This might fail if there are foreign key constraints (orders). 
    // Ideally we should cascade delete or check first.
    // For now assuming ON DELETE CASCADE is set up or we accept the error.
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });

    await logActivity('DELETE', 'CLIENT', id, JSON.stringify({}));
    res.json({ message: 'Client deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23503') { // Foreign Key Violation
      return res.status(400).json({ message: 'Cannot delete client with active orders.' });
    }
    res.status(500).send('Server Error');
  }
});

app.delete('/api/fabrics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fabrics WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Fabric not found' });

    await logActivity('DELETE', 'FABRIC', id, JSON.stringify({}));
    res.json({ message: 'Fabric deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23503') { // Foreign Key Violation
      return res.status(400).json({ message: 'Cannot delete fabric because it is used in existing orders.' });
    }
    res.status(500).send('Server Error');
  }
});

// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'public')));

  // Handle React routing, return all requests to React app
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Start Server
app.listen(port, async () => {
  // Ensure Schema
  await migrateSchema();
  console.log(`Server running on port ${port}`);
});
