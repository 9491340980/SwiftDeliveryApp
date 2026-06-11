require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Offer = require('../models/Offer');

const IMG = 'https://images.unsplash.com';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'swiftbite' });
  console.log('Connected to MongoDB');

  await Category.deleteMany({});
  await Restaurant.deleteMany({});
  await MenuItem.deleteMany({});
  await Offer.deleteMany({});

  const categories = await Category.insertMany([
    { name: 'Vegetables & Fruits', slug: 'vegetables-fruits', image: `${IMG}/photo-1540420773420-3366772f4999?w=150&h=150&fit=crop`, order: 1 },
    { name: 'Groceries',           slug: 'groceries',         image: `${IMG}/photo-1542838132-92c53300491e?w=150&h=150&fit=crop`, order: 2 },
    { name: 'Chicken & Mutton',    slug: 'chicken-mutton',    image: `${IMG}/photo-1604503468506-a8da13d11d36?w=150&h=150&fit=crop`, order: 3 },
    { name: "Tiffin's",            slug: 'tiffins',           image: `${IMG}/photo-1589301760014-d929f3979dbc?w=150&h=150&fit=crop`, order: 4 },
    { name: "Biryani's",           slug: 'biryanis',          image: `${IMG}/photo-1563379091339-03b21ab4a4f8?w=150&h=150&fit=crop`, order: 5 },
    { name: 'Fried Rice',          slug: 'fried-rices',       image: `${IMG}/photo-1603133872878-684f208fb84b?w=150&h=150&fit=crop`, order: 6 },
    { name: "Meals",               slug: 'meals',             image: `${IMG}/photo-1546833999-b9f581a1996d?w=150&h=150&fit=crop`, order: 7 },
    { name: 'Ice Cream',           slug: 'ice-cream',         image: `${IMG}/photo-1551024601-bec78aea704b?w=150&h=150&fit=crop`, order: 8 },
    { name: 'Sweets',              slug: 'sweets',            image: `${IMG}/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop`, order: 9 },
    { name: 'Milk Products',       slug: 'milk-products',     image: `${IMG}/photo-1550583724-b2692b85b150?w=150&h=150&fit=crop`, order: 10 },
    { name: 'Milk Shakes',         slug: 'milkshakes',        image: `${IMG}/photo-1572490122747-3e9c1b589bb0?w=150&h=150&fit=crop`, order: 11 },
    { name: 'Juices',              slug: 'juices',            image: `${IMG}/photo-1621506289937-a8e4df240d0b?w=150&h=150&fit=crop`, order: 12 },
    { name: 'Butter Naan',         slug: 'butter-naans',      image: `${IMG}/photo-1585937421612-70a008356fbe?w=150&h=150&fit=crop`, order: 13 },
    { name: 'Momos',               slug: 'momos',             image: `${IMG}/photo-1496116218417-1a781b1c416c?w=150&h=150&fit=crop`, order: 14 },
    { name: 'Burgers',             slug: 'burgers',           image: `${IMG}/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop`, order: 15 },
    { name: 'Sandwiches',          slug: 'sandwiches',        image: `${IMG}/photo-1553979459-d2229ba7433b?w=150&h=150&fit=crop`, order: 16 },
    { name: 'Noodles',             slug: 'noodles',           image: `${IMG}/photo-1569050467447-ce54b3bbc37d?w=150&h=150&fit=crop`, order: 17 },
    { name: 'Rolls',               slug: 'rolls',             image: `${IMG}/photo-1626700051175-6818013e1d4f?w=150&h=150&fit=crop`, order: 18 },
    { name: 'Grilled Chicken',     slug: 'grilled-chicken',   image: `${IMG}/photo-1532550907401-a500c9a57435?w=150&h=150&fit=crop`, order: 19 },
    { name: 'Starters',            slug: 'starters',          image: `${IMG}/photo-1541014741259-de529411b96a?w=150&h=150&fit=crop`, order: 20 },
  ]);

  const biryaniCat = categories.find(c => c.slug === 'biryanis');
  const mealsCat   = categories.find(c => c.slug === 'meals');
  const tiffinCat  = categories.find(c => c.slug === 'tiffins');

  const restaurant = await Restaurant.create({
    name: 'Atithi Foodland Restaurant',
    description: 'Multi cuisine restaurant serving authentic biryanis, tiffins and meals',
    logo:   `${IMG}/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop`,
    banner: `${IMG}/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop`,
    phone: '9876543210',
    address: { line1: 'Srisailam Highway, VG7H+WJF', city: 'Amangal', state: 'Telangana', pincode: '509321', lat: 17.2, lng: 78.4 },
    categories: [biryaniCat._id, mealsCat._id, tiffinCat._id],
    cuisines: ["Biryani's", "Tiffin's", "Meal's", 'North Indian', 'Rice'],
    rating: 3.8,
    totalRatings: 1,
    deliveryTimeMin: 20,
    deliveryTimeMax: 50,
    deliveryFee: 0,
    minOrderAmount: 100,
    isOpen: true,
    isFeatured: true,
    offerText: 'Free Delivery | CODE: HIGHWAY20',
    tags: ['biryani', 'meals', 'tiffin'],
  });

  await MenuItem.insertMany([
    { restaurant: restaurant._id, menuCategory: 'BIRYANI', name: 'Egg Biryani',
      image: `${IMG}/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop`,
      description: 'Fragrant basmati rice cooked with eggs and aromatic spices', price: 190, discountedPrice: 176, discountPercent: 7, isVeg: false, isBestSeller: true, isAvailable: true },
    { restaurant: restaurant._id, menuCategory: 'BIRYANI', name: 'Zafrani Boneless Chicken Biryani',
      image: `${IMG}/photo-1589302168068-964664d93dc0?w=200&h=200&fit=crop`,
      description: 'Royal boneless chicken biryani with saffron and whole spices', price: 458, discountedPrice: 425, discountPercent: 7, isVeg: false, isBestSeller: true, isAvailable: true },
    { restaurant: restaurant._id, menuCategory: 'BIRYANI', name: 'Chicken Biryani',
      image: `${IMG}/photo-1603360946369-dc9bb6258143?w=200&h=200&fit=crop`,
      description: 'Classic chicken biryani with dum cooking', price: 250, discountedPrice: 230, discountPercent: 8, isVeg: false, isBestSeller: false, isAvailable: true },
    { restaurant: restaurant._id, menuCategory: "MEAL'S", name: 'Veg Meals',
      image: `${IMG}/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop`,
      description: 'Rice, dal, sabzi, roti, papad and pickle', price: 120, isVeg: true, isBestSeller: false, isAvailable: true },
    { restaurant: restaurant._id, menuCategory: "MEAL'S", name: 'Non-Veg Meals',
      image: `${IMG}/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop`,
      description: 'Rice, chicken curry, roti, papad and pickle', price: 180, isVeg: false, isBestSeller: false, isAvailable: true },
    { restaurant: restaurant._id, menuCategory: "TIFFIN'S", name: 'Idli Sambar',
      image: `${IMG}/photo-1589301760014-d929f3979dbc?w=200&h=200&fit=crop`,
      description: 'Soft fluffy idlis served with hot sambar and coconut chutney', price: 60, isVeg: true, isAvailable: true },
    { restaurant: restaurant._id, menuCategory: "TIFFIN'S", name: 'Pesarattu',
      image: `${IMG}/photo-1606491956689-2ea866880c84?w=200&h=200&fit=crop`,
      description: 'Crispy green moong dal crepe with ginger chutney', price: 70, isVeg: true, isAvailable: true },
  ]);

  await Offer.insertMany([
    { code: 'HIGHWAY20', title: 'Free Delivery', description: 'Free delivery on all orders from Atithi Foodland',
      image: `${IMG}/photo-1526367790999-0150786686a2?w=400&h=200&fit=crop`,
      type: 'free_delivery', minOrderAmount: 0, isActive: true },
    { code: 'WELCOME50', title: '50% Off First Order', description: 'Get 50% off on your very first SwiftBite order',
      image: `${IMG}/photo-1607082348824-0a96f2a4b9da?w=400&h=200&fit=crop`,
      type: 'percent', value: 50, maxDiscount: 100, minOrderAmount: 150, isActive: true },
    { code: 'FLAT30', title: '₹30 Flat Off', description: 'Flat ₹30 discount on orders above ₹199',
      image: `${IMG}/photo-1565299624946-b28f40a0ae38?w=400&h=200&fit=crop`,
      type: 'flat', value: 30, minOrderAmount: 199, isActive: true },
  ]);

  console.log('✅ Seed complete!');
  console.log(`  ${categories.length} categories with real images`);
  console.log(`  1 restaurant with real images`);
  console.log(`  7 menu items with real images`);
  console.log(`  3 offers with real images`);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
