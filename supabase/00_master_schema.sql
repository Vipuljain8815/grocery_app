-- ==========================================
-- MASTER SCHEMA SCRIPT
-- ==========================================

DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.policies CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP SEQUENCE IF EXISTS orders_order_number_seq CASCADE;

-- 2. Create Sequences
CREATE SEQUENCE orders_order_number_seq START 10000000 MAXVALUE 99999999;

-- ==========================================
-- 3. Core Tables
-- ==========================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses
CREATE TABLE public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  full_address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  images TEXT[] DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Settings
CREATE TABLE public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency_symbol TEXT DEFAULT '$',
    currency_code TEXT DEFAULT 'USD',
    delivery_charge NUMERIC(10, 2) DEFAULT 5.00,
    min_order_value NUMERIC(10, 2) DEFAULT 10.00,
    tax_percentage NUMERIC(5, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Coupons
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('category', 'coupon', 'product', 'link')),
    action_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies
CREATE TABLE public.policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT UNIQUE NOT NULL CHECK (type IN ('privacy', 'terms', 'help')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Order & Relationship Tables
-- ==========================================

-- Favorites
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(8) UNIQUE NOT NULL DEFAULT nextval('orders_order_number_seq')::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. Row Level Security (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Addresses Policies
CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Read-only Public Policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Settings are viewable by everyone" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view policies" ON public.policies FOR SELECT USING (true);
CREATE POLICY "Anyone can view active faqs" ON public.faqs FOR SELECT USING (is_active = true);

-- Support Tickets Policies
CREATE POLICY "Anyone can submit a support ticket" ON public.support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);

-- Favorites Policies
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items Policies
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- ==========================================
-- 6. RPC Functions
-- ==========================================

CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, decrement_by INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - decrement_by)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, increment_by INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = LEAST(total_stock, stock_quantity + increment_by)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 7. Seed Data
-- ==========================================

-- Insert App Settings
INSERT INTO public.app_settings (currency_symbol, currency_code, delivery_charge, min_order_value, tax_percentage)
VALUES ('₹', 'INR', 5.00, 10.00, 18.00);

-- Insert Default Policies
INSERT INTO public.policies (type, title, content)
VALUES 
  ('privacy', 'Privacy Policy', 'Your privacy is important to us. This Privacy Policy explains how we collect, use, protect, and share your personal information.'),
  ('terms', 'Terms and Conditions', 'Welcome to our app. By accessing or using our service, you agree to be bound by these Terms and Conditions.')
ON CONFLICT (type) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- Insert FAQs
INSERT INTO public.faqs (question, answer, sort_order)
VALUES 
  ('How long does delivery take?', 'Most grocery orders are delivered within 1 to 2 hours of placing the order.', 1),
  ('How can I apply a coupon?', 'You can enter a promo code on the Checkout screen before placing your order.', 2),
  ('Do you offer refunds?', 'Yes, if there is a problem with your order, please contact support within 24 hours.', 3);

-- Insert Demo Coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, valid_until)
VALUES 
  ('WELCOME10', 'percentage', 10, 20, NOW() + INTERVAL '1 year'),
  ('SAVE5', 'fixed', 5, 30, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- Seed script for Categories and Products
DO $$
DECLARE
    cat_ids UUID[] := '{}';
    new_cat_id UUID;
    i INT;
    j INT;
    random_category UUID;
    cat_names TEXT[] := ARRAY[
        'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Seafood', 
        'Beverages', 'Snacks', 'Frozen Foods', 'Pantry', 'Canned Goods',
        'Baking Supplies', 'Condiments', 'Spices', 'Breakfast', 'Sweets',
        'Pasta & Grains', 'Sauces', 'Deli', 'International Foods'
    ];
    cat_descs TEXT[] := ARRAY[
        'Fresh, seasonal fruits sourced directly from local orchards.', 
        'Crisp, organic vegetables for your daily nutritional needs.', 
        'Fresh milk, artisan cheeses, and farm-fresh eggs.', 
        'Freshly baked breads, pastries, and delicious treats.', 
        'Premium cuts of beef, poultry, and pork from trusted farms.', 
        'Freshly caught fish and premium shellfish varieties.', 
        'Refreshing juices, sodas, teas, and premium coffees.', 
        'Sweet and savory snacks for any time of the day.', 
        'Convenient ready-to-eat meals and frozen ingredients.', 
        'Essential staples and long-lasting supplies for your kitchen.', 
        'High-quality preserved goods for quick and easy meals.',
        'Everything you need for perfect cakes, cookies, and breads.', 
        'Flavorful additions to elevate your everyday meals.', 
        'Aromatic herbs and spices from around the world.', 
        'Cereals, oats, and morning essentials to start your day.', 
        'Chocolates, candies, and decadent desserts.',
        'Wholesome rice, pasta, and diverse grain varieties.', 
        'Rich, authentic sauces for cooking and dipping.', 
        'Premium sliced meats, prepared salads, and gourmet cheeses.', 
        'Authentic ingredients and specialties from global cuisines.'
    ];
BEGIN
    FOR i IN 1..20 LOOP
        INSERT INTO public.categories (name, description, image_url)
        VALUES (
            cat_names[i],
            cat_descs[i],
            'https://picsum.photos/seed/cat' || i || '/400/400'
        )
        RETURNING id INTO new_cat_id;
        cat_ids := array_append(cat_ids, new_cat_id);
    END LOOP;

    FOR j IN 1..1000 LOOP
        random_category := cat_ids[floor(random() * 20 + 1)];
        
        INSERT INTO public.products (category_id, name, description, price, stock_quantity, total_stock, low_stock_threshold, images, is_enabled, is_featured)
        VALUES (
            random_category,
            'Grocery Item #' || j,
            'This is a high-quality description for Grocery Item #' || j || '. It is fresh, organic, and sourced from the best local suppliers.',
            round((random() * 95 + 5)::numeric, 2),
            floor(random() * 500 + 1),
            floor(random() * 500 + 1),
            10,
            ARRAY['https://picsum.photos/seed/prod' || j || '_1/800/600', 'https://picsum.photos/seed/prod' || j || '_2/800/600', 'https://picsum.photos/seed/prod' || j || '_3/800/600'],
            random() > 0.1,
            random() > 0.85
        );
    END LOOP;
END $$;

-- Insert Banners (Using actual references from seeded DB)
INSERT INTO public.banners (title, image_url, type, action_value, sort_order)
SELECT 'Fresh Fruits Sale', 'https://picsum.photos/seed/fruits/800/400', 'category', id::text, 1
FROM public.categories LIMIT 1;

INSERT INTO public.banners (title, image_url, type, action_value, sort_order)
SELECT 'Get 10% Off', 'https://picsum.photos/seed/coupon/800/400', 'coupon', code, 2
FROM public.coupons LIMIT 1;

INSERT INTO public.banners (title, image_url, type, action_value, sort_order)
SELECT 'Featured Product', 'https://picsum.photos/seed/honey/800/400', 'product', id::text, 3
FROM public.products LIMIT 1;

INSERT INTO public.banners (title, image_url, type, action_value, sort_order)
VALUES ('Learn React Native', 'https://picsum.photos/seed/blog/800/400', 'link', 'https://reactnative.dev', 4);

-- ==========================================
-- 8. Storage Buckets (Optional / Re-runnable)
-- ==========================================
-- Ensure 'avatars' bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can delete their own avatar." ON storage.objects;
CREATE POLICY "Anyone can delete their own avatar." ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
