/**
 * StitchFlow Backend Server
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'kai_dev_jwt_secret_key_change_in_production';

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
const isProduction = process.env.NODE_ENV === 'production';
console.log('🌐 Production mode:', isProduction);

// Trust proxy for Render (required for secure cookies behind reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Database Connection
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🔗 BACKEND_URL:', BACKEND_URL);
console.log('🔗 FRONTEND_URL:', FRONTEND_URL);

const poolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || 'stitchflow',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  };

const pool = new Pool(poolConfig);

// Auto-Migration Helper to ensure columns exist
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
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `, "User Columns (Nickname, Prefs, PasswordHash)");

  // 2. Create Activity Logs Table
  await runQuery(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INT,
            action VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id VARCHAR(50),
            details JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `, "Activity Logs Table");

  // 3. Add image_url to fabrics
  await runQuery(`
        ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    `, "Fabric Image and Soft Delete Columns");

  // 3b. Add image_url to products
  await runQuery(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
    `, "Product Image Column");

  // 4. Create Events Table (Calendar)
  await runQuery(`
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date TIMESTAMP NOT NULL,
            type VARCHAR(50) DEFAULT 'reminder',
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
            image_url VARCHAR(255),
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `, "Products/Catalog Table");

  // Alter Products Table (For Catalog Automations)
  await runQuery(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS fabric_required NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS stitching_cost NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS price_per_size JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS fabric_per_size JSONB DEFAULT '{}';
  `, "Alter Products Table");

  // 6. Order Items (Multi-Dress Support)
  await runQuery(`
        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            dress_name VARCHAR(255),
            fabric_id INTEGER REFERENCES fabrics(id),
            quantity INTEGER DEFAULT 1,
            size_chart VARCHAR(10),
            fabric_required NUMERIC(10, 2) DEFAULT 0,
            fabric_cost NUMERIC(10, 2) DEFAULT 0,
            stitching_cost NUMERIC(10, 2) DEFAULT 0,
            profit_margin NUMERIC(10, 2) DEFAULT 0,
            selling_price NUMERIC(10, 2) DEFAULT 0,
            remarks TEXT
        );
    `, "Order Items Table");

  // Retrofit profit_margin to existing order_items tables
  await runQuery(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(10, 2) DEFAULT 0;
  `, "Alter Order Items Table with Profit Margin");

  // 6.5 App Settings
  await runQuery(`
      CREATE TABLE IF NOT EXISTS app_settings (
          id SERIAL PRIMARY KEY,
          app_name VARCHAR(255) DEFAULT 'கை(kai)',
          logo_url TEXT DEFAULT '/src/logo/kailogov1.png'
      );
      INSERT INTO app_settings (id, app_name, logo_url)
      SELECT 1, 'கை(kai)', '/src/logo/kailogov1.png'
      WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1);
  `, "App Settings Table");

  // 7. Seed default admin if no users exist
  await runQuery(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (name, email, password_hash, avatar_url)
        VALUES ('Admin', 'admin@kai.com', '$2b$10$TdVO/JjT35ILdnUsw4Ntg.gb80QG6IEAabCWJUpJqMrnaapU8HxXe', 'https://picsum.photos/id/64/100/100');
      END IF;
    END $$;
  `, "Seed default admin user");

  console.log("Schema migration check complete.");
};

// Helper to log activity
const logActivity = async (action, entityType, entityId, details) => {
  try {
    await pool.query(
      'INSERT INTO activity_logs (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)',
      [action, entityType, entityId, details]
    );
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};

// --- Auth Middleware ---

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, preferences) VALUES ($1, $2, $3, $4) RETURNING id, name, email, nickname, avatar_url as "avatarUrl", preferences, role',
      [name, email, passwordHash, '{}']
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    console.log('✅ User registered:', email);
    res.json({ token, user });
  } catch (err) {
    console.error('❌ Register error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Account has no password set. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    console.log('✅ User logged in:', email);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        preferences: user.preferences,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, nickname, avatar_url as "avatarUrl", preferences, role 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Auth success for:', result.rows[0].email);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Auth error:', err.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
});

// Logout (client-side only, just acknowledge)
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// Update current user profile
app.put('/api/users/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, nickname, avatarUrl, preferences } = req.body;

    console.log('📝 Updating user:', userId, { name, nickname, avatarUrl: avatarUrl ? 'set' : 'not set' });

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           nickname = $3, 
           avatar_url = $4,
           preferences = COALESCE($5::jsonb, preferences)
       WHERE id = $6 
       RETURNING id, name, email, nickname, avatar_url as "avatarUrl", preferences, role`,
      [name, email, nickname || null, avatarUrl || null, preferences ? JSON.stringify(preferences) : null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User profile updated:', result.rows[0].email);
    await logActivity('UPDATE', 'USER', userId, JSON.stringify({ name, nickname }));
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all users (admin only)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    // Check if requesting user is admin
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const result = await pool.query(
      `SELECT id, name, email, role, nickname, avatar_url as "avatarUrl", created_at as "createdAt" FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create new member (admin only)
app.post('/api/users', verifyToken, async (req, res) => {
  try {
    // Check if requesting user is admin
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'member';
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, preferences) VALUES ($1, $2, $3, $4, '{}') 
       RETURNING id, name, email, role, nickname, avatar_url as "avatarUrl", created_at as "createdAt"`,
      [name, email, passwordHash, userRole]
    );
    console.log('✅ New member created:', email);
    await logActivity('CREATE', 'USER', result.rows[0].id, JSON.stringify({ name, email, role: userRole }));
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change password (admin can change any, user can change own)
app.put('/api/users/:id/password', verifyToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const requestingUserId = req.user.id;
    // Check if admin or self
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [requestingUserId]);
    const isAdmin = adminCheck.rows.length > 0 && (adminCheck.rows[0].role || '').toLowerCase() === 'admin';
    if (!isAdmin && requestingUserId !== targetUserId) {
      return res.status(403).json({ message: 'Not authorized to change this password' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    // If changing own password (non-admin), require current password
    if (!isAdmin || requestingUserId === targetUserId) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [targetUserId]);
      if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
      const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, targetUserId]);
    console.log('✅ Password changed for user:', targetUserId);
    await logActivity('UPDATE', 'USER', targetUserId, 'Password changed');
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('❌ Error changing password:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user role (admin only)
app.put('/api/users/:id/role', verifyToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { role } = req.body;
    if (role !== 'admin' && role !== 'member') {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    // Prevent removing the last admin
    if (role === 'member') {
      const adminCount = await pool.query("SELECT count(*) FROM users WHERE LOWER(role) = 'admin'");
      if (parseInt(adminCount.rows[0].count) <= 1) {
        const targetCheck = await pool.query("SELECT role FROM users WHERE id = $1", [targetUserId]);
        if (targetCheck.rows.length > 0 && targetCheck.rows[0].role.toLowerCase() === 'admin') {
          return res.status(400).json({ message: 'Cannot demote the only admin' });
        }
      }
    }

    const updated = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, nickname, avatar_url as "avatarUrl", created_at as "createdAt"',
      [role, targetUserId]
    );

    if (updated.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    await logActivity('UPDATE', 'USER', targetUserId, JSON.stringify({ role }));
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('❌ Error updating user role:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (req.user.id === targetUserId) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [targetUserId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    await logActivity('DELETE', 'USER', targetUserId, '{}');
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// App Settings (Global Application Config)
app.get('/api/settings/app', async (req, res) => {
  try {
    const result = await pool.query('SELECT app_name as "appName", logo_url as "logoUrl" FROM app_settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({ appName: 'கை(kai)', logoUrl: '/src/logo/kailogov1.png' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching app settings:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.put('/api/settings/app', verifyToken, async (req, res) => {
  try {
    // Check if admin
    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin access required to change app settings' });
    }

    const { appName, logoUrl } = req.body;
    const result = await pool.query(
      `UPDATE app_settings SET app_name = COALESCE($1, app_name), logo_url = COALESCE($2, logo_url) WHERE id = 1 RETURNING app_name as "appName", logo_url as "logoUrl"`,
      [appName, logoUrl]
    );

    await logActivity('UPDATE', 'APP_SETTINGS', 1, JSON.stringify({ appName, logoUrl }));
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating app settings:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// --- Routes ---

// 0. File Upload Endpoint (Supabase Storage or Local Fallback)
const fs = require('fs');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
console.log('📂 Uploads directory:', UPLOADS_DIR);

// Serve uploaded files statically under /api/uploads so production reverse proxy routes them to backend
app.use('/api/uploads', express.static(UPLOADS_DIR));

// Test endpoint to verify uploads dir is accessible
app.get('/api/test/uploads', (req, res) => {
  const uploadsExist = fs.existsSync(UPLOADS_DIR);
  const files = uploadsExist ? fs.readdirSync(UPLOADS_DIR, { recursive: true }) : [];
  res.json({
    uploadsPath: UPLOADS_DIR,
    exists: uploadsExist,
    files: files,
    canServe: `GET /api/uploads/{filename}`
  });
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const folder = req.body.folder || '';

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = uniqueSuffix + path.extname(req.file.originalname);
    const storagePath = folder ? `${folder}/${fileName}` : fileName;

    console.log(`📤 Upload request: ${req.file.originalname} -> ${storagePath}`);

    // Try Supabase first, fallback to local storage
    if (supabase) {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        return res.status(500).json({ message: 'Upload to storage failed', error: error.message });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(storagePath);

      console.log('✅ Supabase upload complete:', urlData.publicUrl);
      return res.json({ url: urlData.publicUrl });
    } else {
      // Local file storage fallback
      const targetDir = folder ? path.join(UPLOADS_DIR, folder) : UPLOADS_DIR;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      // Return RELATIVE URL under /api/uploads so production proxy routes to backend
      const relativeUrl = folder ? `/api/uploads/${folder}/${fileName}` : `/api/uploads/${fileName}`;
      console.log('✅ File saved locally:', relativeUrl);
      console.log('   Physical path:', filePath);
      return res.json({ url: relativeUrl });
    }
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// 1. Dashboard Stats (Aggregated)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Current User
    const userQuery = await pool.query('SELECT * FROM users LIMIT 1');
    const user = userQuery.rows[0];

    // Aggregates
    const revenueQuery = await pool.query('SELECT SUM(selling_price) as total FROM orders');
    const profitQuery = await pool.query('SELECT SUM(profit) as total FROM orders');
    const ordersCount = await pool.query("SELECT COUNT(*) as total FROM orders WHERE status != 'Cancelled'");

    // Revenue Trends
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

    const chartQuery = await pool.query(`
      SELECT 
        TO_CHAR(order_date, ${dateFormat}) as name,
        SUM(selling_price) as revenue,
        SUM(profit) as profit,
        COUNT(*) as volume
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
        SELECT * FROM fabrics WHERE meters_available < 10 AND is_deleted = FALSE
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

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });

    await logActivity('DELETE', 'CLIENT', id, JSON.stringify({}));
    res.json({ message: 'Client deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Cannot delete client with active orders.' });
    }
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
        TO_CHAR(updated_at, 'Mon DD') as "lastUpdated",
        status,
        image_url as "imageUrl"
      FROM fabrics
      WHERE is_deleted = FALSE
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

app.delete('/api/fabrics/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if fabric is used in orders
    const orderCheck = await pool.query('SELECT 1 FROM orders WHERE fabric_id = $1 LIMIT 1', [id]);

    if (orderCheck.rows.length > 0) {
      // Soft delete if used in orders to preserve history
      const updateResult = await pool.query('UPDATE fabrics SET is_deleted = TRUE WHERE id = $1 RETURNING *', [id]);
      if (updateResult.rows.length === 0) return res.status(404).json({ message: 'Fabric not found' });
      await logActivity('ARCHIVE', 'FABRIC', id, JSON.stringify({ note: 'Soft deleted due to existing orders' }));
      return res.json({ message: 'Fabric archived successfully' });
    }

    const result = await pool.query('DELETE FROM fabrics WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Fabric not found' });

    await logActivity('DELETE', 'FABRIC', id, JSON.stringify({}));
    res.json({ message: 'Fabric deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Cannot delete fabric because it is used in existing orders.' });
    }
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
    const updated = await pool.query(
      'UPDATE events SET title = $1, description = $2, event_date = $3, type = $4 WHERE id = $5 RETURNING *',
      [title, description, eventDate, type, id]
    );
    if (updated.rows.length === 0) return res.status(404).send('Event not found');
    res.json(updated.rows[0]);
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
      SELECT 
        p.id,
        p.name,
        p.default_fabric_id as "defaultFabricId",
        p.base_price as "basePrice",
        p.description,
        p.image_url as "imageUrl",
        p.fabric_required as "fabricRequired",
        p.stitching_cost as "stitchingCost",
        p.price_per_size as "pricePerSize",
        p.fabric_per_size as "fabricPerSize",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        f.name as "defaultFabricName",
        f.color as "defaultFabricColor"
      FROM products p 
      LEFT JOIN fabrics f ON p.default_fabric_id = f.id 
      ORDER BY p.name ASC
    `);
    console.log('📦 Products fetched:', result.rows.length, 'items');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, defaultFabricId, basePrice, description, imageUrl, fabricRequired, stitchingCost, pricePerSize, fabricPerSize } = req.body;
    const newProduct = await pool.query(
      'INSERT INTO products (name, default_fabric_id, base_price, description, image_url, fabric_required, stitching_cost, price_per_size, fabric_per_size) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, defaultFabricId || null, basePrice || 0, description, imageUrl || null, fabricRequired || 0, stitchingCost || 0, pricePerSize || '{}', fabricPerSize || '{}']
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Product already exists' });
    }
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, defaultFabricId, basePrice, description, imageUrl, fabricRequired, stitchingCost, pricePerSize, fabricPerSize } = req.body;
    const updated = await pool.query(
      'UPDATE products SET name = $1, default_fabric_id = $2, base_price = $3, description = $4, image_url = $5, fabric_required = $6, stitching_cost = $7, price_per_size = $8, fabric_per_size = $9 WHERE id = $10 RETURNING *',
      [name, defaultFabricId || null, basePrice || 0, description, imageUrl || null, fabricRequired || 0, stitchingCost || 0, pricePerSize || '{}', fabricPerSize || '{}', id]
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
      o.profit,
      o.fabric_cost as "fabricCost",
      o.stitching_cost as "stitchingCost",
      o.courier_cost_from_me as "courierCostFromMe",
      o.courier_cost_to_me as "courierCostToMe"
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
      o.client_id as "clientId", c.name as "clientName", c.email as "clientEmail", c.phone as "clientPhone", c.address as "clientAddress",
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
            LEFT JOIN fabrics f ON o.fabric_id = f.id
            WHERE o.id = $1
      `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const orderData = result.rows[0];

    // Fetch items
    const itemsResult = await pool.query(`
      SELECT 
        oi.id, oi.dress_name as "dressName", oi.fabric_id as "fabricId",
        f.name as "fabricName", f.color as "fabricColor",
        oi.quantity, oi.size_chart as "sizeChart", 
        oi.fabric_required as "fabricRequired", oi.fabric_cost as "fabricCost", 
        oi.stitching_cost as "stitchingCost", oi.profit_margin as "profitMargin", 
        oi.selling_price as "sellingPrice"
      FROM order_items oi
      LEFT JOIN fabrics f ON oi.fabric_id = f.id
      WHERE oi.order_id = $1
    `, [id]);

    // Attach items (if empty, we can fallback to flat item if needed, but UI should handle it)
    orderData.items = itemsResult.rows;

    res.json(orderData);
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
      sellingPrice, stitchingCost, fabricCost, courierCostFromMe, courierCostToMe,
      remarks,
      items
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
        await pool.query(
          `INSERT INTO order_items(
            order_id, dress_name, fabric_id, quantity, size_chart, fabric_required, 
            fabric_cost, stitching_cost, profit_margin, selling_price
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id, item.dressName, item.fabricId || null, item.quantity, item.sizeChart, item.fabricRequired || 0,
            item.fabricCost || 0, item.stitchingCost || 0, item.profitMargin || 0, item.sellingPrice || 0
          ]
        );

        let deduction = 0;
        if (item.fabricRequired && item.fabricRequired > 0) {
          deduction = item.fabricRequired;
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
       SET client_id = $1, status = $2, order_date = $3, delivery_date = $4,
           selling_price = $5, stitching_cost = $6, fabric_cost = $7, 
           courier_cost_from_me = $8, courier_cost_to_me = $9, remarks = $10,
           quantity = $11
       WHERE id = $12 RETURNING * `,
      [
        clientId, status, orderDate, deliveryDate,
        sellingPrice, stitchingCost, fabricCost,
        courierCostFromMe, courierCostToMe, remarks,
        req.body.items ? req.body.items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0) : quantity,
        id
      ]
    );

    if (updateOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Process items update: simple approach is delete existing items, insert new ones
    if (req.body.items && req.body.items.length > 0) {
      await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);
      for (const item of req.body.items) {
        await pool.query(
          `INSERT INTO order_items(
            order_id, dress_name, fabric_id, quantity, size_chart, fabric_required, 
            fabric_cost, stitching_cost, profit_margin, selling_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id, item.dressName, item.fabricId || null, item.quantity, item.sizeChart,
            item.fabricRequired || 0, item.fabricCost || 0, item.stitchingCost || 0,
            item.profitMargin || 0, item.sellingPrice || 0
          ]
        );
      }
    }

    await logActivity('UPDATE', 'ORDER', id, JSON.stringify({ status, clientId }));
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

    await logActivity('DELETE', 'ORDER', id, JSON.stringify({}));
    res.json({ message: 'Order deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Start Server
app.listen(port, async () => {
  await migrateSchema();
  console.log(`Server running on port ${port}`);
});
