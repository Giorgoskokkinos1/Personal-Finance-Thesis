// Rule hints map everyday descriptions to the user's own category names.
const CATEGORY_RULES = [
  {
    categoryHints: ["food", "restaurant", "dining", "groceries", "meal"],
    keywords: [
      "pizza",
      "burger",
      "restaurant",
      "taverna",
      "coffee",
      "cafe",
      "bakery",
      "supermarket",
      "grocery",
      "groceries",
      "market",
      "lidl",
      "ab",
      "skroutz food",
      "efood",
      "wolt",
    ],
  },
  {
    categoryHints: ["transport", "fuel", "car", "gas", "parking"],
    keywords: [
      "fuel",
      "gas",
      "petrol",
      "shell",
      "bp",
      "eko",
      "parking",
      "taxi",
      "uber",
      "bus",
      "metro",
      "train",
    ],
  },
  {
    categoryHints: ["subscriptions", "subscription", "entertainment"],
    keywords: [
      "netflix",
      "spotify",
      "disney",
      "youtube",
      "icloud",
      "google",
      "microsoft",
      "adobe",
      "prime",
    ],
  },
  {
    categoryHints: ["health", "medical", "pharmacy"],
    keywords: ["pharmacy", "doctor", "hospital", "clinic", "medicine", "dentist"],
  },
  {
    categoryHints: ["utilities", "bills", "electricity", "water", "phone"],
    keywords: [
      "electricity",
      "power",
      "water",
      "phone",
      "internet",
      "cosmote",
      "vodafone",
      "nova",
      "bill",
    ],
  },
  {
    categoryHints: ["rent", "home", "housing"],
    keywords: ["rent", "mortgage", "house", "apartment"],
  },
  {
    categoryHints: ["shopping", "clothes", "retail"],
    keywords: ["zara", "hm", "ikea", "amazon", "clothes", "shoes", "mall"],
  },
  {
    categoryHints: ["salary", "income", "payroll", "wage"],
    keywords: ["salary", "payroll", "wage", "bonus", "commission"],
    type: "INCOME",
  },
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getLearnedMap = () => {
  try {
    return JSON.parse(window.localStorage.getItem("smartCategoryMemory") || "{}");
  } catch (err) {
    return {};
  }
};

const getMemoryKey = (type, description) => {
  // Short keys make learned choices reusable without storing full notes.
  const words = normalize(description).split(" ").filter(Boolean).slice(0, 4);
  return `${type}:${words.join(" ")}`;
};

const findExistingCategory = (categories, type, hints) => {
  const scoped = categories.filter((category) => category.type === type);
  const normalizedHints = hints.map(normalize);

  return scoped.find((category) => {
    const categoryName = normalize(category.name);
    return normalizedHints.some(
      (hint) => categoryName === hint || categoryName.includes(hint)
    );
  });
};

export const rememberCategoryChoice = ({ type, description, category }) => {
  if (!description || !category || !["INCOME", "EXPENSE"].includes(type)) return;

  const key = getMemoryKey(type, description);
  if (!key || key.endsWith(":")) return;

  const learnedMap = getLearnedMap();
  learnedMap[key] = category;
  window.localStorage.setItem("smartCategoryMemory", JSON.stringify(learnedMap));
};

export const forgetCategoryChoice = ({ type, description }) => {
  const key = getMemoryKey(type, description);
  if (!key || key.endsWith(":")) return;

  const learnedMap = getLearnedMap();
  delete learnedMap[key];
  window.localStorage.setItem("smartCategoryMemory", JSON.stringify(learnedMap));
};

export const suggestTransactionCategory = ({ type, description, categories }) => {
  if (!description || !["INCOME", "EXPENSE"].includes(type)) return null;

  const scopedCategories = categories.filter((category) => category.type === type);
  if (scopedCategories.length === 0) return null;

  const normalizedDescription = normalize(description);
  if (normalizedDescription.length < 3) return null;

  const directCategory = scopedCategories.find((category) => {
    const categoryName = normalize(category.name);
    return categoryName.length >= 3 && normalizedDescription.includes(categoryName);
  });

  if (directCategory) {
    return {
      category: directCategory.name,
      confidence: "High",
      reason: "description mentions this category",
      autoApply: true,
    };
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.type && rule.type !== type) continue;

    const matchedKeyword = rule.keywords.find((keyword) =>
      normalizedDescription.includes(normalize(keyword))
    );
    if (!matchedKeyword) continue;

    const category = findExistingCategory(categories, type, rule.categoryHints);
    if (!category) continue;

    return {
      category: category.name,
      confidence: "High",
      reason: `matched "${matchedKeyword}"`,
      autoApply: true,
    };
  }

  // Learned choices require review because users can accidentally teach a bad match.
  const learnedCategory = getLearnedMap()[getMemoryKey(type, description)];
  if (
    learnedCategory &&
    scopedCategories.some((category) => category.name === learnedCategory)
  ) {
    return {
      category: learnedCategory,
      confidence: "Review",
      reason: "learned from your previous choice",
      autoApply: false,
    };
  }

  return null;
};
