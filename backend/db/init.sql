-- Create Keycloak database (for Keycloak auth service)
CREATE DATABASE keycloak;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    keycloak_id VARCHAR(255),
    nickname VARCHAR(255),
    role VARCHAR(50) DEFAULT 'Admin',
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    avatar_url TEXT,
    member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_order_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Fabrics Table
CREATE TABLE IF NOT EXISTS fabrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(100),
    meters_available NUMERIC(10, 2) DEFAULT 0,
    meters_per_outfit NUMERIC(10, 2) DEFAULT 0,
    price_per_meter NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'In Stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY, -- ID provided by frontend e.g. 'ord-1024'
    client_id INTEGER REFERENCES clients(id),
    fabric_id INTEGER REFERENCES fabrics(id),
    quantity INTEGER DEFAULT 1,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    -- New Fields
    dress_name VARCHAR(255),
    size_chart TEXT,
    fabric_required NUMERIC(10, 2) DEFAULT 0,
    remarks TEXT,
    
    selling_price NUMERIC(10, 2) DEFAULT 0,
    stitching_cost NUMERIC(10, 2) DEFAULT 0,
    fabric_cost NUMERIC(10, 2) DEFAULT 0,
    courier_cost_from_me NUMERIC(10, 2) DEFAULT 0,
    courier_cost_to_me NUMERIC(10, 2) DEFAULT 0,
    
    -- Generated columns for costs and profit
    total_cost NUMERIC(10, 2) GENERATED ALWAYS AS (stitching_cost + fabric_cost + courier_cost_from_me + courier_cost_to_me) STORED,
    profit NUMERIC(10, 2) GENERATED ALWAYS AS (selling_price - (stitching_cost + fabric_cost + courier_cost_from_me + courier_cost_to_me)) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'warning', 'alert', 'success', 'info'
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Seed Data (Dynamic Dates)

-- Users
INSERT INTO users (id, name, email, avatar_url) VALUES 
(1, 'Olivia Rhye', 'olivia@stitchflow.com', 'https://picsum.photos/id/64/100/100');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Clients
INSERT INTO clients (id, name, email, phone, address, status, member_since, last_order_date, avatar_url) VALUES 
(1, 'Olivia Rhye', 'olivia@untitledui.com', '+1 (555) 123-4567', '100 Smith Street, Collingwood VIC 3066', 'Active', NOW() - INTERVAL '6 months', NOW() - INTERVAL '2 days', 'https://picsum.photos/id/64/200/200'),
(2, 'Phoenix Baker', 'phoenix@untitledui.com', '+1 (555) 987-6543', '24 Sussex St, Sydney NSW 2000', 'Onboarding', NOW() - INTERVAL '1 month', NULL, 'https://picsum.photos/id/91/200/200'),
(3, 'Lana Steiner', 'lana@untitledui.com', '+1 (555) 234-5678', '456 Market St, San Francisco CA 94103', 'Inactive', NOW() - INTERVAL '1 year', NOW() - INTERVAL '3 weeks', 'https://picsum.photos/id/177/200/200'),
(4, 'Demi Wilkinson', 'demi@untitledui.com', '+1 (555) 345-6789', '789 Broadway, New York NY 10003', 'Active', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 day', 'https://picsum.photos/id/338/200/200'),
(5, 'Candice Wu', 'candice@untitledui.com', '+1 (555) 456-7890', '123 Ocean Dr, Miami FL 33139', 'Active', NOW() - INTERVAL '5 months', NOW() - INTERVAL '1 week', 'https://picsum.photos/id/237/200/200');

SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

-- Fabrics
INSERT INTO fabrics (id, name, color, meters_available, meters_per_outfit, price_per_meter, status) VALUES 
(1, 'Cotton Denim', 'Navy Blue', 25.5, 1.5, 12.00, 'In Stock'),
(2, 'Silk Charmeuse', 'Ivory', 5.0, 2.2, 45.00, 'Low Stock'),
(3, 'Wool Tweed', 'Charcoal', 8.0, 2.5, 30.00, 'Low Stock'),
(4, 'Linen Blend', 'Beige', 120.0, 1.8, 18.00, 'In Stock'),
(5, 'Velvet', 'Burgundy', 1.5, 3.0, 55.00, 'Critical');

SELECT setval('fabrics_id_seq', (SELECT MAX(id) FROM fabrics));

-- Orders (Dynamic Dates)
-- ord-1024: 1 month ago
-- ord-1023: 15 days ago
-- ord-1022: 4 days ago
-- ord-1021: 2 months ago
-- ord-1020: 3 days ago
-- ord-1019: Today

INSERT INTO orders (id, client_id, fabric_id, quantity, order_date, delivery_date, status, dress_name, fabric_required, selling_price, stitching_cost, fabric_cost, courier_cost_from_me, courier_cost_to_me) VALUES 
('ord-1024', 1, 1, 50, NOW() - INTERVAL '30 days', NOW() - INTERVAL '20 days', 'In Progress', 'Summer Dress', 1.5, 1800.00, 500.00, 600.00, 50.00, 50.00),
('ord-1023', 3, 4, 20, NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days', 'Completed', 'Linen Shirt', 1.2, 850.00, 200.00, 200.00, 50.00, 50.00),
('ord-1022', 4, 2, 15, NOW() - INTERVAL '4 days', NOW() + INTERVAL '10 days', 'Pending', 'Silk Blouse', 2.0, 1400.00, 400.00, 300.00, 50.00, 50.00),
('ord-1021', 5, 3, 30, NOW() - INTERVAL '60 days', NOW() - INTERVAL '50 days', 'Completed', 'Tweed Jacket', 2.5, 2400.00, 800.00, 600.00, 50.00, 50.00),
('ord-1020', 1, 4, 100, NOW() - INTERVAL '3 days', NOW() + INTERVAL '7 days', 'Completed', 'Casual Pant', 1.8, 3200.00, 1000.00, 800.00, 100.00, 100.00),
('ord-1019', 4, 1, 45, NOW() - INTERVAL '0 days', NOW() + INTERVAL '14 days', 'In Progress', 'Denim Skirt', 1.0, 1650.00, 450.00, 550.00, 50.00, 50.00);

-- Notifications
INSERT INTO notifications (type, message, created_at, is_read) VALUES 
('warning', 'Low stock: Silk Charmeuse (5m remaining)', NOW() - INTERVAL '2 minutes', false),
('alert', 'Order #1022 is due in 3 days', NOW() - INTERVAL '1 hour', false),
('success', 'New Client: Phoenix Baker onboarded', NOW() - INTERVAL '3 hours', true),
('info', 'Weekly profit report is ready', NOW() - INTERVAL '5 hours', true);
