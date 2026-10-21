/*
 * Strawberry Faerie: shop data
 * ------------------------------------------------------------
 * Edit this file to add real products. No build step needed.
 *
 * CATEGORY fields:
 *   id, name, blurb, icon (emoji, decorative), fulfillment ("ship" | "local"),
 *   fulfillmentNote, cottageFood (true for food made under Texas cottage-food law)
 *
 * PRODUCT fields:
 *   id           unique slug, e.g. "lavender-oat-soap"
 *   category     one of the category ids below
 *   name         product name
 *   price        number in USD (e.g. 8.5) or null if not set yet
 *   description  short description
 *   image        path like "assets/products/lavender-oat-soap.jpg", or null
 *   imageAlt     alt text describing the photo
 *   ingredients  REQUIRED for cottage-food items (jams, jellies, baked goods)
 *   allergens    REQUIRED for cottage-food items, e.g. "Contains: wheat, milk, eggs"
 *   placeholder  true = shows the "placeholder" ribbon; delete for real items
 *
 * TODO (Arti): replace every placeholder item below with real products.
 */

window.SF_CATEGORIES = [
  {
    id: "jams",
    name: "Jams & Jellies",
    icon: "🍓",
    blurb: "Small-batch preserves, stirred slowly and sealed with love.",
    fulfillment: "local",
    fulfillmentNote: "Local pickup or hand delivery in Texas only",
    cottageFood: true
  },
  {
    id: "seasonal",
    name: "Seasonal Goods",
    icon: "🍂",
    blurb: "Limited-run goodies that change with the seasons.",
    fulfillment: "ship",
    // TODO (Arti): confirm shipping for seasonal items (food items must be local only).
    fulfillmentNote: "Shipping details coming soon"
  },
  {
    id: "baked",
    name: "Baked Goods",
    icon: "🍞",
    blurb: "Fresh-baked bread and treats straight from the faerie's oven.",
    fulfillment: "local",
    fulfillmentNote: "Local pickup or hand delivery in Texas only",
    cottageFood: true
  }
];

// Required Texas cottage-food disclosure (shown on food categories and food cards).
// TODO (Arti): double-check current Texas DSHS cottage food labeling rules.
window.SF_COTTAGE_DISCLOSURE =
  "This food is made in a home kitchen and is not inspected by the Department of State Health Services or a local health department.";

function sfPlaceholder(category, n, food) {
  var item = {
    id: category + "-placeholder-" + n,
    category: category,
    name: "Product name",
    price: null,
    description: "Short description coming soon.",
    image: null,
    imageAlt: "",
    placeholder: true
  };
  if (food) {
    item.ingredients = "To be added";
    item.allergens = "To be added";
  }
  return item;
}

window.SF_PRODUCTS = [
  sfPlaceholder("seasonal", 1), sfPlaceholder("seasonal", 2), sfPlaceholder("seasonal", 3),
  sfPlaceholder("jams", 1, true), sfPlaceholder("jams", 2, true), sfPlaceholder("jams", 3, true),
  sfPlaceholder("baked", 1, true), sfPlaceholder("baked", 2, true), sfPlaceholder("baked", 3, true)

  /* Example of a real item (copy, edit, and remove `placeholder`):
  ,{
    id: "strawberry-jam",
    category: "jams",
    name: "Strawberry Jam (8 oz)",
    price: 8,
    description: "…",
    image: "assets/products/strawberry-jam.jpg",
    imageAlt: "A jar of strawberry jam tied with a pink ribbon",
    ingredients: "Ingredients: …",
    allergens: "Allergens: none known"
  }
  */
];
