export type StarterPackId =
  | 'grocery'
  | 'hardware'
  | 'pharmacy'
  | 'garden'
  | 'liquor'
  | 'bookstore'

export interface StarterPack {
  id: StarterPackId
  label: string
  products: string[]
}

export const STARTER_PACKS: StarterPack[] = [
  {
    id: 'grocery',
    label: 'Grocery',
    products: [
      'Whole Milk', 'Organic Eggs', 'Sourdough Bread', 'Chicken Breast',
      'Orange Juice', 'Cheddar Cheese', 'Bananas', 'Ground Beef',
      'Butter', 'Greek Yogurt', 'Pasta', 'Tomato Sauce',
    ],
  },
  {
    id: 'hardware',
    label: 'Hardware',
    products: [
      'WD-40', 'Batteries AA', 'Duct Tape', 'Hammer', 'Screwdriver Set',
      'Paint Roller', 'Light Bulbs', 'Extension Cord', 'Nails', 'Wood Screws',
    ],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    products: [
      'Ibuprofen', 'Band-Aids', 'Cough Drops', 'Sunscreen', 'Vitamins',
      'Allergy Medicine', 'Hand Sanitizer', 'Toothpaste', 'Shampoo', 'Contact Solution',
    ],
  },
  {
    id: 'garden',
    label: 'Garden Center',
    products: [
      'Potting Soil', 'Tomato Plants', 'Garden Hose', 'Fertilizer', 'Pruning Shears',
      'Flower Seeds', 'Mulch', 'Planter Pots', 'Garden Gloves', 'Watering Can',
    ],
  },
  {
    id: 'liquor',
    label: 'Liquor',
    products: [
      'Cabernet Sauvignon', 'IPA Beer', 'Vodka', 'Whiskey', 'Prosecco',
      'Tonic Water', 'Lime Juice', 'Red Wine', 'Craft Beer', 'Tequila',
    ],
  },
  {
    id: 'bookstore',
    label: 'Bookstore',
    products: [
      'Bestseller Fiction', 'Cookbooks', 'Children\'s Books', 'Mystery Novels',
      'Notebooks', 'Pens', 'Gift Cards', 'Magazines', 'Biographies', 'Puzzles',
    ],
  },
]

export function getStarterPack(id: StarterPackId): StarterPack | undefined {
  return STARTER_PACKS.find(p => p.id === id)
}
